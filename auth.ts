import NextAuth from "next-auth"
import { CustomPrismaAdapter } from "@/lib/custom-prisma-adapter"
import { db } from "@/lib/db"
import { authConfig } from "./auth.config"
import { notifyNewUser, notifyStravaAuthSuccess, notifyStravaAuthFailure } from "@/lib/slack-notifications"
import { ensureUserHasSelectedCharity } from "@/lib/charity-helpers"

const hasDatabaseConfigured = Boolean(
  process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim()
)

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...(hasDatabaseConfigured
    ? {
        adapter: CustomPrismaAdapter(db),
        session: {
          strategy: "database" as const,
          maxAge: 30 * 24 * 60 * 60, // 30 days
        },
      }
    : {
        // Local/dev fallback: allow app to boot without DB configured.
        // Auth flows that require persistence will not work until DB env vars are set.
        session: {
          strategy: "jwt" as const,
          maxAge: 30 * 24 * 60 * 60, // 30 days
        },
        // Avoid colliding with an existing database-session cookie.
        // Otherwise a prior session token (random string) will be parsed as a JWE and error.
        cookies: {
          sessionToken: {
            name: "authjs.session-token-jwt",
          },
        },
      }),
  secret: process.env.NEXTAUTH_SECRET,
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, user }) {
      // For Strava, validate permissions before allowing sign-in
      if (account?.provider === "strava") {
        console.log('🔍 signIn callback - validating Strava permissions')
        
        // Get scope from account object or from our stored callback scope
        let scope = account.scope as string | undefined
        
        // If not in account, check the stored scope from callback URL
        if (!scope) {
          // Import and check the stored scope
          const { getStoredCallbackScope } = await import('@/lib/custom-prisma-adapter')
          scope = getStoredCallbackScope() ?? undefined
          console.log('🔍 Retrieved scope from storage:', scope)
        }
        
        if (!scope) {
          console.error('❌ No scope found - cannot validate permissions')
          const errorMsg = 'Authorization failed: No permissions received from Strava'
          
          // Send Slack notification for failed auth
          await notifyStravaAuthFailure({
            userName: user?.name,
            userEmail: user?.email,
            error: errorMsg,
          });
          
          throw new Error(errorMsg)
        }
        
        // Validate scopes
        const requiredScopes = ['activity:read_all', 'profile:read_all', 'activity:write']
        const grantedScopes = scope.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        
        console.log('🔍 Required scopes:', requiredScopes)
        console.log('🔍 Granted scopes:', grantedScopes)
        
        const missingScopes = requiredScopes.filter(
          reqScope => !grantedScopes.includes(reqScope)
        )
        
        if (missingScopes.length > 0) {
          console.error('❌ Missing required permissions:', missingScopes)
          const errorMsg = `Missing required permissions: ${missingScopes.join(', ')}. Please reconnect and grant ALL requested permissions.`
          
          // Send Slack notification for failed auth
          await notifyStravaAuthFailure({
            userName: user?.name,
            userEmail: user?.email,
            error: errorMsg,
            missingScopes,
          });
          
          throw new Error(errorMsg)
        }
        
        console.log('✅ All Strava permissions validated:', grantedScopes)
      }
      
      return true
    },
  },
  events: {
    async createUser({ user }) {
      if (!hasDatabaseConfigured) {
        console.warn(
          "[auth] Database not configured; skipping createUser notification."
        )
        return
      }

      console.log('👋 New user created:', user.email)

      try {
        await ensureUserHasSelectedCharity(user.id!)
      } catch (error) {
        console.error("⚠️  Failed to assign default charity to new user:", error)
      }
      
      // Send Slack notification for new user
      try {
        await notifyNewUser({
          name: user.name ?? null,
          email: user.email ?? null,
        });
      } catch (error) {
        console.error('⚠️  Failed to send new user notification to Slack:', error);
      }
    },
    async linkAccount({ user, account }) {
      if (!hasDatabaseConfigured) {
        console.warn(
          "[auth] Database not configured; skipping linkAccount persistence."
        )
        return
      }

      // When Strava is linked, save athlete data
      // (Permission validation already happened in signIn callback)
      if (account.provider === "strava") {
        console.log('💾 linkAccount event - saving athlete data')
        
        // Fetch and save athlete data
        if (account.access_token) {
          try {
            // Fetch fresh athlete data from Strava using the access token
            const response = await fetch("https://www.strava.com/api/v3/athlete", {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
              },
            })
            
            if (!response.ok) {
              throw new Error(`Failed to fetch athlete data: ${response.status}`)
            }
            
            const athlete = await response.json()
            
            // Get the scope - it might be in account.scope or we need to look it up
            let scopeString = account.scope || ''
            
            // If scope is not in account object, fetch it from the database
            // (This is a workaround for NextAuth not saving scope to Account)
            if (!scopeString) {
              const dbAccount = await db.account.findFirst({
                where: {
                  provider: 'strava',
                  providerAccountId: account.providerAccountId,
                },
                select: { scope: true },
              })
              scopeString = dbAccount?.scope || ''
            }
            
            console.log('💾 Saving athlete with scope:', scopeString)
            
            await db.stravaAthlete.upsert({
              where: { userId: user.id! },
              create: {
                userId: user.id!,
                stravaAthleteId: BigInt(athlete.id),
                username: athlete.username || null,
                firstname: athlete.firstname || null,
                lastname: athlete.lastname || null,
                city: athlete.city || null,
                state: athlete.state || null,
                country: athlete.country || null,
                sex: athlete.sex || null,
                profileMedium: athlete.profile_medium || null,
                profile: athlete.profile || null,
                stravaAuthorized: true,
                permissionsGranted: scopeString || null,
              },
              update: {
                username: athlete.username || null,
                firstname: athlete.firstname || null,
                lastname: athlete.lastname || null,
                city: athlete.city || null,
                state: athlete.state || null,
                country: athlete.country || null,
                sex: athlete.sex || null,
                profileMedium: athlete.profile_medium || null,
                profile: athlete.profile || null,
                stravaAuthorized: true,
                permissionsGranted: scopeString || null,
              },
            })
            
            console.log('✅ Strava athlete data saved successfully')
            
            // Send Slack notification for successful Strava authorization
            try {
              const scopes = scopeString ? scopeString.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
              await notifyStravaAuthSuccess({
                name: user.name ?? null,
                email: user.email ?? null,
                stravaAthleteId: BigInt(athlete.id),
                scopes,
              });
            } catch (error) {
              console.error('⚠️  Failed to send Strava auth success notification to Slack:', error);
            }
          } catch (error) {
            console.error('❌ Error saving Strava athlete data:', error)
            throw error // Throw to prevent incomplete connection
          }
        }
      }
    },
  },
})

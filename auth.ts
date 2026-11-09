import NextAuth from "next-auth"
import { CustomPrismaAdapter } from "@/lib/custom-prisma-adapter"
import { db } from "@/lib/db"
import { authConfig } from "./auth.config"
import { notifyNewUser, notifyStravaAuthSuccess } from "@/lib/slack-notifications"
import { ensureUserHasSelectedCharity } from "@/lib/charity-helpers"
import { getLogger } from "@/lib/logger"
import {
  getStoredCallbackScope,
  normalizeScopeString,
} from "@/lib/strava-scope"

const hasDatabaseConfigured = Boolean(
  process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim()
)

const authLogger = getLogger("auth")

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
    async signIn({ account }) {
      // Only existing Google accounts may sign in while the project is paused.
      if (account?.provider === "google") {
        if (!hasDatabaseConfigured || !account.providerAccountId) {
          return "/auth/error?reason=signup-paused"
        }
        const existingAccount = await db.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
          },
          select: { userId: true },
        })
        if (!existingAccount) return "/auth/error?reason=signup-paused"
      }

      // Also reject callbacks from an authorization started before the pause.
      if (account?.provider === "strava") {
        return "/auth/error?reason=strava-paused"
      }

      return true
    },
  },
  events: {
    async createUser({ user }) {
      if (!hasDatabaseConfigured) {
        authLogger.warn("Database not configured; skipping createUser work")
        return
      }

      authLogger.info("New user created", {
        userEmail: user.email,
        userId: user.id,
      })

      try {
        await ensureUserHasSelectedCharity(user.id!)
      } catch (error) {
        authLogger.error("Failed to assign default charity to new user", {
          error,
          userEmail: user.email,
          userId: user.id,
        })
      }
      
      // Send Slack notification for new user
      try {
        await notifyNewUser({
          id: user.id!,
          name: user.name ?? null,
          email: user.email ?? null,
        });
      } catch (error) {
        authLogger.error("Failed to send new user notification to Slack", {
          error,
          userEmail: user.email,
          userId: user.id,
        });
      }
    },
    async linkAccount({ user, account }) {
      if (!hasDatabaseConfigured) {
        authLogger.warn("Database not configured; skipping linkAccount persistence")
        return
      }

      // When Strava is linked, save athlete data
      // (Permission validation already happened in signIn callback)
      if (account.provider === "strava") {
        authLogger.info("Persisting Strava athlete data after linkAccount", {
          provider: account.provider,
          userEmail: user.email,
          userId: user.id,
        })
        
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
            let scopeString = normalizeScopeString(account.scope) || ''
            
            // If scope is not in account object, fetch it from the database
            // (This is a workaround for NextAuth not saving scope to Account)
            if (!scopeString) {
              const callbackScope = getStoredCallbackScope()
              if (callbackScope) {
                scopeString = callbackScope
              } else {
                const dbAccount = await db.account.findFirst({
                  where: {
                    provider: 'strava',
                    providerAccountId: account.providerAccountId,
                  },
                  select: { scope: true },
                })
                scopeString = dbAccount?.scope || ''
              }
            }
            
            authLogger.debug("Saving Strava athlete data with resolved scope", {
              hasScope: Boolean(scopeString),
              scopeCount: scopeString
                ? scopeString.split(",").filter((value) => value.trim().length > 0).length
                : 0,
              userEmail: user.email,
              userId: user.id,
            })
            
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
            
            authLogger.info("Strava athlete data saved successfully", {
              stravaAthleteId: athlete.id,
              userEmail: user.email,
              userId: user.id,
            })
            
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
              authLogger.error("Failed to send Strava auth success notification to Slack", {
                error,
                stravaAthleteId: athlete.id,
                userEmail: user.email,
                userId: user.id,
              });
            }
          } catch (error) {
            authLogger.error("Error saving Strava athlete data", {
              error,
              userEmail: user.email,
              userId: user.id,
            })
            throw error // Throw to prevent incomplete connection
          }
        }
      }
    },
  },
})

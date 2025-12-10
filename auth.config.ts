import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

// Custom Strava provider for NextAuth v5
// NOTE: Strava's OAuth2 has quirks:
// 1. Returns 'athlete' object in token response (non-standard)
// 2. Requires client credentials in POST body (not HTTP Basic Auth)
function Strava(options: any) {
  return {
    id: "strava",
    name: "Strava",
    type: "oauth" as const,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    // Disable HTTP Basic Auth - Strava needs credentials in POST body
    client: {
      token_endpoint_auth_method: "client_secret_post" as const,
    },
    authorization: {
      url: "https://www.strava.com/oauth/authorize",
      params: {
        scope: "activity:read_all,profile:read_all",
        response_type: "code",
        approval_prompt: "force", // Always show permission screen
      },
    },
    token: {
      url: "https://www.strava.com/oauth/token",
      // NextAuth v5 can handle Strava's response with extra fields
      // The scope comes from the callback URL, not the token response
    },
    userinfo: {
      url: "https://www.strava.com/api/v3/athlete",
      async request({ tokens }: any) {
        const response = await fetch("https://www.strava.com/api/v3/athlete", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        })
        return await response.json()
      },
    },
    profile(profile: any) {
      return {
        id: profile.id.toString(),
        name: `${profile.firstname} ${profile.lastname}`,
        email: profile.email || `${profile.id}@strava.com`,
        image: profile.profile || profile.profile_medium,
      }
    },
  }
}

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Strava({
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Additional validation can go here if needed
      return true
    },
    async redirect({ url, baseUrl }) {
      console.log('🔀 Redirect called:', { url, baseUrl })
      
      // If there's an error, redirect to dashboard with error message
      if (url.includes('/auth/error')) {
        const urlObj = new URL(url)
        const error = urlObj.searchParams.get('error')
        console.log('❌ Auth error detected:', error)
        if (error) {
          return `${baseUrl}/dashboard?error=${encodeURIComponent(error)}`
        }
      }
      
      // After successful Strava connection, go to dashboard
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`
      }
      
      // Default behavior
      return url.startsWith(baseUrl) ? url : baseUrl
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnProfile = nextUrl.pathname.startsWith('/profile')
      
      if (isOnDashboard || isOnProfile) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      }
      
      return true
    },
  },
} satisfies NextAuthConfig


import { handlers } from "@/auth"
import { withCallbackScope } from "@/lib/strava-scope"
import { NextRequest } from "next/server"

// Wrap GET handler to capture scope from callback URL
async function GET_WithScopeCapture(req: NextRequest) {
  // Check if this is a callback from Strava
  const url = new URL(req.url)
  const scope = url.searchParams.get('scope')
  const provider = url.pathname.includes('/callback/strava')
  
  if (provider && scope) {
    console.log('🎯 Captured scope from callback URL:', scope)
    return withCallbackScope(scope, () => handlers.GET(req))
  }
  
  return handlers.GET(req)
}

const POST = handlers.POST

export { GET_WithScopeCapture as GET, POST }

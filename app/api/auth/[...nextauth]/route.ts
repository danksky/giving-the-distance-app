import { handlers } from "@/auth"
import { setCallbackScope } from "@/lib/custom-prisma-adapter"
import { NextRequest } from "next/server"

// Wrap GET handler to capture scope from callback URL
async function GET_WithScopeCapture(req: NextRequest) {
  // Check if this is a callback from Strava
  const url = new URL(req.url)
  const scope = url.searchParams.get('scope')
  const provider = url.pathname.includes('/callback/strava')
  
  if (provider && scope) {
    console.log('🎯 Captured scope from callback URL:', scope)
    setCallbackScope(scope)
  }
  
  return handlers.GET(req)
}

const POST = handlers.POST

export { GET_WithScopeCapture as GET, POST }


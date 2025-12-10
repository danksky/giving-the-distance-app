import { auth, signIn } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Trigger Strava OAuth - will redirect back to dashboard
  return await signIn("strava", { 
    redirectTo: "/dashboard",
    redirect: true,
  })
}


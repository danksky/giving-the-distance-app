import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.redirect(new URL("/settings/strava", request.url))
}


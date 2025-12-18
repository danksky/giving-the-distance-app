import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  }

  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/dashboard?error=User+not+found', process.env.NEXTAUTH_URL || 'http://localhost:3000')
      )
    }

    // Delete Strava account connection
    await db.account.deleteMany({
      where: {
        userId: user.id,
        provider: "strava"
      }
    })

    // Delete Strava athlete data
    await db.stravaAthlete.deleteMany({
      where: { userId: user.id }
    })

    console.log('✅ Strava disconnected successfully for user:', user.email)

    // Redirect back to dashboard with success message
    return NextResponse.redirect(
      new URL('/dashboard?success=Strava+disconnected+successfully', process.env.NEXTAUTH_URL || 'http://localhost:3000')
    )
  } catch (error) {
    console.error("Error disconnecting Strava:", error)
    return NextResponse.redirect(
      new URL('/dashboard?error=Failed+to+disconnect+Strava', process.env.NEXTAUTH_URL || 'http://localhost:3000')
    )
  }
}


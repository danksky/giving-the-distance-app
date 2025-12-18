import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValidStravaToken } from "@/lib/strava-token-refresh";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/auth-helpers";

export async function GET() {
  // Check admin access
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the user's Strava athlete
    const athlete = await db.stravaAthlete.findUnique({
      where: { stravaAthleteId: BigInt(55559568) },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Try to get a valid token (will refresh if needed)
    const token = await getValidStravaToken(athlete.userId);

    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to get valid token' 
      });
    }

    // Test the token by fetching athlete data
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        success: false,
        error: `Token test failed: ${response.status}`,
        tokenPreview: token.substring(0, 20) + '...'
      });
    }

    const athleteData = await response.json();

    return NextResponse.json({ 
      success: true,
      message: 'Token is valid and working',
      athlete: `${athleteData.firstname} ${athleteData.lastname}`,
      tokenPreview: token.substring(0, 20) + '...'
    });
  } catch (error) {
    console.error('Error testing token refresh:', error);
    return NextResponse.json(
      { error: 'Failed to test token refresh' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { notifyGooglePlaceSelection } from "@/lib/slack-notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, businessLocation, placeId } = body;

    if (!businessName || !businessLocation || !placeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send Slack notification
    await notifyGooglePlaceSelection({
      businessName,
      businessLocation,
      placeId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Google place selection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

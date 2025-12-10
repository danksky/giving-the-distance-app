import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * API endpoint to view webhook events
 * GET - List recent webhook events
 */

export async function GET() {
  try {
    const events = await db.stravaWebhookEvent.findMany({
      orderBy: {
        eventTime: 'desc',
      },
      take: 50, // Last 50 events
    });

    // Convert BigInt to string for JSON serialization
    const serializedEvents = events.map(event => ({
      ...event,
      objectId: event.objectId.toString(),
      ownerId: event.ownerId.toString(),
      subscriptionId: event.subscriptionId.toString(),
    }));

    return NextResponse.json({
      success: true,
      count: serializedEvents.length,
      events: serializedEvents,
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook events' },
      { status: 500 }
    );
  }
}

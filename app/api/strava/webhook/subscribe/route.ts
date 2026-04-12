import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLogger, scheduleLogFlush } from "@/lib/logger";

const routeLogger = getLogger("api/strava/webhook/subscribe");

/**
 * Strava Webhook Subscription Management
 * 
 * POST - Create a new webhook subscription
 * GET - View current subscriptions
 * DELETE - Remove webhook subscription
 * 
 * @see https://developers.strava.com/docs/webhooks/
 */

// GET - View current subscriptions
export async function GET() {
  scheduleLogFlush(routeLogger);

  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Strava credentials not configured' },
        { status: 500 }
      );
    }

    // Fetch current subscriptions from Strava
    const response = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions?client_id=${clientId}&client_secret=${clientSecret}`
    );

    if (!response.ok) {
      const error = await response.text();
      routeLogger.error("Failed to fetch Strava webhook subscriptions", {
        error,
        status: response.status,
      });
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: error },
        { status: response.status }
      );
    }

    const subscriptions = await response.json();
    
    // Also get our database records
    const dbSubscriptions = await db.stravaWebhookSubscription.findMany();
    const serializedDbSubscriptions = dbSubscriptions.map((subscription) => ({
      ...subscription,
      subscriptionId: subscription.subscriptionId.toString(),
    }));

    return NextResponse.json({
      strava: subscriptions,
      database: serializedDbSubscriptions,
    });
  } catch (error) {
    routeLogger.error("Unexpected error fetching Strava webhook subscriptions", {
      error,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create webhook subscription
export async function POST(request: NextRequest) {
  scheduleLogFlush(routeLogger);

  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

    if (!clientId || !clientSecret || !verifyToken) {
      return NextResponse.json(
        { error: 'Strava credentials not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const callbackUrl = body.callbackUrl;

    if (!callbackUrl) {
      return NextResponse.json(
        { error: 'callbackUrl is required' },
        { status: 400 }
      );
    }

    routeLogger.info("Creating Strava webhook subscription", {
      callbackUrl,
    });

    // Create subscription with Strava
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      callback_url: callbackUrl,
      verify_token: verifyToken,
    });

    const response = await fetch(
      'https://www.strava.com/api/v3/push_subscriptions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      routeLogger.error("Failed to create Strava webhook subscription", {
        callbackUrl,
        error,
        status: response.status,
      });
      return NextResponse.json(
        { error: 'Failed to create subscription', details: error },
        { status: response.status }
      );
    }

    const subscription = await response.json();
    routeLogger.info("Strava webhook subscription created", {
      callbackUrl,
      subscription,
    });

    // Save to database
    await db.stravaWebhookSubscription.create({
      data: {
        subscriptionId: BigInt(subscription.id),
        callbackUrl: callbackUrl,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    routeLogger.error("Unexpected error creating Strava webhook subscription", {
      error,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Remove webhook subscription
export async function DELETE(request: NextRequest) {
  scheduleLogFlush(routeLogger);

  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Strava credentials not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const subscriptionId = body.subscriptionId;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      );
    }

    routeLogger.info("Deleting Strava webhook subscription", {
      subscriptionId,
    });

    // Delete from Strava
    const response = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions/${subscriptionId}?client_id=${clientId}&client_secret=${clientSecret}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.text();
      routeLogger.error("Failed to delete Strava webhook subscription", {
        error,
        status: response.status,
        subscriptionId,
      });
      return NextResponse.json(
        { error: 'Failed to delete subscription', details: error },
        { status: response.status }
      );
    }

    // Update database record
    await db.stravaWebhookSubscription.updateMany({
      where: { subscriptionId: BigInt(subscriptionId) },
      data: { isActive: false },
    });

    routeLogger.info("Strava webhook subscription deleted", {
      subscriptionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    routeLogger.error("Unexpected error deleting Strava webhook subscription", {
      error,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

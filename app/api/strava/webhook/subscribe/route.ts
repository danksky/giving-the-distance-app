import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
      console.error('Failed to fetch subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: error },
        { status: response.status }
      );
    }

    const subscriptions = await response.json();
    
    // Also get our database records
    const dbSubscriptions = await db.stravaWebhookSubscription.findMany();

    return NextResponse.json({
      strava: subscriptions,
      database: dbSubscriptions,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create webhook subscription
export async function POST(request: NextRequest) {
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

    console.log('📝 Creating Strava webhook subscription...');
    console.log('Callback URL:', callbackUrl);

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
      console.error('Failed to create subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription', details: error },
        { status: response.status }
      );
    }

    const subscription = await response.json();
    console.log('✅ Subscription created:', subscription);

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
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Remove webhook subscription
export async function DELETE(request: NextRequest) {
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

    console.log('🗑️ Deleting Strava webhook subscription:', subscriptionId);

    // Delete from Strava
    const response = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions/${subscriptionId}?client_id=${clientId}&client_secret=${clientSecret}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to delete subscription:', error);
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

    console.log('✅ Subscription deleted');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

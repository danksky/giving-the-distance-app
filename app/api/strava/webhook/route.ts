import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValidStravaToken } from "@/lib/strava-token-refresh";
import { matchActivityWithSponsor } from "@/lib/sponsor-matching";
import { generateUniqueShortcode } from "@/lib/shortcode";

/**
 * Strava Webhook Endpoint
 * 
 * Handles two types of requests:
 * 1. GET - Verification challenge when creating subscription
 * 2. POST - Webhook events for activities
 * 
 * @see https://developers.strava.com/docs/webhooks/
 */

// GET handler - Webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Strava sends these parameters for verification
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('🔍 Webhook verification request:', { mode, token, challenge });

  // Verify the token matches our configured token
  const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
  
  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ Webhook verification successful');
    // Respond with the challenge to verify the endpoint
    return NextResponse.json({ 'hub.challenge': challenge });
  } else {
    console.error('❌ Webhook verification failed - token mismatch');
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 }
    );
  }
}

// POST handler - Webhook events
export async function POST(request: NextRequest) {
  let webhookEventId: string | null = null;
  
  try {
    const event = await request.json();
    
    console.log('📨 Received Strava webhook event:', JSON.stringify(event, null, 2));

    // Event structure:
    // {
    //   "object_type": "activity" | "athlete",
    //   "object_id": 12345,
    //   "aspect_type": "create" | "update" | "delete",
    //   "updates": {},
    //   "owner_id": 123456,
    //   "subscription_id": 12345,
    //   "event_time": 1516126040
    // }

    const {
      object_type,
      object_id,
      aspect_type,
      owner_id,
      subscription_id,
      event_time,
      updates,
    } = event;

    // Log the webhook event to database
    const webhookEvent = await db.stravaWebhookEvent.create({
      data: {
        objectType: object_type,
        objectId: BigInt(object_id),
        aspectType: aspect_type,
        ownerId: BigInt(owner_id),
        subscriptionId: BigInt(subscription_id),
        eventTime: new Date(event_time * 1000), // Convert Unix timestamp to Date
        updates: updates || null,
        rawPayload: event,
        processed: false,
      },
    });
    
    webhookEventId = webhookEvent.id;
    console.log(`💾 Webhook event logged: ${webhookEventId}`);

    // Handle activity events
    if (object_type === 'activity') {
      console.log(`🏃 Activity ${aspect_type} event for activity ${object_id} by athlete ${owner_id}`);

      // Find the user by their Strava athlete ID
      const stravaAthlete = await db.stravaAthlete.findUnique({
        where: { stravaAthleteId: BigInt(owner_id) },
        include: { user: true },
      });

      if (!stravaAthlete) {
        const errorMessage = `No user found for Strava athlete ${owner_id}`;
        console.warn(`⚠️ ${errorMessage}`);
        
        // Mark webhook event as processed with error
        if (webhookEventId) {
          await db.stravaWebhookEvent.update({
            where: { id: webhookEventId },
            data: { 
              processed: true,
              processingError: errorMessage,
            },
          });
        }
        
        // Still return 200 to acknowledge receipt
        return NextResponse.json({ success: true });
      }

      // Get a valid access token (will refresh if expired)
      const accessToken = await getValidStravaToken(stravaAthlete.userId);

      if (!accessToken) {
        console.error('❌ No valid Strava access token available for user');
        
        // Mark webhook event as failed with error
        if (webhookEventId) {
          await db.stravaWebhookEvent.update({
            where: { id: webhookEventId },
            data: { 
              processed: true,
              processingError: 'Failed to get valid Strava access token',
            },
          });
        }
        
        return NextResponse.json({ success: true });
      }

      // Handle different event types
      if (aspect_type === 'create') {
        // Fetch full activity details from Strava
        console.log(`📥 Fetching activity ${object_id} from Strava API...`);
        
        const activityResponse = await fetch(
          `https://www.strava.com/api/v3/activities/${object_id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!activityResponse.ok) {
          const errorText = await activityResponse.text();
          const errorMessage = `Failed to fetch activity: HTTP ${activityResponse.status} - ${errorText}`;
          console.error(`❌ ${errorMessage}`);
          
          // Mark webhook event as failed
          if (webhookEventId) {
            await db.stravaWebhookEvent.update({
              where: { id: webhookEventId },
              data: { 
                processed: true,
                processingError: errorMessage,
              },
            });
          }
          
          return NextResponse.json({ success: true });
        }

        const activity = await activityResponse.json();
        console.log('📊 Activity data:', JSON.stringify(activity, null, 2));

        // Generate unique shortcode for new activities
        const shortcode = await generateUniqueShortcode();
        
        if (!shortcode) {
          console.error('⚠️ Failed to generate unique shortcode for activity');
        }

        // Store or update activity in database (use upsert to handle duplicates)
        const savedActivity = await db.activity.upsert({
          where: {
            stravaActivityId: BigInt(activity.id),
          },
          create: {
            userId: stravaAthlete.userId,
            stravaActivityId: BigInt(activity.id),
            shortcode: shortcode || undefined, // Use generated shortcode
            name: activity.name,
            type: activity.type,
            distanceMeters: activity.distance ? parseFloat(activity.distance) : null,
            movingTimeSeconds: activity.moving_time,
            elapsedTimeSeconds: activity.elapsed_time,
            totalElevationGain: activity.total_elevation_gain
              ? parseFloat(activity.total_elevation_gain)
              : null,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local
              ? new Date(activity.start_date_local)
              : null,
            timezone: activity.timezone,
            isManual: activity.manual || false,
            isPrivate: activity.private || false,
            deletedAt: null, // Ensure new activities are not marked as deleted
          },
          update: {
            name: activity.name,
            type: activity.type,
            distanceMeters: activity.distance ? parseFloat(activity.distance) : null,
            movingTimeSeconds: activity.moving_time,
            elapsedTimeSeconds: activity.elapsed_time,
            totalElevationGain: activity.total_elevation_gain
              ? parseFloat(activity.total_elevation_gain)
              : null,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local
              ? new Date(activity.start_date_local)
              : null,
            timezone: activity.timezone,
            isManual: activity.manual || false,
            isPrivate: activity.private || false,
            deletedAt: null, // If activity was previously deleted and is now re-created, undelete it
            // Don't update shortcode on update - keep original
          },
        });

        console.log(`✅ Activity ${object_id} saved successfully`);
        
        // Process sponsor matching and description update
        let descriptionUpdated = false;
        let descriptionUpdateError: string | null = null;
        
        try {
          console.log('🎯 Starting sponsor matching process...');
          
          const matchingResult = await matchActivityWithSponsor(
            {
              id: savedActivity.id,
              stravaActivityId: savedActivity.stravaActivityId,
              userId: savedActivity.userId,
              athleteId: stravaAthlete.id,
              stravaAthleteId: stravaAthlete.stravaAthleteId,
              name: savedActivity.name,
              type: savedActivity.type,
              description: activity.description,
            },
            accessToken
          );

          console.log(`📊 Matching result: ${matchingResult.result}`);
          
          if (matchingResult.success) {
            descriptionUpdated = true;
            console.log(`✅ Successfully matched activity with campaign ${matchingResult.campaignId}`);
          } else {
            // Log the reason for not matching
            console.log(`ℹ️  Activity not matched: ${matchingResult.result} - ${matchingResult.message || matchingResult.error}`);
            
            // Only set error if it was an actual failure (not just a skip condition)
            if (matchingResult.error) {
              descriptionUpdateError = matchingResult.error;
            }
          }
        } catch (error) {
          descriptionUpdateError = error instanceof Error ? error.message : String(error);
          console.error('❌ Error in sponsor matching:', error);
        }
        
        // Mark webhook event as processed with description update status
        if (webhookEventId) {
          console.log(`📊 Updating webhook event status: descriptionUpdated=${descriptionUpdated}, error=${descriptionUpdateError || 'none'}`);
          await db.stravaWebhookEvent.update({
            where: { id: webhookEventId },
            data: { 
              processed: true,
              descriptionUpdated,
              descriptionUpdateError,
            },
          });
          console.log(`✅ Webhook event ${webhookEventId} marked as processed`);
        }
      } else if (aspect_type === 'update') {
        console.log(`📝 Activity ${object_id} was updated`);
        console.log(`📝 Update fields:`, JSON.stringify(updates, null, 2));
        
        // Fetch updated activity data from Strava
        console.log(`📥 Fetching updated activity ${object_id} from Strava API...`);
        
        const activityResponse = await fetch(
          `https://www.strava.com/api/v3/activities/${object_id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!activityResponse.ok) {
          const errorText = await activityResponse.text();
          const errorMessage = `Failed to fetch updated activity: HTTP ${activityResponse.status} - ${errorText}`;
          console.error(`❌ ${errorMessage}`);
          
          // Mark webhook event as failed
          if (webhookEventId) {
            await db.stravaWebhookEvent.update({
              where: { id: webhookEventId },
              data: { 
                processed: true,
                processingError: errorMessage,
              },
            });
          }
          
          return NextResponse.json({ success: true });
        }

        const activity = await activityResponse.json();
        console.log('📊 Updated activity data:', JSON.stringify(activity, null, 2));

        // Upsert activity - update if exists, create if doesn't (self-healing)
        await db.activity.upsert({
          where: {
            stravaActivityId: BigInt(object_id),
          },
          create: {
            userId: stravaAthlete.userId,
            stravaActivityId: BigInt(activity.id),
            name: activity.name,
            type: activity.type,
            distanceMeters: activity.distance ? parseFloat(activity.distance) : null,
            movingTimeSeconds: activity.moving_time,
            elapsedTimeSeconds: activity.elapsed_time,
            totalElevationGain: activity.total_elevation_gain
              ? parseFloat(activity.total_elevation_gain)
              : null,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local
              ? new Date(activity.start_date_local)
              : null,
            timezone: activity.timezone,
            isManual: activity.manual || false,
            isPrivate: activity.private || false,
            deletedAt: null,
          },
          update: {
            name: activity.name,
            type: activity.type,
            distanceMeters: activity.distance ? parseFloat(activity.distance) : null,
            movingTimeSeconds: activity.moving_time,
            elapsedTimeSeconds: activity.elapsed_time,
            totalElevationGain: activity.total_elevation_gain
              ? parseFloat(activity.total_elevation_gain)
              : null,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            startDateLocal: activity.start_date_local
              ? new Date(activity.start_date_local)
              : null,
            timezone: activity.timezone,
            isManual: activity.manual || false,
            isPrivate: activity.private || false,
            deletedAt: null, // If activity was deleted and then updated, undelete it
          },
        });

        console.log(`✅ Activity ${object_id} updated successfully (or created if missing)`);

        
        // Mark webhook event as processed
        if (webhookEventId) {
          await db.stravaWebhookEvent.update({
            where: { id: webhookEventId },
            data: { processed: true },
          });
        }
      } else if (aspect_type === 'delete') {
        console.log(`🗑️ Activity ${object_id} was deleted`);
        
        // Soft delete - mark as deleted but keep the data
        const result = await db.activity.updateMany({
          where: {
            stravaActivityId: BigInt(object_id),
            deletedAt: null, // Only update if not already deleted
          },
          data: {
            deletedAt: new Date(),
          },
        });

        if (result.count > 0) {
          console.log(`✅ Activity ${object_id} marked as deleted (soft delete)`);
        } else {
          console.log(`⚠️ Activity ${object_id} not found or already deleted`);
        }
        
        // Mark webhook event as processed
        if (webhookEventId) {
          await db.stravaWebhookEvent.update({
            where: { id: webhookEventId },
            data: { processed: true },
          });
        }
      }
    } else if (object_type === 'athlete') {
      console.log(`👤 Athlete event: ${aspect_type} for athlete ${owner_id}`);
      
      if (aspect_type === 'update' && event.updates?.authorized === 'false') {
        // User deauthorized the app
        console.log(`❌ Athlete ${owner_id} deauthorized the app`);
        
        // Update the athlete record
        await db.stravaAthlete.updateMany({
          where: { stravaAthleteId: BigInt(owner_id) },
          data: { stravaAuthorized: false },
        });
      }
      
      // Mark athlete webhook event as processed
      if (webhookEventId) {
        await db.stravaWebhookEvent.update({
          where: { id: webhookEventId },
          data: { processed: true },
        });
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    
    // Log error to webhook event if we have an ID
    if (webhookEventId) {
      try {
        await db.stravaWebhookEvent.update({
          where: { id: webhookEventId },
          data: {
            processingError: error instanceof Error ? error.message : String(error),
          },
        });
      } catch (dbError) {
        console.error('❌ Failed to log error to database:', dbError);
      }
    }
    
    // Still return 200 to avoid Strava retrying
    return NextResponse.json({ success: true });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValidStravaToken } from "@/lib/strava-token-refresh";
import { matchActivityWithSponsor } from "@/lib/sponsor-matching";
import { generateUniqueShortcode } from "@/lib/shortcode";
import { fetchAndGenerateGPX } from "@/lib/gpx-generator";
import { uploadGPXToBlob, isBlobStorageConfigured } from "@/lib/gpx-storage";
import { notifyNewActivity, notifyActivityDeleted, notifyStravaDeauthorization } from "@/lib/slack-notifications";
import { formatSkippedDescriptionUpdateMessage } from "@/lib/strava-description-updates";
import { recordStravaActivityHistory } from "@/lib/strava-activity-history";
import { getLogger, scheduleLogFlush } from "@/lib/logger";

const routeLogger = getLogger("api/strava/webhook");

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
  scheduleLogFlush(routeLogger);

  const searchParams = request.nextUrl.searchParams;
  
  // Strava sends these parameters for verification
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  routeLogger.info("Received Strava webhook verification request", {
    challengePresent: Boolean(challenge),
    mode,
    tokenMatchesExpected: token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN,
  });

  // Verify the token matches our configured token
  const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
  
  if (mode === 'subscribe' && token === expectedToken) {
    routeLogger.info("Strava webhook verification succeeded", {
      mode,
    });
    // Respond with the challenge to verify the endpoint
    return NextResponse.json({ 'hub.challenge': challenge });
  } else {
    routeLogger.error("Strava webhook verification failed", {
      mode,
      tokenMatchesExpected: token === expectedToken,
    });
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 }
    );
  }
}

/**
 * Process and store GPX file for an activity
 * Only downloads if we don't already have it
 */
async function processAndStoreGPX(
  activityId: string,
  stravaActivityId: bigint,
  userId: string,
  accessToken: string,
  activityData: {
    name: string;
    startDate?: Date;
    type?: string;
  },
  existingGpxUrl?: string | null
): Promise<string | null> {
  // Skip if blob storage is not configured
  if (!isBlobStorageConfigured()) {
    routeLogger.warn("Blob storage not configured; skipping GPX download", {
      activityId,
      stravaActivityId,
      userId,
    });
    return null;
  }

  // Skip if we already have a GPX file
  if (existingGpxUrl) {
    routeLogger.debug("GPX already exists for activity", {
      activityId,
      existingGpxUrl,
      stravaActivityId,
      userId,
    });
    return existingGpxUrl;
  }

  try {
    routeLogger.info("Processing GPX for activity", {
      activityId,
      stravaActivityId,
      userId,
    });

    // Fetch streams and generate GPX
    const gpxContent = await fetchAndGenerateGPX(
      stravaActivityId.toString(),
      accessToken,
      {
        name: activityData.name,
        startDate: activityData.startDate,
        type: activityData.type,
      }
    );

    if (!gpxContent) {
      routeLogger.warn("No GPX content generated for activity", {
        activityId,
        reason: "likely-no-gps-data",
        stravaActivityId,
        userId,
      });
      return null;
    }

    // Upload to Vercel Blob
    const blobUrl = await uploadGPXToBlob(
      gpxContent,
      stravaActivityId.toString(),
      userId
    );

    if (blobUrl) {
      routeLogger.info("GPX stored successfully", {
        activityId,
        blobUrl,
        stravaActivityId,
        userId,
      });
      return blobUrl;
    } else {
      routeLogger.error("Failed to upload GPX to blob storage", {
        activityId,
        stravaActivityId,
        userId,
      });
      return null;
    }
  } catch (error) {
    routeLogger.error("Error processing GPX for activity", {
      activityId,
      error,
      stravaActivityId,
      userId,
    });
    return null;
  }
}

async function processSponsorMatchingForWebhook(params: {
  activity: {
    id: string;
    stravaActivityId: bigint;
    userId: string;
    isPrivate: boolean;
    name: string | null;
    type: string;
  };
  activityDescription?: string | null;
  accessToken: string;
  stravaAthlete: {
    id: string;
    stravaAthleteId: bigint;
  };
  webhookEventId: string | null;
}) {
  const { activity, activityDescription, accessToken, stravaAthlete, webhookEventId } =
    params;

  const existingMatch = await db.sponsorMatch.findUnique({
    where: { activityId: activity.id },
  });

  const webhookLogger = routeLogger.child({
    activityId: activity.id,
    stravaActivityId: activity.stravaActivityId,
    userId: activity.userId,
    webhookEventId,
  });

  if (existingMatch) {
    webhookLogger.info("Skipping sponsor matching because a match already exists", {
      existingResult: existingMatch.result,
    });

    if (webhookEventId) {
      await db.stravaWebhookEvent.update({
        where: { id: webhookEventId },
        data: { processed: true },
      });
    }

    return;
  }

  let descriptionUpdated = false;
  let descriptionUpdateError: string | null = null;

  try {
    webhookLogger.info("Starting sponsor matching for webhook activity");

    const matchingResult = await matchActivityWithSponsor(
      {
        id: activity.id,
        stravaActivityId: activity.stravaActivityId,
        userId: activity.userId,
        athleteId: stravaAthlete.id,
        stravaAthleteId: stravaAthlete.stravaAthleteId,
        isPrivate: activity.isPrivate,
        name: activity.name,
        type: activity.type,
        description: activityDescription,
      },
      accessToken
    );

    webhookLogger.info("Completed sponsor matching for webhook activity", {
      campaignId: matchingResult.campaignId,
      matchingResult: matchingResult.result,
      success: matchingResult.success,
    });

    if (matchingResult.success) {
      descriptionUpdated = matchingResult.descriptionUpdated ?? false;
      if (matchingResult.descriptionUpdateSkipped && matchingResult.message) {
        descriptionUpdateError = formatSkippedDescriptionUpdateMessage(
          matchingResult.message
        );
      }
      webhookLogger.info("Activity matched with sponsor campaign", {
        campaignId: matchingResult.campaignId,
        descriptionUpdated,
      });
    } else {
      webhookLogger.info("Activity was not matched to a sponsor campaign", {
        matchingResult: matchingResult.result,
        message: matchingResult.message,
        errorMessage: matchingResult.error,
      });

      if (matchingResult.error) {
        descriptionUpdateError = matchingResult.error;
      }
    }
  } catch (error) {
    descriptionUpdateError = error instanceof Error ? error.message : String(error);
    webhookLogger.error("Error during sponsor matching", {
      error,
    });
  }

  if (webhookEventId) {
    webhookLogger.info("Updating webhook event after sponsor matching", {
      descriptionUpdated,
      descriptionUpdateError,
    });
    await db.stravaWebhookEvent.update({
      where: { id: webhookEventId },
      data: {
        processed: true,
        descriptionUpdated,
        descriptionUpdateError,
      },
    });
    webhookLogger.info("Webhook event marked as processed");
  }
}

// POST handler - Webhook events
export async function POST(request: NextRequest) {
  scheduleLogFlush(routeLogger);

  let webhookEventId: string | null = null;
  
  try {
    const event = await request.json();

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

    const eventLogger = routeLogger.child({
      aspectType: aspect_type,
      objectId: object_id,
      objectType: object_type,
      ownerId: owner_id,
      subscriptionId: subscription_id,
    });

    eventLogger.info("Received Strava webhook event", {
      eventTime: event_time,
      updates,
    });

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
    eventLogger.info("Persisted Strava webhook event", {
      webhookEventId,
    });

    // Handle activity events
    if (object_type === 'activity') {
      eventLogger.info("Handling Strava activity webhook event");

      // Handle delete events first - they don't need user/athlete lookup or API access
      // This is important: users who deauthorize can still trigger delete events
      if (aspect_type === 'delete') {
        eventLogger.info("Handling Strava activity deletion");
        
        // First, get the activity details for notification
        const activity = await db.activity.findFirst({
          where: {
            stravaActivityId: BigInt(object_id),
            deletedAt: null,
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });
        
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
          eventLogger.info("Soft-deleted activity after webhook", {
            updatedCount: result.count,
          });

          await recordStravaActivityHistory({
            activityId: activity?.id ?? null,
            stravaActivityId: BigInt(object_id),
            webhookEventId,
            source: "strava_webhook",
            eventType: "activity_deleted",
            aspectType: aspect_type,
            metadata: {
              deletedAt: new Date().toISOString(),
              updatedCount: result.count,
            },
          });
          
          // Send Slack notification
          if (activity) {
            await notifyActivityDeleted({
              stravaActivityId: activity.stravaActivityId,
              name: activity.name,
              type: activity.type,
              userName: activity.user.name ?? undefined,
              userEmail: activity.user.email ?? undefined,
            });
          }
        } else {
          eventLogger.warn("Activity not found or already deleted");
        }
        
        // Mark webhook event as processed
        if (webhookEventId) {
          await db.stravaWebhookEvent.update({
            where: { id: webhookEventId },
            data: { processed: true },
          });
        }
        
        return NextResponse.json({ success: true });
      }

      // For create/update events, we need to find the user by their Strava athlete ID
      const stravaAthlete = await db.stravaAthlete.findUnique({
        where: { stravaAthleteId: BigInt(owner_id) },
        include: { user: true },
      });

      if (!stravaAthlete) {
        const errorMessage = `No user found for Strava athlete ${owner_id}`;
        eventLogger.warn("No user found for Strava athlete", {
          errorMessage,
        });
        
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

      // Get a valid access token for create/update events (will refresh if expired)
      const accessToken = await getValidStravaToken(stravaAthlete.userId);

      if (!accessToken) {
        eventLogger.error("No valid Strava access token available", {
          userId: stravaAthlete.userId,
        });
        
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

      // Handle create and update event types
      if (aspect_type === 'create') {
        // Fetch full activity details from Strava
        eventLogger.info("Fetching created activity from Strava API");
        
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
          eventLogger.error("Failed to fetch created activity from Strava API", {
            errorMessage,
            status: activityResponse.status,
          });
          
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
        eventLogger.info("Fetched created activity from Strava API", {
          activitySummary: {
            id: activity.id,
            name: activity.name,
            private: activity.private,
            type: activity.type,
          },
        });

        // Generate unique shortcode for new activities
        const shortcode = await generateUniqueShortcode();
        
        if (!shortcode) {
          eventLogger.error("Failed to generate unique shortcode for activity");
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

        eventLogger.info("Saved activity from create webhook", {
          activityId: savedActivity.id,
        });

        await recordStravaActivityHistory({
          activityId: savedActivity.id,
          stravaActivityId: savedActivity.stravaActivityId,
          webhookEventId,
          source: "strava_webhook",
          eventType: "activity_snapshot",
          aspectType: aspect_type,
          name: activity.name,
          type: activity.type,
          isPrivate: activity.private || false,
          visibility: activity.visibility ?? null,
          descriptionText: activity.description ?? "",
          updates,
          metadata: {
            sourceState: "fetched_after_create_webhook",
          },
        });
        
        // Process GPX download and storage (non-blocking - errors won't fail the webhook)
        let gpxBlobUrl: string | null = null;
        try {
          gpxBlobUrl = await processAndStoreGPX(
            savedActivity.id,
            savedActivity.stravaActivityId,
            savedActivity.userId,
            accessToken,
            {
              name: savedActivity.name || 'Untitled Activity',
              startDate: savedActivity.startDate || undefined,
              type: savedActivity.type,
            },
            null // No existing GPX for new activities
          );

          // Update activity with GPX URL if we got one
          if (gpxBlobUrl) {
            await db.activity.update({
              where: { id: savedActivity.id },
              data: { gpxBlobUrl },
            });
            eventLogger.info("Updated activity with GPX URL", {
              activityId: savedActivity.id,
              gpxBlobUrl,
            });
          }
        } catch (error) {
          eventLogger.error("GPX processing failed for create webhook", {
            error,
          });
          // Don't fail the webhook - GPX is optional
        }
        
        await processSponsorMatchingForWebhook({
          activity: savedActivity,
          activityDescription: activity.description,
          accessToken,
          stravaAthlete: {
            id: stravaAthlete.id,
            stravaAthleteId: stravaAthlete.stravaAthleteId,
          },
          webhookEventId,
        });

        try {
          const activityNotificationData = await db.activity.findUnique({
            where: { id: savedActivity.id },
            select: {
              id: true,
              charityCommitments: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  charity: {
                    select: {
                      name: true,
                    },
                  },
                  campaign: {
                    select: {
                      sponsor: {
                        select: {
                          businessName: true,
                        },
                      },
                    },
                  },
                },
              },
              sponsorMatches: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  campaign: {
                    select: {
                      sponsor: {
                        select: {
                          businessName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          const latestCommitment = activityNotificationData?.charityCommitments[0];
          const latestSponsorMatch = activityNotificationData?.sponsorMatches[0];

          await notifyNewActivity({
            id: savedActivity.id,
            stravaActivityId: savedActivity.stravaActivityId,
            name: savedActivity.name,
            type: savedActivity.type,
            distanceMeters: savedActivity.distanceMeters?.toNumber() ?? null,
            userName: stravaAthlete.user.name ?? undefined,
            userEmail: stravaAthlete.user.email ?? undefined,
            sponsorName:
              latestCommitment?.campaign.sponsor.businessName ??
              latestSponsorMatch?.campaign?.sponsor.businessName ??
              null,
            charityName: latestCommitment?.charity.name ?? null,
          });
        } catch (error) {
          eventLogger.error("Slack notification failed for created activity", {
            error,
          });
        }
      } else if (aspect_type === 'update') {
        eventLogger.info("Handling Strava activity update", {
          updates,
        });
        
        // Fetch updated activity data from Strava
        eventLogger.info("Fetching updated activity from Strava API");
        
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
          eventLogger.error("Failed to fetch updated activity from Strava API", {
            errorMessage,
            status: activityResponse.status,
          });
          
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
        eventLogger.info("Fetched updated activity from Strava API", {
          activitySummary: {
            id: activity.id,
            name: activity.name,
            private: activity.private,
            type: activity.type,
          },
        });

        // Upsert activity - update if exists, create if doesn't (self-healing)
        const updatedActivity = await db.activity.upsert({
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

        eventLogger.info("Upserted activity from update webhook", {
          activityId: updatedActivity.id,
        });

        await recordStravaActivityHistory({
          activityId: updatedActivity.id,
          stravaActivityId: updatedActivity.stravaActivityId,
          webhookEventId,
          source: "strava_webhook",
          eventType: "activity_snapshot",
          aspectType: aspect_type,
          name: activity.name,
          type: activity.type,
          isPrivate: activity.private || false,
          visibility: activity.visibility ?? null,
          descriptionText: activity.description ?? "",
          updates,
          metadata: {
            sourceState: "fetched_after_update_webhook",
          },
        });

        // Process GPX download and storage if we don't have it yet
        try {
          const gpxBlobUrl = await processAndStoreGPX(
            updatedActivity.id,
            updatedActivity.stravaActivityId,
            updatedActivity.userId,
            accessToken,
            {
              name: updatedActivity.name || 'Untitled Activity',
              startDate: updatedActivity.startDate || undefined,
              type: updatedActivity.type,
            },
            updatedActivity.gpxBlobUrl // Check if we already have it
          );

          // Update activity with GPX URL if we got a new one
          if (gpxBlobUrl && gpxBlobUrl !== updatedActivity.gpxBlobUrl) {
            await db.activity.update({
              where: { id: updatedActivity.id },
              data: { gpxBlobUrl },
            });
            eventLogger.info("Updated activity with refreshed GPX URL", {
              activityId: updatedActivity.id,
              gpxBlobUrl,
            });
          }
        } catch (error) {
          eventLogger.error("GPX processing failed for update webhook", {
            error,
          });
          // Don't fail the webhook - GPX is optional
        }

        await processSponsorMatchingForWebhook({
          activity: updatedActivity,
          activityDescription: activity.description,
          accessToken,
          stravaAthlete: {
            id: stravaAthlete.id,
            stravaAthleteId: stravaAthlete.stravaAthleteId,
          },
          webhookEventId,
        });
      }
    } else if (object_type === 'athlete') {
      eventLogger.info("Handling Strava athlete webhook event");
      
      if (aspect_type === 'update' && event.updates?.authorized === 'false') {
        // User deauthorized the app
        eventLogger.warn("Athlete deauthorized the app");
        
        // Get athlete details for notification before updating
        const athlete = await db.stravaAthlete.findUnique({
          where: { stravaAthleteId: BigInt(owner_id) },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });
        
        // Update the athlete record
        await db.stravaAthlete.updateMany({
          where: { stravaAthleteId: BigInt(owner_id) },
          data: { stravaAuthorized: false },
        });
        
        // Send Slack notification
        if (athlete) {
          try {
            await notifyStravaDeauthorization({
              stravaAthleteId: athlete.stravaAthleteId,
              userName: athlete.user.name,
              userEmail: athlete.user.email,
            });
          } catch (error) {
            eventLogger.error("Slack notification failed for athlete deauthorization", {
              error,
            });
          }
        }
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
    routeLogger.error("Unexpected error while processing Strava webhook", {
      error,
      webhookEventId,
    });
    
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
        routeLogger.error("Failed to persist webhook processing error to database", {
          dbError,
          webhookEventId,
        });
      }
    }
    
    // Still return 200 to avoid Strava retrying
    return NextResponse.json({ success: true });
  }
}

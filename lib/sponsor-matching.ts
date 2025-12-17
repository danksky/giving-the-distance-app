/**
 * Sponsor Matching Service
 * 
 * Handles matching activities with sponsor campaigns and updating Strava descriptions.
 * Implements idempotency and budget tracking.
 */

import { db } from '@/lib/db';
import { PlacementResult } from '@prisma/client';

// Constants
export const COMMITMENT_AMOUNT_CENTS = 10; // $0.10
const GTD_MARKER = '#GTD';

export interface MatchingResult {
  success: boolean;
  result: PlacementResult;
  placementLogId?: string;
  charityCommitmentId?: string;
  campaignId?: string;
  message?: string;
  error?: string;
}

export interface ActivityData {
  id: string; // Internal activity ID
  stravaActivityId: bigint;
  userId: string;
  athleteId: string;
  stravaAthleteId: bigint;
  name?: string | null;
  type: string;
  description?: string | null;
}

/**
 * Main entry point for sponsor matching
 * Checks idempotency, finds a campaign, and processes the match
 */
export async function matchActivityWithSponsor(
  activity: ActivityData,
  accessToken: string
): Promise<MatchingResult> {
  try {
    // Step 1: Check if activity already has a placement log (idempotency)
    const existingPlacement = await db.placementLog.findUnique({
      where: { activityId: activity.id },
    });

    if (existingPlacement) {
      console.log(`✅ Activity ${activity.stravaActivityId} already has placement log: ${existingPlacement.result}`);
      return {
        success: false,
        result: PlacementResult.SKIPPED_ALREADY_SPONSORED,
        placementLogId: existingPlacement.id,
        message: 'Activity already has a placement log',
      };
    }

    // Step 2: Find an active campaign with budget
    const campaign = await findActiveCampaign();

    if (!campaign) {
      // Log as SKIPPED_NO_ACTIVE_CAMPAIGN
      const placementLog = await db.placementLog.create({
        data: {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: null,
          result: PlacementResult.SKIPPED_NO_ACTIVE_CAMPAIGN,
          decrementCents: 0,
          notes: 'No active campaign with budget available',
        },
      });

      return {
        success: false,
        result: PlacementResult.SKIPPED_NO_ACTIVE_CAMPAIGN,
        placementLogId: placementLog.id,
        message: 'No active campaign available',
      };
    }

    // Step 3: Check if campaign has enough budget
    if (campaign.budgetRemainingCents < COMMITMENT_AMOUNT_CENTS) {
      // Log as SKIPPED_NO_BUDGET
      const placementLog = await db.placementLog.create({
        data: {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: PlacementResult.SKIPPED_NO_BUDGET,
          decrementCents: 0,
          notes: `Campaign budget (${campaign.budgetRemainingCents} cents) insufficient for commitment (${COMMITMENT_AMOUNT_CENTS} cents)`,
        },
      });

      return {
        success: false,
        result: PlacementResult.SKIPPED_NO_BUDGET,
        placementLogId: placementLog.id,
        campaignId: campaign.id,
        message: 'Campaign has insufficient budget',
      };
    }

    // Step 4: Update Strava activity description
    const updateResult = await updateStravaDescription(
      activity,
      campaign,
      accessToken
    );

    if (!updateResult.success) {
      // Log as SKIPPED_UPDATE_FAILED
      const placementLog = await db.placementLog.create({
        data: {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: PlacementResult.SKIPPED_UPDATE_FAILED,
          decrementCents: 0,
          notes: `Failed to update Strava description: ${updateResult.error}`,
        },
      });

      return {
        success: false,
        result: PlacementResult.SKIPPED_UPDATE_FAILED,
        placementLogId: placementLog.id,
        campaignId: campaign.id,
        error: updateResult.error,
      };
    }

    // Step 5: Get user's selected charity
    const user = await db.user.findUnique({
      where: { id: activity.userId },
      select: { selectedCharityId: true },
    });

    if (!user?.selectedCharityId) {
      // Log as SKIPPED_UPDATE_FAILED with note about missing charity
      const placementLog = await db.placementLog.create({
        data: {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: PlacementResult.SKIPPED_UPDATE_FAILED,
          decrementCents: 0,
          notes: 'User has no selected charity',
        },
      });

      return {
        success: false,
        result: PlacementResult.SKIPPED_UPDATE_FAILED,
        placementLogId: placementLog.id,
        campaignId: campaign.id,
        error: 'User has no selected charity',
      };
    }

    // Step 6: Everything successful - create records in transaction
    const selectedCharityId = user.selectedCharityId; // Already verified to be non-null above
    
    const result = await db.$transaction(async (tx) => {
      // Decrement campaign budget
      await tx.campaign.update({
        where: { id: campaign.id },
        data: {
          budgetRemainingCents: {
            decrement: COMMITMENT_AMOUNT_CENTS,
          },
        },
      });

      // Create placement log
      const placementLog = await tx.placementLog.create({
        data: {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: PlacementResult.MATCHED,
          decrementCents: COMMITMENT_AMOUNT_CENTS,
          notes: 'Successfully matched and description updated',
        },
      });

      // Create charity commitment
      const charityCommitment = await tx.charityCommitment.create({
        data: {
          userId: activity.userId,
          charityId: selectedCharityId!, // Non-null assertion safe due to check above
          campaignId: campaign.id,
          activityId: activity.id,
          amountCents: COMMITMENT_AMOUNT_CENTS,
        },
      });

      return { placementLog, charityCommitment };
    });

    console.log(`✅ Successfully matched activity ${activity.stravaActivityId} with campaign ${campaign.id}`);

    return {
      success: true,
      result: PlacementResult.MATCHED,
      placementLogId: result.placementLog.id,
      charityCommitmentId: result.charityCommitment.id,
      campaignId: campaign.id,
      message: 'Successfully matched activity with sponsor',
    };
  } catch (error) {
    console.error('Error in sponsor matching:', error);
    return {
      success: false,
      result: PlacementResult.SKIPPED_UPDATE_FAILED,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Find an active campaign with available budget
 * For v0, we randomly select from available campaigns
 */
async function findActiveCampaign() {
  const activeCampaigns = await db.campaign.findMany({
    where: {
      isActive: true,
      budgetRemainingCents: {
        gte: COMMITMENT_AMOUNT_CENTS,
      },
    },
    include: {
      sponsor: true,
    },
  });

  if (activeCampaigns.length === 0) {
    return null;
  }

  // Random selection for v0
  const randomIndex = Math.floor(Math.random() * activeCampaigns.length);
  return activeCampaigns[randomIndex];
}

/**
 * Update Strava activity description with sponsor message
 */
async function updateStravaDescription(
  activity: ActivityData,
  campaign: any,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch current activity details from Strava to get description
    const activityResponse = await fetch(
      `https://www.strava.com/api/v3/activities/${activity.stravaActivityId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!activityResponse.ok) {
      const errorText = await activityResponse.text();
      return {
        success: false,
        error: `Failed to fetch activity: HTTP ${activityResponse.status} - ${errorText}`,
      };
    }

    const activityData = await activityResponse.json();
    const currentDescription = activityData.description || '';

    // Check if already has GTD marker (idempotency check)
    if (currentDescription.includes(GTD_MARKER)) {
      console.log(`Activity ${activity.stravaActivityId} already has GTD marker`);
      return { success: true };
    }

    // Build sponsor message
    const sponsorMessage = buildSponsorMessage(activity, campaign);

    // Append to existing description
    const newDescription = currentDescription
      ? `${currentDescription}\n\n${sponsorMessage}`
      : sponsorMessage;

    // Update Strava activity
    const updateResponse = await fetch(
      `https://www.strava.com/api/v3/activities/${activity.stravaActivityId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: newDescription }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      return {
        success: false,
        error: `Failed to update description: HTTP ${updateResponse.status} - ${errorText}`,
      };
    }

    console.log(`✅ Updated description for activity ${activity.stravaActivityId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Build the sponsor message to append to activity description
 */
function buildSponsorMessage(activity: ActivityData, campaign: any): string {
  const activityType = activity.type?.toLowerCase() || 'activity';
  const sponsorName = campaign.sponsor.businessName;
  const sponsorWebsite = campaign.sponsor.website;

  let message = `This ${activityType} inspired a donation by Giving the Distance, sponsored by ${sponsorName}`;
  
  if (sponsorWebsite) {
    message += ` - ${sponsorWebsite}`;
  }
  
  message += ` ${GTD_MARKER}`;
  
  return message;
}

/**
 * Helper function to check if an activity already has a placement
 * (for use in webhook handler)
 */
export async function hasExistingPlacement(activityId: string): Promise<boolean> {
  const placement = await db.placementLog.findUnique({
    where: { activityId },
  });
  return placement !== null;
}

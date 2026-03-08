/**
 * Sponsor Matching Service
 * 
 * Handles matching activities with sponsor campaigns and updating Strava descriptions.
 * Implements idempotency and budget tracking.
 */

import { db } from '@/lib/db';
import { SponsorMatchResult } from '@prisma/client';

// Constants
export const COMMITMENT_AMOUNT_CENTS = 10; // $0.10
const GTD_MARKER = '#GTD';

function getActivityBaseUrl(): string {
  const configured =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    (process.env.VERCEL_URL?.trim() ? `https://${process.env.VERCEL_URL.trim()}` : '');

  const withProtocol = configured.startsWith('http')
    ? configured
    : configured
      ? `https://${configured}`
      : 'https://givingthedistance.org';

  return withProtocol.replace(/\/+$/, '');
}

export interface MatchingResult {
  success: boolean;
  result: SponsorMatchResult;
  sponsorMatchId?: string;
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
    // Step 1: Check if activity already has a sponsor match (idempotency)
    const existingMatch = await db.sponsorMatch.findUnique({
      where: { activityId: activity.id },
    });

    if (existingMatch) {
      console.log(`✅ Activity ${activity.stravaActivityId} already has sponsor match: ${existingMatch.result}`);
      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_ALREADY_SPONSORED,
        sponsorMatchId: existingMatch.id,
        message: 'Activity already has a sponsor match',
      };
    }

    // Step 2: Find an active campaign with budget
    const campaign = await findActiveCampaign();

    if (!campaign) {
      // Log as SKIPPED_NO_ACTIVE_CAMPAIGN
      const sponsorMatch = await db.sponsorMatch.create({
        data: {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: null,
          result: SponsorMatchResult.SKIPPED_NO_ACTIVE_CAMPAIGN,
          decrementCents: 0,
          notes: 'No active campaign with budget available',
        },
      });

      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_NO_ACTIVE_CAMPAIGN,
        sponsorMatchId: sponsorMatch.id,
        message: 'No active campaign available',
      };
    }

    // Step 3: Check if campaign has enough budget
    if (campaign.budgetRemainingCents < COMMITMENT_AMOUNT_CENTS) {
      // Log as SKIPPED_NO_BUDGET
      const sponsorMatch = await db.sponsorMatch.create({
        data: {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: SponsorMatchResult.SKIPPED_NO_BUDGET,
          decrementCents: 0,
          notes: `Campaign budget (${campaign.budgetRemainingCents} cents) insufficient for commitment (${COMMITMENT_AMOUNT_CENTS} cents)`,
        },
      });

      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_NO_BUDGET,
        sponsorMatchId: sponsorMatch.id,
        campaignId: campaign.id,
        message: 'Campaign has insufficient budget',
      };
    }

    // Step 4: Get user's selected charity and athlete info for description
    const user = await db.user.findUnique({
      where: { id: activity.userId },
      select: { selectedCharityId: true },
    });

    if (!user?.selectedCharityId) {
      // Log as SKIPPED_UPDATE_FAILED with note about missing charity
      const sponsorMatch = await db.sponsorMatch.create({
        data: {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: SponsorMatchResult.SKIPPED_UPDATE_FAILED,
          decrementCents: 0,
          notes: 'User has no selected charity',
        },
      });

      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_UPDATE_FAILED,
        sponsorMatchId: sponsorMatch.id,
        campaignId: campaign.id,
        error: 'User has no selected charity',
      };
    }

    // Get charity details and athlete name for description
    const charity = await db.charity.findUnique({
      where: { id: user.selectedCharityId },
      select: { name: true },
    });

    const athlete = await db.stravaAthlete.findUnique({
      where: { id: activity.athleteId },
      select: { firstname: true },
    });

    // Step 5: Update Strava activity description
    const updateResult = await updateStravaDescription(
      activity,
      campaign,
      accessToken,
      athlete?.firstname || null,
      charity?.name || 'charity'
    );

    if (!updateResult.success) {
      // Log as SKIPPED_UPDATE_FAILED
      const sponsorMatch = await db.sponsorMatch.create({
        data: {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: SponsorMatchResult.SKIPPED_UPDATE_FAILED,
          decrementCents: 0,
          notes: `Failed to update Strava description: ${updateResult.error}`,
        },
      });

      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_UPDATE_FAILED,
        sponsorMatchId: sponsorMatch.id,
        campaignId: campaign.id,
        error: updateResult.error,
      };
    }

    // Step 6: Everything successful - create records in transaction
    const selectedCharityId = user.selectedCharityId;
    
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

      // Create sponsor match
      const sponsorMatch = await tx.sponsorMatch.create({
        data: {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: SponsorMatchResult.MATCHED,
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

      return { sponsorMatch, charityCommitment };
    });

    console.log(`✅ Successfully matched activity ${activity.stravaActivityId} with campaign ${campaign.id}`);

    return {
      success: true,
      result: SponsorMatchResult.MATCHED,
      sponsorMatchId: result.sponsorMatch.id,
      charityCommitmentId: result.charityCommitment.id,
      campaignId: campaign.id,
      message: 'Successfully matched activity with sponsor',
    };
  } catch (error) {
    console.error('Error in sponsor matching:', error);
    return {
      success: false,
      result: SponsorMatchResult.SKIPPED_UPDATE_FAILED,
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
  accessToken: string,
  athleteName: string | null,
  charityName: string
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
    const sponsorMessage = await buildSponsorMessage(activity, campaign, athleteName, charityName);

    // Prepend sponsor message so GTD context appears first
    const newDescription = currentDescription
      ? `${sponsorMessage}\n\n${currentDescription}`
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
async function buildSponsorMessage(
  activity: ActivityData,
  campaign: any,
  athleteName: string | null,
  charityName: string
): Promise<string> {
  const firstName = athleteName?.split(' ')[0] || 'An athlete';
  const activityType = activity.type?.toLowerCase() || 'activity';
  const sponsorName = campaign.sponsor.businessName;
  
  // Get activity from database to get shortcode
  const dbActivity = await db.activity.findUnique({
    where: { id: activity.id },
    select: { shortcode: true },
  });
  
  const shortcode = dbActivity?.shortcode || 'xxxxx';
  const activityUrl = `${getActivityBaseUrl()}/a/${shortcode}`;

  const message = `${firstName}'s ${activityType} inspired ${sponsorName} to donate to ${firstName}'s chosen charity, ${charityName} - ${activityUrl} ${GTD_MARKER}`;
  
  return message;
}

/**
 * Helper function to check if an activity already has a sponsor match
 * (for use in webhook handler)
 */
export async function hasExistingSponsorMatch(activityId: string): Promise<boolean> {
  const match = await db.sponsorMatch.findUnique({
    where: { activityId },
  });
  return match !== null;
}

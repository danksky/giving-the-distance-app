/**
 * Sponsor Matching Service
 * 
 * Handles matching activities with sponsor campaigns and updating Strava descriptions.
 * Implements idempotency and budget tracking.
 */

import { db } from '@/lib/db';
import { recordStravaActivityHistory } from '@/lib/strava-activity-history';
import { getLogger } from '@/lib/logger';
import { Prisma, SponsorMatchResult } from '@prisma/client';
import { ensureUserHasSelectedCharity } from '@/lib/charity-helpers';
import {
  getStravaDescriptionSkipReason,
  shouldUpdateStravaDescriptions,
} from '@/lib/strava-description-updates';
import {
  buildDecisionMetadataV0,
  selectCampaignV0,
} from '@/lib/matching';
import type { CampaignCandidate } from '@/lib/matching/types';

// Constants
export const COMMITMENT_AMOUNT_CENTS = 10; // $0.10
export const PRIVATE_ACTIVITY_PUBLIC_MATCH_WINDOW_MS = 24 * 60 * 60 * 1000;
const GTD_MARKER = '#GTD';
const DESCRIPTION_ERROR_SNIPPET_LENGTH = 300;
const NYC_BOUNDS = {
  minLat: 40.47,
  maxLat: 40.93,
  minLng: -74.27,
  maxLng: -73.68,
} as const;
const sponsorMatchingLogger = getLogger('sponsor-matching');

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
  descriptionUpdated?: boolean;
  descriptionUpdateSkipped?: boolean;
}

export interface ActivityData {
  id: string; // Internal activity ID
  stravaActivityId: bigint;
  userId: string;
  athleteId: string;
  stravaAthleteId: bigint;
  isPrivate: boolean;
  createdAt?: Date | null;
  name?: string | null;
  type: string;
  description?: string | null;
}

interface CampaignWithSponsor {
  id: string;
  budgetRemainingCents: number;
  sponsor: {
    businessName: string;
    website: string | null;
  };
}

interface StravaActivityLocationPayload {
  description?: string | null;
  start_latlng?: [number, number] | [];
  end_latlng?: [number, number] | [];
}

interface StravaLatLngStreamPayload {
  latlng?: {
    data?: unknown;
  };
}

type LocationCoordinateSource = 'activity_summary' | 'activity_stream';

type DescriptionUpdateResult =
  | {
      success: true;
      updated: boolean;
      message?: string;
    }
  | {
      success: false;
      error: string;
    };

type ExistingSponsorMatch = {
  id: string;
  result: SponsorMatchResult;
  createdAt: Date;
};

function getPrivateActivityPublicMatchDeadline(
  activity: ActivityData,
  existingMatch: ExistingSponsorMatch
): Date {
  const creationDate = activity.createdAt ?? existingMatch.createdAt;
  return new Date(
    creationDate.getTime() + PRIVATE_ACTIVITY_PUBLIC_MATCH_WINDOW_MS
  );
}

function canRetryPrivateActivityMatch(
  activity: ActivityData,
  existingMatch: ExistingSponsorMatch | null,
  now = new Date()
): existingMatch is ExistingSponsorMatch {
  if (!existingMatch) return false;
  if (existingMatch.result !== SponsorMatchResult.SKIPPED_PRIVATE_ACTIVITY) {
    return false;
  }
  if (activity.isPrivate) return false;

  return now <= getPrivateActivityPublicMatchDeadline(activity, existingMatch);
}

async function writeSponsorMatchDecision(
  data: Prisma.SponsorMatchUncheckedCreateInput,
  retryablePrivateMatch: ExistingSponsorMatch | null
) {
  if (!retryablePrivateMatch) {
    return db.sponsorMatch.create({ data });
  }

  return db.sponsorMatch.update({
    where: { id: retryablePrivateMatch.id },
    data: {
      stravaActivityId: data.stravaActivityId,
      athleteId: data.athleteId,
      stravaAthleteId: data.stravaAthleteId,
      campaignId: data.campaignId,
      result: data.result,
      matchingVersion: data.matchingVersion,
      decisionReason: data.decisionReason,
      decisionContext: data.decisionContext,
      decrementCents: data.decrementCents,
      notes: data.notes,
      matchedAt: new Date(),
    },
  });
}

/**
 * Main entry point for sponsor matching
 * Checks idempotency, finds a campaign, and processes the match
 */
export async function matchActivityWithSponsor(
  activity: ActivityData,
  accessToken: string
): Promise<MatchingResult> {
  const activityLogger = sponsorMatchingLogger.child({
    activityId: activity.id,
    stravaActivityId: activity.stravaActivityId,
    stravaAthleteId: activity.stravaAthleteId,
    type: activity.type,
    userId: activity.userId,
  });

  try {
    activityLogger.info('Starting sponsor matching evaluation', {
      isPrivate: activity.isPrivate,
    });

    // Step 1: Check if activity already has a sponsor match (idempotency)
    const existingMatch = await db.sponsorMatch.findUnique({
      where: { activityId: activity.id },
    });

    const retryablePrivateMatch = canRetryPrivateActivityMatch(
      activity,
      existingMatch
    )
      ? existingMatch
      : null;

    if (existingMatch && !retryablePrivateMatch) {
      activityLogger.info('Skipping sponsor matching because a match already exists', {
        existingResult: existingMatch.result,
      });
      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_ALREADY_SPONSORED,
        sponsorMatchId: existingMatch.id,
        message: 'Activity already has a sponsor match',
      };
    }

    if (retryablePrivateMatch) {
      activityLogger.info(
        'Retrying sponsor matching because private activity became public within the matching window',
        {
          existingResult: retryablePrivateMatch.result,
          publicMatchDeadline: getPrivateActivityPublicMatchDeadline(
            activity,
            retryablePrivateMatch
          ),
        }
      );
    }

    // Step 2: Skip Strava-private activities in v0
    if (activity.isPrivate) {
      activityLogger.info('Skipping sponsor matching because activity is private on Strava');
      const decision = buildDecisionMetadataV0('private_activity');
      const sponsorMatch = await writeSponsorMatchDecision(
        {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: null,
          result: SponsorMatchResult.SKIPPED_PRIVATE_ACTIVITY,
          matchingVersion: decision.matchingVersion,
          decisionReason: decision.decisionReason,
          decrementCents: 0,
          notes: 'Activity is not eligible for sponsor matching because it is private on Strava.',
        },
        retryablePrivateMatch
      );

      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_PRIVATE_ACTIVITY,
        sponsorMatchId: sponsorMatch.id,
        message: 'Activity is private on Strava',
      };
    }

    // Step 3: Require GPS coordinates that start and end within rough NYC bounds
    const eligibility = await checkActivityLocationEligibility(
      activity.stravaActivityId,
      accessToken
    );

    if (!eligibility.eligible) {
      activityLogger.info('Skipping sponsor matching because activity is outside eligibility bounds', {
        locationCheck: eligibility.locationCheck,
        reason: eligibility.reason,
      });
      const decision = buildDecisionMetadataV0('outside_nyc', {
        locationCheck: eligibility.locationCheck,
      });
      const sponsorMatch = await writeSponsorMatchDecision(
        {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: null,
          result: SponsorMatchResult.SKIPPED_OUTSIDE_NYC,
          matchingVersion: decision.matchingVersion,
          decisionReason: decision.decisionReason,
          decisionContext: decision.decisionContext,
          decrementCents: 0,
          notes: eligibility.reason,
        },
        retryablePrivateMatch
      );

      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_OUTSIDE_NYC,
        sponsorMatchId: sponsorMatch.id,
        message: eligibility.reason,
      };
    }

    // Step 4: Find an active campaign with budget
    const campaign = await findActiveCampaign();

    if (!campaign) {
      activityLogger.info('Skipping sponsor matching because no active campaign is available');
      const decision = buildDecisionMetadataV0('no_active_campaign');
      // Log as SKIPPED_NO_ACTIVE_CAMPAIGN
      const sponsorMatch = await writeSponsorMatchDecision(
        {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: null,
          result: SponsorMatchResult.SKIPPED_NO_ACTIVE_CAMPAIGN,
          matchingVersion: decision.matchingVersion,
          decisionReason: decision.decisionReason,
          decrementCents: 0,
          notes: 'No active campaign with budget available',
        },
        retryablePrivateMatch
      );

      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_NO_ACTIVE_CAMPAIGN,
        sponsorMatchId: sponsorMatch.id,
        message: 'No active campaign available',
      };
    }

    // Step 5: Check if campaign has enough budget
    if (campaign.budgetRemainingCents < COMMITMENT_AMOUNT_CENTS) {
      activityLogger.info('Skipping sponsor matching because campaign budget is insufficient', {
        campaignId: campaign.id,
        campaignBudgetRemainingCents: campaign.budgetRemainingCents,
      });
      const decision = buildDecisionMetadataV0('no_budget', {
        campaignId: campaign.id,
        campaignBudgetRemainingCents: campaign.budgetRemainingCents,
        requiredCommitmentCents: COMMITMENT_AMOUNT_CENTS,
      });
      // Log as SKIPPED_NO_BUDGET
      const sponsorMatch = await writeSponsorMatchDecision(
        {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: SponsorMatchResult.SKIPPED_NO_BUDGET,
          matchingVersion: decision.matchingVersion,
          decisionReason: decision.decisionReason,
          decisionContext: decision.decisionContext,
          decrementCents: 0,
          notes: `Campaign budget (${campaign.budgetRemainingCents} cents) insufficient for commitment (${COMMITMENT_AMOUNT_CENTS} cents)`,
        },
        retryablePrivateMatch
      );

      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_NO_BUDGET,
        sponsorMatchId: sponsorMatch.id,
        campaignId: campaign.id,
        message: 'Campaign has insufficient budget',
      };
    }

    // Step 6: Get user's selected charity and athlete info for description
    const selectedCharity = await ensureUserHasSelectedCharity(activity.userId);

    if (!selectedCharity?.id) {
      activityLogger.warn('Skipping sponsor matching because user has no selected charity', {
        campaignId: campaign.id,
      });
      const decision = buildDecisionMetadataV0('no_selected_charity', {
        campaignId: campaign.id,
      });
      // Log as SKIPPED_NO_SELECTED_CHARITY
      const sponsorMatch = await writeSponsorMatchDecision(
        {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: SponsorMatchResult.SKIPPED_NO_SELECTED_CHARITY,
          matchingVersion: decision.matchingVersion,
          decisionReason: decision.decisionReason,
          decisionContext: decision.decisionContext,
          decrementCents: 0,
          notes: 'User has no selected charity and no default charity is configured',
        },
        retryablePrivateMatch
      );

      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_NO_SELECTED_CHARITY,
        sponsorMatchId: sponsorMatch.id,
        campaignId: campaign.id,
        error: 'User has no selected charity',
      };
    }

    // Get charity details and athlete name for description
    const athlete = await db.stravaAthlete.findUnique({
      where: { id: activity.athleteId },
      select: { firstname: true },
    });

    activityLogger.info('Selected sponsor campaign for eligible activity', {
      campaignId: campaign.id,
      sponsorName: campaign.sponsor.businessName,
    });

    // Step 7: Update Strava activity description
    const updateResult = await updateStravaDescription(
      activity,
      campaign,
      accessToken,
      athlete?.firstname || null,
      selectedCharity.name || 'charity',
      eligibility.activityData,
      activityLogger
    );

    if (!updateResult.success) {
      activityLogger.error('Failed to update Strava activity description', {
        campaignId: campaign.id,
        errorMessage: updateResult.error,
      });
      const decision = buildDecisionMetadataV0('update_failed', {
        campaignId: campaign.id,
      });
      // Log as SKIPPED_UPDATE_FAILED
      const sponsorMatch = await writeSponsorMatchDecision(
        {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: SponsorMatchResult.SKIPPED_UPDATE_FAILED,
          matchingVersion: decision.matchingVersion,
          decisionReason: decision.decisionReason,
          decisionContext: decision.decisionContext,
          decrementCents: 0,
          notes: `Failed to update Strava description: ${updateResult.error}`,
        },
        retryablePrivateMatch
      );

      return {
        success: false,
        result: SponsorMatchResult.SKIPPED_UPDATE_FAILED,
        sponsorMatchId: sponsorMatch.id,
        campaignId: campaign.id,
        error: updateResult.error,
      };
    }

    // Step 8: Everything successful - create records in transaction
    const selectedCharityId = selectedCharity.id;
    const decision = buildDecisionMetadataV0('random_selection', {
      selectedCampaignId: campaign.id,
      commitmentCents: COMMITMENT_AMOUNT_CENTS,
    });
    
    const successNote = updateResult.updated
      ? 'Successfully matched and description updated'
      : updateResult.message || 'Successfully matched without updating Strava description';

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

      const sponsorMatchData = {
          activityId: activity.id,
          stravaActivityId: activity.stravaActivityId,
          athleteId: activity.athleteId,
          stravaAthleteId: activity.stravaAthleteId,
          campaignId: campaign.id,
          result: SponsorMatchResult.MATCHED,
          matchingVersion: decision.matchingVersion,
          decisionReason: decision.decisionReason,
          decisionContext: decision.decisionContext,
          decrementCents: COMMITMENT_AMOUNT_CENTS,
          notes: retryablePrivateMatch
            ? `${successNote}. Activity was originally skipped as private, then became public within 24 hours.`
            : successNote,
      };

      const sponsorMatch = retryablePrivateMatch
        ? await tx.sponsorMatch.update({
            where: { id: retryablePrivateMatch.id },
            data: {
              campaignId: sponsorMatchData.campaignId,
              result: sponsorMatchData.result,
              matchingVersion: sponsorMatchData.matchingVersion,
              decisionReason: sponsorMatchData.decisionReason,
              decisionContext: sponsorMatchData.decisionContext,
              decrementCents: sponsorMatchData.decrementCents,
              notes: sponsorMatchData.notes,
              matchedAt: new Date(),
            },
          })
        : await tx.sponsorMatch.create({
            data: sponsorMatchData,
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

    activityLogger.info('Successfully matched activity with sponsor campaign', {
      campaignId: campaign.id,
      charityCommitmentId: result.charityCommitment.id,
      descriptionUpdated: updateResult.updated,
      sponsorMatchId: result.sponsorMatch.id,
    });

    return {
      success: true,
      result: SponsorMatchResult.MATCHED,
      sponsorMatchId: result.sponsorMatch.id,
      charityCommitmentId: result.charityCommitment.id,
      campaignId: campaign.id,
      message: successNote,
      descriptionUpdated: updateResult.updated,
      descriptionUpdateSkipped: !updateResult.updated,
    };
  } catch (error) {
    activityLogger.error('Unexpected error in sponsor matching', {
      error,
    });
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

  return selectCampaignV0(activeCampaigns as CampaignCandidate[]);
}

/**
 * Update Strava activity description with sponsor message
 */
async function updateStravaDescription(
  activity: ActivityData,
  campaign: CampaignWithSponsor,
  accessToken: string,
  athleteName: string | null,
  charityName: string,
  prefetchedActivityData?: StravaActivityLocationPayload,
  logger = sponsorMatchingLogger
): Promise<DescriptionUpdateResult> {
  let currentDescription: string | null | undefined;
  let newDescription: string | undefined;

  try {
    if (!shouldUpdateStravaDescriptions()) {
      const reason = getStravaDescriptionSkipReason();
      logger.info('Skipping Strava description update because environment writes are disabled', {
        reason,
      });
      await recordStravaActivityHistory({
        activityId: activity.id,
        stravaActivityId: activity.stravaActivityId,
        source: 'app',
        eventType: 'description_update_skipped',
        descriptionText: null,
        metadata: {
          campaignId: campaign.id,
          reason,
          skipReason: 'environment_disabled',
        },
      });
      return {
        success: true,
        updated: false,
        message: reason,
      };
    }

    const activityData =
      prefetchedActivityData ||
      (await fetchStravaActivityDetails(activity.stravaActivityId, accessToken));
    currentDescription = activityData.description || '';

    // Check if already has GTD marker (idempotency check)
    if (currentDescription.includes(GTD_MARKER)) {
      logger.info('Skipping Strava description update because GTD marker already exists', {
        currentDescriptionLength: currentDescription.length,
      });
      await recordStravaActivityHistory({
        activityId: activity.id,
        stravaActivityId: activity.stravaActivityId,
        source: 'app',
        eventType: 'description_update_skipped',
        descriptionText: currentDescription,
        metadata: {
          campaignId: campaign.id,
          skipReason: 'gtd_marker_already_present',
        },
      });
      return {
        success: true,
        updated: false,
        message: 'Activity already contains a Giving the Distance marker.',
      };
    }

    // Build sponsor message
    const sponsorMessage = await buildSponsorMessage(activity, campaign, athleteName, charityName);

    // Prepend sponsor message so GTD context appears first
    newDescription = currentDescription
      ? `${sponsorMessage}\n\n${currentDescription}`
      : sponsorMessage;

    logger.debug('Sending Strava description update', {
      campaignId: campaign.id,
      currentDescriptionLength: currentDescription.length,
      hadExistingDescription: currentDescription.length > 0,
      newDescriptionLength: newDescription.length,
    });

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
      logger.error('Strava activity description update request failed', {
        campaignId: campaign.id,
        errorTextSnippet: errorText.slice(0, DESCRIPTION_ERROR_SNIPPET_LENGTH),
        status: updateResponse.status,
      });
      await recordStravaActivityHistory({
        activityId: activity.id,
        stravaActivityId: activity.stravaActivityId,
        source: 'app',
        eventType: 'description_update_failed',
        descriptionText: currentDescription,
        metadata: {
          campaignId: campaign.id,
          errorTextSnippet: errorText.slice(0, DESCRIPTION_ERROR_SNIPPET_LENGTH),
          status: updateResponse.status,
          targetDescriptionLength: newDescription.length,
        },
      });
      return {
        success: false,
        error: `Failed to update description: HTTP ${updateResponse.status} - ${errorText}`,
      };
    }

    logger.info('Strava activity description update request succeeded', {
      campaignId: campaign.id,
      status: updateResponse.status,
    });
    await recordStravaActivityHistory({
      activityId: activity.id,
      stravaActivityId: activity.stravaActivityId,
      source: 'app',
      eventType: 'description_update_succeeded',
      descriptionText: newDescription,
      metadata: {
        campaignId: campaign.id,
        previousDescriptionLength: currentDescription.length,
        status: updateResponse.status,
      },
    });
    return { success: true, updated: true };
  } catch (error) {
    logger.error('Unexpected error while updating Strava activity description', {
      campaignId: campaign.id,
      error,
    });
    await recordStravaActivityHistory({
      activityId: activity.id,
      stravaActivityId: activity.stravaActivityId,
      source: 'app',
      eventType: 'description_update_failed',
      descriptionText: currentDescription,
      metadata: {
        campaignId: campaign.id,
        error: error instanceof Error ? error.message : String(error),
        targetDescriptionLength: newDescription?.length ?? null,
      },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchStravaActivityDetails(
  stravaActivityId: bigint,
  accessToken: string
): Promise<StravaActivityLocationPayload> {
  const activityResponse = await fetch(
    `https://www.strava.com/api/v3/activities/${stravaActivityId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!activityResponse.ok) {
    const errorText = await activityResponse.text();
    throw new Error(
      `Failed to fetch activity: HTTP ${activityResponse.status} - ${errorText}`
    );
  }

  return activityResponse.json();
}

async function checkActivityLocationEligibility(
  stravaActivityId: bigint,
  accessToken: string
): Promise<
  | {
      eligible: true;
      activityData: StravaActivityLocationPayload;
      locationCheck: {
        startInBounds: boolean;
        endInBounds: boolean;
        coordinateSource: LocationCoordinateSource;
      };
    }
  | {
      eligible: false;
      reason: string;
      locationCheck: {
        hasStart: boolean;
        hasEnd: boolean;
        startInBounds: boolean;
        endInBounds: boolean;
        coordinateSource: LocationCoordinateSource | null;
      };
    }
> {
  try {
    const activityData = await fetchStravaActivityDetails(
      stravaActivityId,
      accessToken
    );

    let start = normalizeLatLng(activityData.start_latlng);
    let end = normalizeLatLng(activityData.end_latlng);
    let coordinateSource: LocationCoordinateSource | null =
      start && end ? 'activity_summary' : null;

    if (!start || !end) {
      const streamCoordinates = await fetchStravaActivityEndpointCoordinates(
        stravaActivityId,
        accessToken
      );

      if (streamCoordinates) {
        start = streamCoordinates.start;
        end = streamCoordinates.end;
        coordinateSource = 'activity_stream';
      }
    }

    const startInBounds = start ? isWithinRoughNycBounds(start) : false;
    const endInBounds = end ? isWithinRoughNycBounds(end) : false;

    if (!start || !end) {
      return {
        eligible: false,
        reason:
          'Activity is not eligible for sponsor matching because it must include GPS start and end coordinates within New York City.',
        locationCheck: {
          hasStart: !!start,
          hasEnd: !!end,
          startInBounds,
          endInBounds,
          coordinateSource,
        },
      };
    }

    if (!startInBounds || !endInBounds) {
      return {
        eligible: false,
        reason:
          'Activity is not eligible for sponsor matching because its GPS start and end points must both fall within the current New York City service area.',
        locationCheck: {
          hasStart: true,
          hasEnd: true,
          startInBounds,
          endInBounds,
          coordinateSource,
        },
      };
    }

    return {
      eligible: true,
      activityData,
      locationCheck: {
        startInBounds,
        endInBounds,
        coordinateSource: coordinateSource ?? 'activity_summary',
      },
    };
  } catch (error) {
    return {
      eligible: false,
      reason:
        error instanceof Error
          ? error.message
          : 'Failed to verify activity GPS eligibility.',
      locationCheck: {
        hasStart: false,
        hasEnd: false,
        startInBounds: false,
        endInBounds: false,
        coordinateSource: null,
      },
    };
  }
}

async function fetchStravaActivityEndpointCoordinates(
  stravaActivityId: bigint,
  accessToken: string
): Promise<{
  start: [number, number];
  end: [number, number];
} | null> {
  const response = await fetch(
    `https://www.strava.com/api/v3/activities/${stravaActivityId}/streams?keys=latlng&key_by_type=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as StravaLatLngStreamPayload;
  const coordinates = normalizeLatLngStream(payload.latlng?.data);

  if (coordinates.length === 0) {
    return null;
  }

  return {
    start: coordinates[0],
    end: coordinates[coordinates.length - 1],
  };
}

function normalizeLatLngStream(value: unknown): [number, number][] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((coordinate) => normalizeLatLng(coordinate))
    .filter((coordinate): coordinate is [number, number] => coordinate !== null);
}

function normalizeLatLng(
  value: unknown
): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) {
    return null;
  }

  const [lat, lng] = value;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  return [lat, lng];
}

function isWithinRoughNycBounds([lat, lng]: [number, number]): boolean {
  return (
    lat >= NYC_BOUNDS.minLat &&
    lat <= NYC_BOUNDS.maxLat &&
    lng >= NYC_BOUNDS.minLng &&
    lng <= NYC_BOUNDS.maxLng
  );
}

/**
 * Build the sponsor message to append to activity description
 */
async function buildSponsorMessage(
  activity: ActivityData,
  campaign: CampaignWithSponsor,
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

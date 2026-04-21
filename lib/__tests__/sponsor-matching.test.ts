/**
 * Unit tests for sponsor matching service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { matchActivityWithSponsor, COMMITMENT_AMOUNT_CENTS, hasExistingSponsorMatch } from '../sponsor-matching';
import { SponsorMatchResult } from '@prisma/client';

vi.mock('@/lib/charity-helpers', () => ({
  ensureUserHasSelectedCharity: vi.fn(),
}));

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    sponsorMatch: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    campaign: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    stravaAthlete: {
      findUnique: vi.fn(),
    },
    activity: {
      findUnique: vi.fn(),
    },
    charityCommitment: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Import mocked db after mocking
import { db } from '@/lib/db';
import { ensureUserHasSelectedCharity } from '@/lib/charity-helpers';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Sponsor Matching Service', () => {
  const originalEnableDescriptionUpdates =
    process.env.ENABLE_STRAVA_DESCRIPTION_UPDATES;

  const mockActivity = {
    id: 'activity-123',
    stravaActivityId: BigInt(987654321),
    userId: 'user-456',
    athleteId: 'athlete-789',
    stravaAthleteId: BigInt(123456789),
    isPrivate: false,
    name: 'Morning Run',
    type: 'Run',
    description: null,
  };

  const mockCampaign = {
    id: 'campaign-abc',
    sponsorId: 'sponsor-123',
    name: 'Test Campaign',
    budgetRemainingCents: 10000,
    isActive: true,
    sponsor: {
      id: 'sponsor-123',
      businessName: 'Test Sponsor',
      website: 'https://testsponsor.com',
    },
  };

  const mockAccessToken = 'test-access-token';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENABLE_STRAVA_DESCRIPTION_UPDATES = 'true';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    if (originalEnableDescriptionUpdates === undefined) {
      delete process.env.ENABLE_STRAVA_DESCRIPTION_UPDATES;
    } else {
      process.env.ENABLE_STRAVA_DESCRIPTION_UPDATES =
        originalEnableDescriptionUpdates;
    }
  });

  describe('matchActivityWithSponsor', () => {
    it('should skip if activity already has sponsor match (idempotency)', async () => {
      const existingMatch = {
        id: 'match-existing',
        activityId: mockActivity.id,
        result: SponsorMatchResult.MATCHED,
      };

      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(existingMatch as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(SponsorMatchResult.SKIPPED_ALREADY_SPONSORED);
      expect(result.sponsorMatchId).toBe(existingMatch.id);
      expect(db.sponsorMatch.findUnique).toHaveBeenCalledWith({
        where: { activityId: mockActivity.id },
      });
      // Verify that Strava API was never called (already sponsored = no re-update)
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should retry a private skip when the activity becomes public within 24 hours', async () => {
      const now = new Date('2026-04-21T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const existingMatch = {
        id: 'match-private-retry',
        activityId: mockActivity.id,
        result: SponsorMatchResult.SKIPPED_PRIVATE_ACTIVITY,
        createdAt: new Date('2026-04-21T10:30:00.000Z'),
      };

      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(existingMatch as any);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);

      vi.mocked(ensureUserHasSelectedCharity).mockResolvedValue({
        id: 'charity-unicef',
        name: 'UNICEF',
      } as any);

      vi.mocked(db.stravaAthlete.findUnique).mockResolvedValue({
        id: mockActivity.athleteId,
        firstname: 'John',
      } as any);

      vi.mocked(db.activity.findUnique).mockResolvedValue({
        id: mockActivity.id,
        shortcode: 'test4',
      } as any);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: mockActivity.stravaActivityId,
            start_latlng: [40.75, -73.99],
            end_latlng: [40.76, -73.98],
            description: 'Existing description',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: mockActivity.stravaActivityId }),
        });

      const mockSponsorMatch = {
        id: existingMatch.id,
        result: SponsorMatchResult.MATCHED,
      };
      const mockCharityCommitment = {
        id: 'commitment-private-retry',
      };
      const txSponsorMatchUpdate = vi.fn().mockResolvedValue(mockSponsorMatch);
      const txSponsorMatchCreate = vi.fn();

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          campaign: {
            update: vi.fn().mockResolvedValue({}),
          },
          sponsorMatch: {
            update: txSponsorMatchUpdate,
            create: txSponsorMatchCreate,
          },
          charityCommitment: {
            create: vi.fn().mockResolvedValue(mockCharityCommitment),
          },
        });
      });

      const result = await matchActivityWithSponsor(
        {
          ...mockActivity,
          isPrivate: false,
          createdAt: new Date('2026-04-21T10:00:00.000Z'),
        },
        mockAccessToken
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe(SponsorMatchResult.MATCHED);
      expect(result.sponsorMatchId).toBe(existingMatch.id);
      expect(txSponsorMatchUpdate).toHaveBeenCalledWith({
        where: { id: existingMatch.id },
        data: expect.objectContaining({
          result: SponsorMatchResult.MATCHED,
          campaignId: mockCampaign.id,
          decrementCents: COMMITMENT_AMOUNT_CENTS,
          notes: expect.stringContaining('became public within 24 hours'),
        }),
      });
      expect(txSponsorMatchCreate).not.toHaveBeenCalled();
    });

    it('should not retry a private skip after the 24 hour public-match window', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-22T12:00:00.000Z'));

      const existingMatch = {
        id: 'match-private-too-old',
        activityId: mockActivity.id,
        result: SponsorMatchResult.SKIPPED_PRIVATE_ACTIVITY,
        createdAt: new Date('2026-04-21T10:30:00.000Z'),
      };

      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(existingMatch as any);

      const result = await matchActivityWithSponsor(
        {
          ...mockActivity,
          isPrivate: false,
          createdAt: new Date('2026-04-21T10:00:00.000Z'),
        },
        mockAccessToken
      );

      expect(result.success).toBe(false);
      expect(result.result).toBe(SponsorMatchResult.SKIPPED_ALREADY_SPONSORED);
      expect(result.sponsorMatchId).toBe(existingMatch.id);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(db.campaign.findMany).not.toHaveBeenCalled();
    });

    it('should skip if no active campaign available', async () => {
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockActivity.stravaActivityId,
          start_latlng: [40.75, -73.99],
          end_latlng: [40.76, -73.98],
        }),
      });
      vi.mocked(db.campaign.findMany).mockResolvedValue([]);
      
      const createdMatch = {
        id: 'match-no-campaign',
        result: SponsorMatchResult.SKIPPED_NO_ACTIVE_CAMPAIGN,
      };
      vi.mocked(db.sponsorMatch.create).mockResolvedValue(createdMatch as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(SponsorMatchResult.SKIPPED_NO_ACTIVE_CAMPAIGN);
      expect(db.campaign.findMany).toHaveBeenCalledWith({
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
      expect(db.sponsorMatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          result: SponsorMatchResult.SKIPPED_NO_ACTIVE_CAMPAIGN,
          matchingVersion: 'v0',
          decisionReason: 'no_active_campaign',
          decrementCents: 0,
        }),
      });
      // Verify that only the eligibility check hit Strava (no description update)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should skip if the activity is private on Strava', async () => {
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);

      const createdMatch = {
        id: 'match-private-activity',
        result: SponsorMatchResult.SKIPPED_PRIVATE_ACTIVITY,
      };
      vi.mocked(db.sponsorMatch.create).mockResolvedValue(createdMatch as any);

      const result = await matchActivityWithSponsor(
        {
          ...mockActivity,
          isPrivate: true,
        },
        mockAccessToken
      );

      expect(result.success).toBe(false);
      expect(result.result).toBe(SponsorMatchResult.SKIPPED_PRIVATE_ACTIVITY);
      expect(result.message).toContain('private on Strava');
      expect(db.sponsorMatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          result: SponsorMatchResult.SKIPPED_PRIVATE_ACTIVITY,
          matchingVersion: 'v0',
          decisionReason: 'private_activity',
        }),
      });
      expect(mockFetch).not.toHaveBeenCalled();
      expect(db.campaign.findMany).not.toHaveBeenCalled();
    });

    it('should skip if campaign has insufficient budget', async () => {
      const lowBudgetCampaign = {
        ...mockCampaign,
        budgetRemainingCents: 5, // Less than COMMITMENT_AMOUNT_CENTS (10)
      };

      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockActivity.stravaActivityId,
          start_latlng: [40.75, -73.99],
          end_latlng: [40.76, -73.98],
        }),
      });
      vi.mocked(db.campaign.findMany).mockResolvedValue([lowBudgetCampaign as any]);
      
      const createdMatch = {
        id: 'match-no-budget',
        result: SponsorMatchResult.SKIPPED_NO_BUDGET,
      };
      vi.mocked(db.sponsorMatch.create).mockResolvedValue(createdMatch as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(SponsorMatchResult.SKIPPED_NO_BUDGET);
      expect(result.campaignId).toBe(lowBudgetCampaign.id);
      expect(db.sponsorMatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          result: SponsorMatchResult.SKIPPED_NO_BUDGET,
          campaignId: lowBudgetCampaign.id,
          matchingVersion: 'v0',
          decisionReason: 'no_budget',
          decrementCents: 0,
        }),
      });
      // Verify that only the eligibility check hit Strava (no description update)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should skip if Strava API fetch fails', async () => {
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);
      const createdMatch = {
        id: 'match-outside-nyc',
        result: SponsorMatchResult.SKIPPED_OUTSIDE_NYC,
      };
      vi.mocked(db.sponsorMatch.create).mockResolvedValue(createdMatch as any);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(SponsorMatchResult.SKIPPED_OUTSIDE_NYC);
      expect(result.message).toContain('401');
      expect(mockFetch).toHaveBeenCalledWith(
        `https://www.strava.com/api/v3/activities/${mockActivity.stravaActivityId}`,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        })
      );
    });

    it('should skip if Strava description update fails', async () => {
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);
      
      vi.mocked(ensureUserHasSelectedCharity).mockResolvedValue({
        id: mockActivity.userId,
        name: 'UNICEF',
      } as any);

      // Mock athlete lookup
      vi.mocked(db.stravaAthlete.findUnique).mockResolvedValue({
        id: mockActivity.athleteId,
        firstname: 'John',
      } as any);

      // Mock activity lookup for shortcode
      vi.mocked(db.activity.findUnique).mockResolvedValue({
        id: mockActivity.id,
        shortcode: 'test3',
      } as any);

      // Mock successful fetch but failed update
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: mockActivity.stravaActivityId,
            start_latlng: [40.75, -73.99],
            end_latlng: [40.76, -73.98],
            description: 'Existing description',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => 'Forbidden',
        });

      const createdMatch = {
        id: 'match-update-failed',
        result: SponsorMatchResult.SKIPPED_UPDATE_FAILED,
      };
      vi.mocked(db.sponsorMatch.create).mockResolvedValue(createdMatch as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(SponsorMatchResult.SKIPPED_UPDATE_FAILED);
      expect(result.error).toContain('403');
    });

    it('should skip if user has no selected charity', async () => {
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockActivity.stravaActivityId,
          start_latlng: [40.75, -73.99],
          end_latlng: [40.76, -73.98],
          description: '',
        }),
      });

      vi.mocked(ensureUserHasSelectedCharity).mockResolvedValue(null);

      const createdMatch = {
        id: 'match-no-charity',
        result: SponsorMatchResult.SKIPPED_NO_SELECTED_CHARITY,
      };
      vi.mocked(db.sponsorMatch.create).mockResolvedValue(createdMatch as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(SponsorMatchResult.SKIPPED_NO_SELECTED_CHARITY);
      expect(result.error).toContain('no selected charity');
    });

    it('should successfully match activity with campaign', async () => {
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);
      
      vi.mocked(ensureUserHasSelectedCharity).mockResolvedValue({
        id: 'charity-unicef',
        name: 'UNICEF',
      } as any);

      // Mock athlete lookup
      vi.mocked(db.stravaAthlete.findUnique).mockResolvedValue({
        id: mockActivity.athleteId,
        firstname: 'John',
      } as any);

      // Mock activity lookup for shortcode
      vi.mocked(db.activity.findUnique).mockResolvedValue({
        id: mockActivity.id,
        shortcode: 'test1',
      } as any);

      // Mock successful Strava update
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: mockActivity.stravaActivityId,
            start_latlng: [40.75, -73.99],
            end_latlng: [40.76, -73.98],
            description: 'Existing description',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: mockActivity.stravaActivityId }),
        });

      // Mock transaction
      const mockSponsorMatch = {
        id: 'match-matched',
        result: SponsorMatchResult.MATCHED,
      };
      const mockCharityCommitment = {
        id: 'commitment-123',
      };
      
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          campaign: {
            update: vi.fn().mockResolvedValue({}),
          },
          sponsorMatch: {
            create: vi.fn().mockResolvedValue(mockSponsorMatch),
          },
          charityCommitment: {
            create: vi.fn().mockResolvedValue(mockCharityCommitment),
          },
        });
      });

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(true);
      expect(result.result).toBe(SponsorMatchResult.MATCHED);
      expect(result.sponsorMatchId).toBe(mockSponsorMatch.id);
      expect(result.charityCommitmentId).toBe(mockCharityCommitment.id);
      expect(result.campaignId).toBe(mockCampaign.id);
      expect(db.$transaction).toHaveBeenCalled();
    });

    it('should successfully match even if GTD marker already exists', async () => {
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);
      
      vi.mocked(ensureUserHasSelectedCharity).mockResolvedValue({
        id: 'charity-unicef',
        name: 'UNICEF',
      } as any);

      // Mock athlete lookup
      vi.mocked(db.stravaAthlete.findUnique).mockResolvedValue({
        id: mockActivity.athleteId,
        firstname: 'John',
      } as any);

      // Mock activity lookup for shortcode (needs 2 calls now)
      vi.mocked(db.activity.findUnique)
        .mockResolvedValueOnce({
          id: mockActivity.id,
          shortcode: 'test2',
        } as any)
        .mockResolvedValueOnce({
          id: mockActivity.id,
          shortcode: 'test2',
        } as any);

      // Mock Strava fetch with GTD marker already present
      // Note: GTD marker check happens in updateStravaDescription, and it returns success early
      // without making a PUT request, then continues with the matching process
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockActivity.stravaActivityId,
          start_latlng: [40.75, -73.99],
          end_latlng: [40.76, -73.98],
          description: 'Existing description #GTD',
        }),
      });

      // Mock transaction
      const mockSponsorMatch = {
        id: 'match-matched',
        result: SponsorMatchResult.MATCHED,
      };
      const mockCharityCommitment = {
        id: 'commitment-123',
      };
      
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          campaign: {
            update: vi.fn().mockResolvedValue({}),
          },
          sponsorMatch: {
            create: vi.fn().mockResolvedValue(mockSponsorMatch),
          },
          charityCommitment: {
            create: vi.fn().mockResolvedValue(mockCharityCommitment),
          },
        });
      });

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      // Should still succeed - GTD marker check returns success without PUT,
      // but matching process completes (budget decrement, logs, commitments)
      expect(result.success).toBe(true);
      expect(result.result).toBe(SponsorMatchResult.MATCHED);
      expect(result.sponsorMatchId).toBe(mockSponsorMatch.id);
      expect(result.charityCommitmentId).toBe(mockCharityCommitment.id);
    });

    it('should match and skip the Strava description update when disabled by config', async () => {
      process.env.ENABLE_STRAVA_DESCRIPTION_UPDATES = 'false';

      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);

      vi.mocked(ensureUserHasSelectedCharity).mockResolvedValue({
        id: 'charity-unicef',
        name: 'UNICEF',
      } as any);

      vi.mocked(db.stravaAthlete.findUnique).mockResolvedValue({
        id: mockActivity.athleteId,
        firstname: 'John',
      } as any);

      const mockSponsorMatch = {
        id: 'match-matched-no-description',
        result: SponsorMatchResult.MATCHED,
      };
      const mockCharityCommitment = {
        id: 'commitment-456',
      };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          campaign: {
            update: vi.fn().mockResolvedValue({}),
          },
          sponsorMatch: {
            create: vi.fn().mockResolvedValue(mockSponsorMatch),
          },
          charityCommitment: {
            create: vi.fn().mockResolvedValue(mockCharityCommitment),
          },
        });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockActivity.stravaActivityId,
          start_latlng: [40.75, -73.99],
          end_latlng: [40.76, -73.98],
          description: 'Existing description',
        }),
      });

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(true);
      expect(result.result).toBe(SponsorMatchResult.MATCHED);
      expect(result.descriptionUpdated).toBe(false);
      expect(result.descriptionUpdateSkipped).toBe(true);
      expect(result.message).toContain('disabled for this environment');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(db.$transaction).toHaveBeenCalled();
    });

    it('should skip if the activity is missing GPS coordinates', async () => {
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockActivity.stravaActivityId,
          start_latlng: [],
          end_latlng: [],
        }),
      });

      const createdMatch = {
        id: 'match-no-gps',
        result: SponsorMatchResult.SKIPPED_OUTSIDE_NYC,
      };
      vi.mocked(db.sponsorMatch.create).mockResolvedValue(createdMatch as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(SponsorMatchResult.SKIPPED_OUTSIDE_NYC);
      expect(result.message).toContain('GPS start and end coordinates');
      expect(db.sponsorMatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          matchingVersion: 'v0',
          decisionReason: 'outside_nyc',
        }),
      });
      expect(db.campaign.findMany).not.toHaveBeenCalled();
    });

    it('should skip if the activity starts or ends outside rough NYC bounds', async () => {
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockActivity.stravaActivityId,
          start_latlng: [40.75, -73.99],
          end_latlng: [41.2, -73.5],
        }),
      });

      const createdMatch = {
        id: 'match-outside-nyc',
        result: SponsorMatchResult.SKIPPED_OUTSIDE_NYC,
      };
      vi.mocked(db.sponsorMatch.create).mockResolvedValue(createdMatch as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(SponsorMatchResult.SKIPPED_OUTSIDE_NYC);
      expect(result.message).toContain('current New York City service area');
      expect(db.campaign.findMany).not.toHaveBeenCalled();
    });
  });

  describe('hasExistingSponsorMatch', () => {
    it('should return true when sponsor match exists', async () => {
      const mockMatch = {
        id: 'match-123',
        activityId: 'activity-123',
      };
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(mockMatch as any);

      const result = await hasExistingSponsorMatch('activity-123');

      expect(result).toBe(true);
      expect(db.sponsorMatch.findUnique).toHaveBeenCalledWith({
        where: { activityId: 'activity-123' },
      });
    });

    it('should return false when sponsor match does not exist', async () => {
      vi.mocked(db.sponsorMatch.findUnique).mockResolvedValue(null);

      const result = await hasExistingSponsorMatch('activity-123');

      expect(result).toBe(false);
    });
  });
});

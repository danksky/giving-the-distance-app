/**
 * Unit tests for sponsor matching service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { matchActivityWithSponsor, COMMITMENT_AMOUNT_CENTS, hasExistingPlacement } from '../sponsor-matching';
import { PlacementResult } from '@prisma/client';

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    placementLog: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    campaign: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
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

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Sponsor Matching Service', () => {
  const mockActivity = {
    id: 'activity-123',
    stravaActivityId: BigInt(987654321),
    userId: 'user-456',
    athleteId: 'athlete-789',
    stravaAthleteId: BigInt(123456789),
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('matchActivityWithSponsor', () => {
    it('should skip if activity already has placement log (idempotency)', async () => {
      const existingPlacement = {
        id: 'placement-existing',
        activityId: mockActivity.id,
        result: PlacementResult.MATCHED,
      };

      vi.mocked(db.placementLog.findUnique).mockResolvedValue(existingPlacement as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(PlacementResult.SKIPPED_ALREADY_SPONSORED);
      expect(result.placementLogId).toBe(existingPlacement.id);
      expect(db.placementLog.findUnique).toHaveBeenCalledWith({
        where: { activityId: mockActivity.id },
      });
    });

    it('should skip if no active campaign available', async () => {
      vi.mocked(db.placementLog.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([]);
      
      const createdPlacement = {
        id: 'placement-no-campaign',
        result: PlacementResult.SKIPPED_NO_ACTIVE_CAMPAIGN,
      };
      vi.mocked(db.placementLog.create).mockResolvedValue(createdPlacement as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(PlacementResult.SKIPPED_NO_ACTIVE_CAMPAIGN);
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
      expect(db.placementLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          result: PlacementResult.SKIPPED_NO_ACTIVE_CAMPAIGN,
          decrementCents: 0,
        }),
      });
    });

    it('should skip if campaign has insufficient budget', async () => {
      const lowBudgetCampaign = {
        ...mockCampaign,
        budgetRemainingCents: 5, // Less than COMMITMENT_AMOUNT_CENTS (10)
      };

      vi.mocked(db.placementLog.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([lowBudgetCampaign as any]);
      
      const createdPlacement = {
        id: 'placement-no-budget',
        result: PlacementResult.SKIPPED_NO_BUDGET,
      };
      vi.mocked(db.placementLog.create).mockResolvedValue(createdPlacement as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(PlacementResult.SKIPPED_NO_BUDGET);
      expect(result.campaignId).toBe(lowBudgetCampaign.id);
      expect(db.placementLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          result: PlacementResult.SKIPPED_NO_BUDGET,
          campaignId: lowBudgetCampaign.id,
          decrementCents: 0,
        }),
      });
    });

    it('should skip if Strava API fetch fails', async () => {
      vi.mocked(db.placementLog.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);
      
      // Mock failed Strava API fetch
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const createdPlacement = {
        id: 'placement-update-failed',
        result: PlacementResult.SKIPPED_UPDATE_FAILED,
      };
      vi.mocked(db.placementLog.create).mockResolvedValue(createdPlacement as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(PlacementResult.SKIPPED_UPDATE_FAILED);
      expect(result.error).toContain('401');
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
      vi.mocked(db.placementLog.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);
      
      // Mock successful fetch but failed update
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: mockActivity.stravaActivityId,
            description: 'Existing description',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => 'Forbidden',
        });

      const createdPlacement = {
        id: 'placement-update-failed',
        result: PlacementResult.SKIPPED_UPDATE_FAILED,
      };
      vi.mocked(db.placementLog.create).mockResolvedValue(createdPlacement as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(PlacementResult.SKIPPED_UPDATE_FAILED);
      expect(result.error).toContain('403');
    });

    it('should skip if user has no selected charity', async () => {
      vi.mocked(db.placementLog.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);
      
      // Mock successful Strava update
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: mockActivity.stravaActivityId,
            description: '',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: mockActivity.stravaActivityId }),
        });

      // Mock user with no selected charity
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockActivity.userId,
        selectedCharityId: null,
      } as any);

      const createdPlacement = {
        id: 'placement-no-charity',
        result: PlacementResult.SKIPPED_UPDATE_FAILED,
      };
      vi.mocked(db.placementLog.create).mockResolvedValue(createdPlacement as any);

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(false);
      expect(result.result).toBe(PlacementResult.SKIPPED_UPDATE_FAILED);
      expect(result.error).toContain('no selected charity');
    });

    it('should successfully match activity with campaign', async () => {
      vi.mocked(db.placementLog.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);
      
      // Mock successful Strava update
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: mockActivity.stravaActivityId,
            description: 'Existing description',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: mockActivity.stravaActivityId }),
        });

      // Mock user with selected charity
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockActivity.userId,
        selectedCharityId: 'charity-unicef',
      } as any);

      // Mock transaction
      const mockPlacementLog = {
        id: 'placement-matched',
        result: PlacementResult.MATCHED,
      };
      const mockCharityCommitment = {
        id: 'commitment-123',
      };
      
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          campaign: {
            update: vi.fn().mockResolvedValue({}),
          },
          placementLog: {
            create: vi.fn().mockResolvedValue(mockPlacementLog),
          },
          charityCommitment: {
            create: vi.fn().mockResolvedValue(mockCharityCommitment),
          },
        });
      });

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      expect(result.success).toBe(true);
      expect(result.result).toBe(PlacementResult.MATCHED);
      expect(result.placementLogId).toBe(mockPlacementLog.id);
      expect(result.charityCommitmentId).toBe(mockCharityCommitment.id);
      expect(result.campaignId).toBe(mockCampaign.id);
    });

    it('should skip if activity description already has GTD marker', async () => {
      vi.mocked(db.placementLog.findUnique).mockResolvedValue(null);
      vi.mocked(db.campaign.findMany).mockResolvedValue([mockCampaign as any]);
      
      // Mock Strava fetch with GTD marker already present
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockActivity.stravaActivityId,
          description: 'Existing description #GTD',
        }),
      });

      // Mock user with selected charity
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockActivity.userId,
        selectedCharityId: 'charity-unicef',
      } as any);

      // Mock transaction
      const mockPlacementLog = {
        id: 'placement-matched',
        result: PlacementResult.MATCHED,
      };
      const mockCharityCommitment = {
        id: 'commitment-123',
      };
      
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          campaign: {
            update: vi.fn().mockResolvedValue({}),
          },
          placementLog: {
            create: vi.fn().mockResolvedValue(mockPlacementLog),
          },
          charityCommitment: {
            create: vi.fn().mockResolvedValue(mockCharityCommitment),
          },
        });
      });

      const result = await matchActivityWithSponsor(mockActivity, mockAccessToken);

      // Should still succeed because GTD marker check happens during update
      // and returns success without making the PUT request
      expect(result.success).toBe(true);
      expect(result.result).toBe(PlacementResult.MATCHED);
      
      // Verify that only one fetch was made (GET, no PUT)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasExistingPlacement', () => {
    it('should return true when placement exists', async () => {
      const mockPlacement = {
        id: 'placement-123',
        activityId: 'activity-123',
      };
      vi.mocked(db.placementLog.findUnique).mockResolvedValue(mockPlacement as any);

      const result = await hasExistingPlacement('activity-123');

      expect(result).toBe(true);
      expect(db.placementLog.findUnique).toHaveBeenCalledWith({
        where: { activityId: 'activity-123' },
      });
    });

    it('should return false when placement does not exist', async () => {
      vi.mocked(db.placementLog.findUnique).mockResolvedValue(null);

      const result = await hasExistingPlacement('activity-123');

      expect(result).toBe(false);
    });
  });
});

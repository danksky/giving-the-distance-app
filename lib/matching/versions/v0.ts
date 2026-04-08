import type { Prisma } from "@prisma/client";
import type {
  CampaignCandidate,
  MatchingDecisionMetadata,
} from "@/lib/matching/types";

export const MATCHING_VERSION_V0 = "v0";

export function selectCampaignV0(
  campaigns: CampaignCandidate[]
): CampaignCandidate | null {
  if (campaigns.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * campaigns.length);
  return campaigns[randomIndex];
}

export function buildDecisionMetadataV0(
  decisionReason: string,
  decisionContext?: Prisma.InputJsonValue
): MatchingDecisionMetadata {
  return {
    matchingVersion: MATCHING_VERSION_V0,
    decisionReason,
    decisionContext,
  };
}

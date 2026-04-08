export interface CampaignCandidate {
  id: string;
  budgetRemainingCents: number;
  sponsor: {
    businessName: string;
    website: string | null;
  };
}

export interface MatchingDecisionMetadata {
  matchingVersion: string;
  decisionReason: string;
  decisionContext?: Record<string, unknown>;
}

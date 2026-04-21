import { SponsorMatchResult } from "@prisma/client";

interface ImpactMessageInput {
  result?: SponsorMatchResult | null;
  notes?: string | null;
}

export function getUnmatchedImpactMessage({
  result,
  notes,
}: ImpactMessageInput): string {
  switch (result) {
    case SponsorMatchResult.SKIPPED_PRIVATE_ACTIVITY:
      return "This activity was not eligible for donor matching because it was private on Strava when donor matching ran.";

    case SponsorMatchResult.SKIPPED_OUTSIDE_NYC:
      if (notes?.includes("GPS start and end coordinates")) {
        return "This activity was not eligible for donor matching because it needs GPS start and end points within our current New York City service area.";
      }

      return "This activity was not eligible for donor matching because it started or ended outside our current New York City service area.";

    case SponsorMatchResult.SKIPPED_NO_ACTIVE_CAMPAIGN:
      return "This activity was not matched with a donor because there are no active donor campaigns available right now.";

    case SponsorMatchResult.SKIPPED_NO_BUDGET:
      return "This activity was not matched with a donor because current donor campaigns do not have available budget right now.";

    case SponsorMatchResult.SKIPPED_NO_SELECTED_CHARITY:
      return "This activity could not be matched with a donor because no active charity selection was available for it.";

    case SponsorMatchResult.SKIPPED_UPDATE_FAILED:
      return "We found a potential donor match for this activity, but we could not complete the matching process.";

    case SponsorMatchResult.SKIPPED_ALREADY_SPONSORED:
      return "This activity has already been matched with a donor.";

    default:
      return "This activity has not been matched with a donor yet. New activities are automatically matched when donors have available budget and meet our current matching rules.";
  }
}

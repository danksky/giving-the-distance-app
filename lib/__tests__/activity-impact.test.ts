import { describe, expect, it } from "vitest";
import { SponsorMatchResult } from "@prisma/client";
import { getUnmatchedImpactMessage } from "@/lib/activity-impact";

describe("getUnmatchedImpactMessage", () => {
  it("explains when an activity is private on Strava", () => {
    expect(
      getUnmatchedImpactMessage({
        result: SponsorMatchResult.SKIPPED_PRIVATE_ACTIVITY,
      })
    ).toContain("private on Strava");
  });

  it("explains when an activity is outside the NYC service area", () => {
    expect(
      getUnmatchedImpactMessage({
        result: SponsorMatchResult.SKIPPED_OUTSIDE_NYC,
        notes:
          "Activity is not eligible for sponsor matching because its GPS start and end points must both fall within the current New York City service area.",
      })
    ).toContain("outside our current New York City service area");
  });

  it("explains when GPS coordinates are missing", () => {
    expect(
      getUnmatchedImpactMessage({
        result: SponsorMatchResult.SKIPPED_OUTSIDE_NYC,
        notes:
          "Activity is not eligible for sponsor matching because it must include GPS start and end coordinates within New York City.",
      })
    ).toContain("needs GPS start and end points");
  });

  it("falls back to the generic pending message when no skip reason exists", () => {
    expect(getUnmatchedImpactMessage({})).toContain(
      "meet our current matching rules"
    );
  });
});

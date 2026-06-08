import { describe, expect, it } from "vitest";
import { getStravaActivityType } from "../strava-activity";

describe("getStravaActivityType", () => {
  it("prefers Strava sport_type over the deprecated type field", () => {
    expect(
      getStravaActivityType({
        sport_type: "Basketball",
        type: "Workout",
      })
    ).toBe("Basketball");
  });

  it("falls back to the deprecated type field", () => {
    expect(getStravaActivityType({ type: "Run" })).toBe("Run");
  });

  it("uses Workout when Strava provides no usable type", () => {
    expect(getStravaActivityType({ sport_type: " ", type: null })).toBe(
      "Workout"
    );
  });
});

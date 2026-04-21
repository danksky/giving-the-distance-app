import { describe, expect, it } from "vitest";
import {
  getGenericActivityTitle,
  getGenericActivityType,
} from "@/lib/activity-privacy";

describe("getGenericActivityTitle", () => {
  it("uses time of day and a generic activity type", () => {
    expect(getGenericActivityTitle("Run", "2026-04-21T07:30:00")).toBe(
      "Morning Run"
    );
    expect(getGenericActivityTitle("Swim", "2026-04-21T14:30:00")).toBe(
      "Afternoon Swim"
    );
    expect(getGenericActivityTitle("Ride", "2026-04-21T18:30:00")).toBe(
      "Evening Bike"
    );
  });

  it("falls back to the generic type when the start time is missing", () => {
    expect(getGenericActivityTitle("Run", null)).toBe("Run");
  });
});

describe("getGenericActivityType", () => {
  it("normalizes Strava ride activity types to bike", () => {
    expect(getGenericActivityType("Ride")).toBe("Bike");
    expect(getGenericActivityType("VirtualRide")).toBe("Bike");
    expect(getGenericActivityType("Mountain Bike Ride")).toBe("Bike");
  });
});

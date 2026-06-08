interface StravaActivityTypePayload {
  sport_type?: unknown;
  type?: unknown;
}

export function getStravaActivityType(
  activity: StravaActivityTypePayload
): string {
  if (
    typeof activity.sport_type === "string" &&
    activity.sport_type.trim() !== ""
  ) {
    return activity.sport_type.trim();
  }

  if (typeof activity.type === "string" && activity.type.trim() !== "") {
    return activity.type.trim();
  }

  return "Workout";
}

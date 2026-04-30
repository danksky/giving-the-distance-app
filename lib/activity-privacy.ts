/**
 * Activity Privacy Helpers
 * Handles anonymization and privacy checks for activity profiles
 */

/**
 * Anonymizes a user's name to show only first initial + bullets
 * Example: "Daniel Kawalsky" -> "D•••••"
 */
export function anonymizeName(name: string | null | undefined): string {
  if (!name || name.trim() === "") {
    return "A•••••";
  }
  const firstInitial = name.charAt(0).toUpperCase();
  return `${firstInitial}${"•".repeat(5)}`;
}

/**
 * Generalizes a private activity title by using only time of day + activity type.
 * Example: "Morning Run in Central Park" -> "Morning Run"
 */
export function getGenericActivityTitle(
  activityType: string | null | undefined,
  startDateLocal: Date | string | null | undefined
): string {
  const genericType = getGenericActivityType(activityType);
  const timeOfDay = getActivityTimeOfDay(startDateLocal);

  if (!timeOfDay) {
    return genericType;
  }

  return `${timeOfDay} ${genericType}`;
}

export function getGenericActivityType(
  activityType: string | null | undefined
): string {
  const trimmedType = activityType?.trim();

  if (!trimmedType) {
    return "Activity";
  }

  const normalizedType = trimmedType.toLowerCase().replace(/[^a-z]/g, "");

  if (normalizedType.includes("run")) {
    return "Run";
  }
  if (
    normalizedType.includes("ride") ||
    normalizedType.includes("bike") ||
    normalizedType.includes("cycling")
  ) {
    return "Bike";
  }
  if (normalizedType.includes("swim")) {
    return "Swim";
  }
  if (normalizedType.includes("walk")) {
    return "Walk";
  }
  if (normalizedType.includes("hike")) {
    return "Hike";
  }
  if (normalizedType.includes("row")) {
    return "Row";
  }
  if (normalizedType.includes("ski")) {
    return "Ski";
  }
  if (normalizedType.includes("yoga")) {
    return "Yoga";
  }
  if (normalizedType.includes("workout")) {
    return "Workout";
  }

  return toTitleCase(splitActivityType(trimmedType));
}

function getActivityTimeOfDay(
  startDateLocal: Date | string | null | undefined
): string | null {
  if (!startDateLocal) {
    return null;
  }

  const date = new Date(startDateLocal);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "Morning";
  }
  if (hour >= 12 && hour < 17) {
    return "Afternoon";
  }
  if (hour >= 17 && hour < 21) {
    return "Evening";
  }

  return "Night";
}

function splitActivityType(activityType: string): string {
  return activityType
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getFirstName(name: string | null | undefined): string {
  const trimmedName = name?.trim();

  if (!trimmedName) {
    return "Athlete";
  }

  return trimmedName.split(/\s+/)[0] || "Athlete";
}

/**
 * Checks if viewer can see the real profile details for an activity
 * Returns true if:
 * - Viewer is the activity owner
 * - Activity has isPublicProfile = true
 */
export function canViewRealProfile(
  activityUserId: string,
  activityIsPublicProfile: boolean,
  viewerUserId: string | undefined
): boolean {
  // Owner can always see their own profile
  if (viewerUserId && viewerUserId === activityUserId) {
    return true;
  }

  // Public profiles are visible to everyone
  if (activityIsPublicProfile) {
    return true;
  }

  // Default: private
  return false;
}

/**
 * Gets the display name based on privacy settings
 */
export function getDisplayName(
  realName: string | null | undefined,
  activityUserId: string,
  activityIsPublicProfile: boolean,
  viewerUserId: string | undefined
): string {
  if (canViewRealProfile(activityUserId, activityIsPublicProfile, viewerUserId)) {
    return realName || "Athlete";
  }
  return anonymizeName(realName);
}

/**
 * Gets the athlete name for public-facing aggregate feeds.
 * Public activities show first name only; private activities stay anonymized.
 */
export function getFeedDisplayName(
  realName: string | null | undefined,
  activityUserId: string,
  activityIsPublicProfile: boolean
): string {
  if (canViewRealProfile(activityUserId, activityIsPublicProfile, undefined)) {
    return getFirstName(realName);
  }

  return anonymizeName(realName);
}

/**
 * Gets the activity title based on privacy settings
 */
export function getDisplayActivityTitle(
  realActivityTitle: string | null | undefined,
  activityType: string | null | undefined,
  startDateLocal: Date | string | null | undefined,
  activityUserId: string,
  activityIsPublicProfile: boolean,
  viewerUserId: string | undefined
): string {
  if (canViewRealProfile(activityUserId, activityIsPublicProfile, viewerUserId)) {
    return realActivityTitle || activityType || "Activity";
  }

  return getGenericActivityTitle(activityType, startDateLocal);
}

/**
 * Gets the avatar URL based on privacy settings
 */
export function getDisplayAvatar(
  realAvatarUrl: string | null | undefined,
  activityUserId: string,
  activityIsPublicProfile: boolean,
  viewerUserId: string | undefined
): string {
  if (canViewRealProfile(activityUserId, activityIsPublicProfile, viewerUserId)) {
    return realAvatarUrl || "/avatar-placeholder.png";
  }
  return "/avatar-placeholder.png";
}

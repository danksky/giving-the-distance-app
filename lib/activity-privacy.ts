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

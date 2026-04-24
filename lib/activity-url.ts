export function getActivityRouteSegment(activity: {
  id: string;
  shortcode?: string | null;
}): string {
  return activity.shortcode ?? activity.id;
}

export function getActivityPath(activity: {
  id: string;
  shortcode?: string | null;
}): string {
  return `/activities/${getActivityRouteSegment(activity)}`;
}

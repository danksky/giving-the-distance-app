import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActivityPath } from "@/lib/activity-url";

/**
 * Shortcode redirect page
 * Redirects /a/[shortcode] to the canonical /activities/[shortcode] URL
 */
export default async function ShortcodePage({
  params,
}: {
  params: Promise<{ shortcode: string }>;
}) {
  const { shortcode } = await params;

  // Find activity by shortcode
  const activity = await db.activity.findUnique({
    where: { shortcode },
    select: { id: true, shortcode: true, deletedAt: true },
  });

  // If activity not found or deleted, show 404
  if (!activity || activity.deletedAt) {
    notFound();
  }

  // Redirect to full activity page
  redirect(getActivityPath(activity));
}

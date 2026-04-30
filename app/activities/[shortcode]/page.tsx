import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getCharityAtTime } from "@/lib/charity-helpers";
import {
  getDisplayName,
  getDisplayAvatar,
  canViewRealProfile,
  getGenericActivityTitle,
  getGenericActivityType,
} from "@/lib/activity-privacy";
import CharityLogo from "@/components/CharityLogo";
import Navbar from "@/components/Navbar";
import ActivityPrivacyToggle from "@/components/ActivityPrivacyToggle";
import ActivityMap from "@/components/ActivityMap";
import { getUnmatchedImpactMessage } from "@/lib/activity-impact";
import { getActivityPath } from "@/lib/activity-url";
import { isValidShortcode } from "@/lib/shortcode";
import type { Metadata } from "next";

// Helper function to format duration in seconds to HH:MM:SS
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

async function getActivity(shortcodeOrId: string) {
  try {
    const activity = await db.activity.findUnique({
      where: isValidShortcode(shortcodeOrId)
        ? { shortcode: shortcodeOrId }
        : { id: shortcodeOrId },
      include: {
        user: true,
        sponsorMatches: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        charityCommitments: {
          include: {
            charity: true,
            campaign: {
              include: {
                sponsor: true,
              },
            },
          },
          take: 1, // Should only be one commitment per activity
        },
      },
    });

    return activity;
  } catch {
    return null;
  }
}

async function getViewerUserId() {
  const session = await auth();

  if (!session?.user?.email) {
    return undefined;
  }

  const viewer = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  return viewer?.id;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortcode: string }>;
}): Promise<Metadata> {
  const { shortcode } = await params;
  const activity = await getActivity(shortcode);

  if (!activity) {
    return {
      title: "Activity Not Found | Giving the Distance",
    };
  }

  const viewerUserId = await getViewerUserId();
  const showRealProfile = canViewRealProfile(
    activity.userId,
    activity.isPublicProfile,
    viewerUserId
  );
  const genericActivityType = getGenericActivityType(activity.type);
  const activityLabel = showRealProfile
    ? activity.name || activity.type || "Activity"
    : getGenericActivityTitle(activity.type, activity.startDateLocal);
  const distanceText = activity.distanceMeters
    ? `${(Number(activity.distanceMeters) / 1000).toFixed(2)} km`
    : null;

  const title = showRealProfile
    ? `${activityLabel} by ${activity.user.name || "Athlete"} | Giving the Distance`
    : `${activityLabel} | Giving the Distance`;

  const description = showRealProfile
    ? `${activity.user.name || "An athlete"} ${activity.type || "activity"} for charity${
        distanceText ? ` - ${distanceText}` : ""
      }`
    : `${genericActivityType} supporting charity${
        distanceText ? ` - ${distanceText}` : ""
      }`;

  return {
    title,
    description,
    alternates: {
      canonical: getActivityPath(activity),
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ shortcode: string }>;
}) {
  const { shortcode } = await params;
  const activity = await getActivity(shortcode);

  if (!activity || activity.deletedAt) {
    notFound();
  }

  if (activity.shortcode && shortcode !== activity.shortcode) {
    redirect(getActivityPath(activity));
  }

  // Get current session to check if viewer is owner
  const viewerUserId = await getViewerUserId();

  // Check if viewer can see real profile details
  const showRealProfile = canViewRealProfile(
    activity.userId,
    activity.isPublicProfile,
    viewerUserId
  );
  const isOwner = viewerUserId === activity.userId;
  const isPrivateActivityProfile = !showRealProfile;
  const shouldShowPrivateActivityAlert = isPrivateActivityProfile && !isOwner;
  const shouldShowJoinCta = shouldShowPrivateActivityAlert && !viewerUserId;
  const privateActivityLabel = getGenericActivityType(
    activity.type
  ).toLowerCase();

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log("[Activity Privacy Debug]", {
      activityId: activity.id,
      isPublicProfile: activity.isPublicProfile,
      isOwner,
      showRealProfile,
      viewerUserId: viewerUserId ? "present" : "none",
    });
  }

  // Get display name and avatar based on privacy settings
  const displayName = getDisplayName(
    activity.user.name,
    activity.userId,
    activity.isPublicProfile,
    viewerUserId
  );
  const displayAvatar = getDisplayAvatar(
    activity.user.image,
    activity.userId,
    activity.isPublicProfile,
    viewerUserId
  );
  const displayActivityTitle = showRealProfile
    ? activity.name || "Untitled Activity"
    : getGenericActivityTitle(activity.type, activity.startDateLocal);
  const canShowRouteMap =
    !!activity.gpxBlobUrl &&
    (isOwner || (showRealProfile && activity.isPublicRouteMap));

  // Calculate distances
  const distanceKm = activity.distanceMeters
    ? (Number(activity.distanceMeters) / 1000).toFixed(2)
    : "0.00";
  const distanceMi = activity.distanceMeters
    ? (Number(activity.distanceMeters) / 1609.34).toFixed(2)
    : "0.00";

  // Calculate pace (min/km and min/mi)
  // Pace is in seconds per km/mi, need to convert to min:sec format
  const paceSecondsPerKm =
    activity.movingTimeSeconds &&
    activity.distanceMeters &&
    Number(activity.distanceMeters) > 0
      ? activity.movingTimeSeconds / (Number(activity.distanceMeters) / 1000)
      : null;

  const paceSecondsPerMi =
    activity.movingTimeSeconds &&
    activity.distanceMeters &&
    Number(activity.distanceMeters) > 0
      ? activity.movingTimeSeconds / (Number(activity.distanceMeters) / 1609.34)
      : null;

  // Format pace as min:sec
  const paceMinPerKm = paceSecondsPerKm
    ? `${Math.floor(paceSecondsPerKm / 60)}:${Math.floor(paceSecondsPerKm % 60)
        .toString()
        .padStart(2, "0")}`
    : null;

  const paceMinPerMi = paceSecondsPerMi
    ? `${Math.floor(paceSecondsPerMi / 60)}:${Math.floor(paceSecondsPerMi % 60)
        .toString()
        .padStart(2, "0")}`
    : null;

  // Format moving time
  const movingTime = activity.movingTimeSeconds
    ? formatDuration(activity.movingTimeSeconds)
    : "—";

  // Format elevation
  const elevationM = activity.totalElevationGain
    ? `${Number(activity.totalElevationGain).toFixed(0)}`
    : "0";
  const elevationFt = activity.totalElevationGain
    ? `${(Number(activity.totalElevationGain) * 3.28084).toFixed(0)}`
    : "0";

  // Format for header: "[Name] [activity] on [Month Day], [year]"
  const firstName = showRealProfile
    ? activity.user.name?.split(" ")[0] || "Athlete"
    : displayName;
  const activityDateShort = activity.startDateLocal
    ? new Date(activity.startDateLocal).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown date";

  const activityTime = activity.startDateLocal
    ? new Date(activity.startDateLocal).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  // Get the charity commitment for this activity (if sponsored)
  const commitment = activity.charityCommitments?.[0];
  const hasSponsorship = !!commitment;
  const latestSponsorMatch = activity.sponsorMatches?.[0];
  const unmatchedImpactMessage = getUnmatchedImpactMessage({
    result: latestSponsorMatch?.result,
    notes: latestSponsorMatch?.notes,
  });

  // Get charity - either from commitment or fallback to user's charity at time of activity
  const activityCharity =
    commitment?.charity ||
    (await getCharityAtTime(
      activity.userId,
      activity.startDateLocal || activity.createdAt
    ));

  // Get sponsor data from commitment
  const sponsorName = commitment?.campaign.sponsor.businessName;
  const sponsorSlug = commitment?.campaign.sponsor.slug;
  const donationAmount = commitment ? commitment.amountCents / 100 : 0;

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex justify-end">
          <Link href="/dashboard" className="btn btn-outline btn-sm w-fit">
            ← Back to Dashboard
          </Link>
        </div>

        {shouldShowPrivateActivityAlert && (
          <div
            role="alert"
            className="alert mb-6 items-start border border-base-300 bg-base-300/40"
          >
            <div className="space-y-3">
              <p className="text-sm sm:text-base">
                This athlete has chosen to keep their {privateActivityLabel}{" "}
                private. The {privateActivityLabel} name has been generalized to
                protect their privacy.
              </p>
              {shouldShowJoinCta && (
                <Link href="/" className="btn btn-primary btn-sm w-fit">
                  Join the NYC movement
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Activity Header Card */}
        <div className="card bg-base-100  mb-6">
          <div className="card-body">
            {/* Activity Header */}
            <div className="flex items-start gap-4">
              <div className="avatar">
                <div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <Image
                    src={displayAvatar}
                    alt={displayName}
                    width={64}
                    height={64}
                  />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">
                  {firstName}&apos;s {activity.type} on {activityDateShort}
                </h1>
                <h2 className="text-xl mb-2">{displayActivityTitle}</h2>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-base-content/60">
                    Imported from Strava™ • {activityTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donation Impact Card - Only show if sponsored */}
        {hasSponsorship ? (
          <div className="card bg-base-100 mb-6">
            <div className="card-body">
              <h3 className="card-title mb-4">Impact</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Charity Section */}
                <div>
                  <div className="text-sm font-semibold text-base-content/60 mb-2">
                    BENEFITING CHARITY
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <CharityLogo
                      charityId={activityCharity?.id}
                      name={activityCharity?.name || "Charity"}
                      logoUrl={activityCharity?.logoUrl}
                      size="lg"
                    />
                    <div>
                      <div className="text-2xl font-bold text-[#8B4ACC]">
                        {activityCharity?.name || "Charity"}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {activityCharity?.fullName || ""}
                      </div>
                    </div>
                  </div>
                  {activityCharity?.id && (
                    <Link
                      href={`/charities/${activityCharity.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      View Charity
                    </Link>
                  )}
                </div>

                {/* Donation Amount */}
                <div>
                  <div className="text-sm font-semibold text-base-content/60 mb-2">
                    COMMITMENT AMOUNT
                  </div>
                  <div className="text-5xl font-bold text-[#8B4ACC] mb-2">
                    ${donationAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-base-content/60">
                    Generated from this activity
                  </div>
                </div>
              </div>

              {/* Sponsor Section */}
              {sponsorName && sponsorSlug && (
                <div className="mt-6 pt-6 border-t border-base-300">
                  <div className="text-sm font-semibold text-base-content/60 mb-3">
                    MADE POSSIBLE BY
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-lg text-primary">
                        {sponsorName
                          .split(" ")
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xl font-bold">{sponsorName}</div>
                        <div className="text-sm text-base-content/60">
                          Donor
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/sponsors/${sponsorSlug}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Donor
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No Sponsorship Card */
          <div className="card bg-base-100  mb-6">
            <div className="card-body">
              <h3 className="card-title mb-4">Impact</h3>
              <p className="text-base-content/70">
                {unmatchedImpactMessage}
              </p>
              {activityCharity && (
                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                  <div className="text-sm font-semibold text-base-content/60 mb-2">
                    YOUR SELECTED CHARITY
                  </div>
                  <div className="flex items-center gap-3">
                    <CharityLogo
                      charityId={activityCharity.id}
                      name={activityCharity.name}
                      logoUrl={activityCharity.logoUrl}
                      size="md"
                    />
                    <div>
                      <div className="text-lg font-bold">
                        {activityCharity.name}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {activityCharity.fullName}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/charities/${activityCharity.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      View Charity
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card bg-base-100 mb-6">
          <div className="card-body">
            <h3 className="card-title mb-4">Activity Stats</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="stat rounded-lg bg-base-200 p-4">
                <div className="stat-title">Distance</div>
                <div className="stat-value text-2xl">{distanceKm}</div>
                <div className="stat-desc">km ({distanceMi} mi)</div>
              </div>

              <div className="stat rounded-lg bg-base-200 p-4">
                <div className="stat-title">Time</div>
                <div className="stat-value text-2xl">{movingTime}</div>
                <div className="stat-desc">moving time</div>
              </div>

              {paceMinPerKm && (
                <div className="stat rounded-lg bg-base-200 p-4">
                  <div className="stat-title">Pace</div>
                  <div className="stat-value text-2xl">{paceMinPerKm}</div>
                  <div className="stat-desc">
                    min/km ({paceMinPerMi} min/mi)
                  </div>
                </div>
              )}

              <div className="stat rounded-lg bg-base-200 p-4">
                <div className="stat-title">Elevation Gain</div>
                <div className="stat-value text-2xl">{elevationM}</div>
                <div className="stat-desc">m ({elevationFt} ft)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Route Map */}
        {canShowRouteMap && activity.gpxBlobUrl && (
          <div className="card bg-base-100 mb-6">
            <div className="card-body">
              <h3 className="card-title mb-4">Route Map</h3>
              <ActivityMap
                gpxBlobUrl={activity.gpxBlobUrl}
                activityName={activity.name || "Activity"}
              />
            </div>
          </div>
        )}

        {/* Visibility Settings - Only visible to owner */}
        {isOwner && (
          <ActivityPrivacyToggle
            activityId={activity.id}
            initialIsPublic={activity.isPublicProfile}
            initialIsPublicRouteMap={activity.isPublicRouteMap}
            hasRouteMap={Boolean(activity.gpxBlobUrl)}
          />
        )}
      </main>
    </div>
  );
}

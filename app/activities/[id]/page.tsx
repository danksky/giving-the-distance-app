import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getCharityAtTime } from "@/lib/charity-helpers";
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

// Helper function to get emoji for activity type
function getActivityEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    Run: "🏃",
    Ride: "🚴",
    Swim: "🏊",
    Walk: "🚶",
    Hike: "🥾",
    AlpineSki: "⛷️",
    BackcountrySki: "⛷️",
    NordicSki: "⛷️",
    Snowboard: "🏂",
    IceSkate: "⛸️",
    InlineSkate: "⛸️",
    Kayaking: "🛶",
    Canoeing: "🛶",
    Rowing: "🚣",
    StandUpPaddling: "🏄",
    Surfing: "🏄",
    Windsurf: "🏄",
    Kitesurf: "🪂",
    WeightTraining: "🏋️",
    Workout: "💪",
    Yoga: "🧘",
    RockClimbing: "🧗",
    VirtualRide: "🚴",
    VirtualRun: "🏃",
  };
  return emojiMap[type] || "🏃";
}

async function getActivity(id: string) {
  try {
    const activity = await db.activity.findUnique({
      where: { id },
      include: {
        user: true,
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const activity = await getActivity(id);

  if (!activity) {
    return {
      title: "Activity Not Found | Giving the Distance",
    };
  }

  const title = `${activity.name || "Activity"} by ${
    activity.user.name || "Athlete"
  } | Giving the Distance`;
  const description = `${activity.user.name} ${activity.type} for charity - ${
    activity.distanceMeters
      ? `${(Number(activity.distanceMeters) / 1000).toFixed(2)} km`
      : ""
  }`;

  return {
    title,
    description,
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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getActivity(id);

  if (!activity || activity.deletedAt) {
    notFound();
  }

  // Calculate distances
  const distanceKm = activity.distanceMeters
    ? (Number(activity.distanceMeters) / 1000).toFixed(2)
    : "0.00";
  const distanceMi = activity.distanceMeters
    ? (Number(activity.distanceMeters) / 1609.34).toFixed(2)
    : "0.00";

  // Calculate pace (min/km and min/mi)
  const paceMinPerKm =
    activity.movingTimeSeconds && activity.distanceMeters
      ? (
          activity.movingTimeSeconds /
          (Number(activity.distanceMeters) / 1000)
        ).toFixed(0)
      : null;
  const paceMinPerMi =
    activity.movingTimeSeconds && activity.distanceMeters
      ? (
          activity.movingTimeSeconds /
          (Number(activity.distanceMeters) / 1609.34)
        ).toFixed(0)
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

  // Format date
  const activityDate = activity.startDateLocal
    ? new Date(activity.startDateLocal).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const activityTime = activity.startDateLocal
    ? new Date(activity.startDateLocal).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  // Get the charity commitment for this activity (if sponsored)
  const commitment = activity.charityCommitments?.[0];
  const hasSponsorship = !!commitment;

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
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">
            Giving the Distance
          </Link>
        </div>
        <div className="flex-none gap-2">
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            Dashboard
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Activity Header Card */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            {/* Athlete Info */}
            <div className="flex items-center gap-4 mb-4">
              {activity.user.image ? (
                <div className="avatar">
                  <div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <Image
                      src={activity.user.image}
                      alt={activity.user.name || "Athlete"}
                      width={64}
                      height={64}
                    />
                  </div>
                </div>
              ) : (
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content w-16 rounded-full">
                    <span className="text-2xl">
                      {activity.user.name?.charAt(0) || "A"}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{activity.user.name}</h2>
                <p className="text-base-content/60">
                  {activityDate} at {activityTime}
                </p>
              </div>
            </div>

            {/* Activity Title */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">
                {getActivityEmoji(activity.type)}
              </span>
              <div>
                <h1 className="text-3xl font-bold">
                  {activity.name || "Untitled Activity"}
                </h1>
                <p className="text-xl text-base-content/60">{activity.type}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title mb-4">Activity Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Distance */}
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Distance</div>
                <div className="stat-value text-2xl">{distanceKm}</div>
                <div className="stat-desc">km ({distanceMi} mi)</div>
              </div>

              {/* Time */}
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Time</div>
                <div className="stat-value text-2xl">{movingTime}</div>
                <div className="stat-desc">moving time</div>
              </div>

              {/* Pace */}
              {paceMinPerKm && (
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-title">Pace</div>
                  <div className="stat-value text-2xl">
                    {Math.floor(Number(paceMinPerKm))}:
                    {(
                      ((Number(paceMinPerKm) % 1) * 60).toFixed(0) as string
                    ).padStart(2, "0")}
                  </div>
                  <div className="stat-desc">
                    min/km (
                    {paceMinPerMi &&
                      `${Math.floor(Number(paceMinPerMi))}:${(
                        ((Number(paceMinPerMi) % 1) * 60).toFixed(0) as string
                      ).padStart(2, "0")} min/mi`}
                    )
                  </div>
                </div>
              )}

              {/* Elevation */}
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Elevation Gain</div>
                <div className="stat-value text-2xl">{elevationM}</div>
                <div className="stat-desc">m ({elevationFt} ft)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Donation Impact Card - Only show if sponsored */}
        {hasSponsorship ? (
          <div className="relative rounded-lg shadow-xl mb-6 overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#af2878] via-[#d68bb5] to-[#f3dce8] opacity-90"></div>

            {/* Content overlay */}
            <div className="relative z-10 bg-base-100/95 backdrop-blur-sm rounded-lg m-1 p-6 shadow-md">
              <h3 className="text-2xl font-bold mb-4">💝 Impact</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Charity Section */}
                <div>
                  <div className="text-sm font-semibold text-base-content/60 mb-2">
                    BENEFITING CHARITY
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-4xl">
                      {activityCharity?.emoji || "🌍"}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#af2878]">
                        {activityCharity?.name || "Charity"}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {activityCharity?.fullName || ""}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Donation Amount */}
                <div>
                  <div className="text-sm font-semibold text-base-content/60 mb-2">
                    COMMITMENT AMOUNT
                  </div>
                  <div className="text-5xl font-bold text-[#af2878] mb-2">
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
                      <div className="text-3xl">🏪</div>
                      <div>
                        <div className="text-xl font-bold">{sponsorName}</div>
                        <div className="text-sm text-base-content/60">
                          Local Business Sponsor
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/sponsors/${sponsorSlug}`}
                      className="btn btn-outline btn-sm btn-primary"
                    >
                      View Sponsor
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No Sponsorship Card */
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h3 className="text-xl font-bold mb-2">💝 Impact</h3>
              <p className="text-base-content/70">
                This activity has not been matched with a sponsor yet. New
                activities are automatically matched when sponsors have
                available budget.
              </p>
              {activityCharity && (
                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                  <div className="text-sm font-semibold text-base-content/60 mb-2">
                    YOUR SELECTED CHARITY
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{activityCharity.emoji}</div>
                    <div>
                      <div className="text-lg font-bold">
                        {activityCharity.name}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {activityCharity.fullName}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Activity Info */}
        {(activity.timezone || activity.isManual) && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h3 className="card-title mb-2">Additional Information</h3>
              <div className="space-y-2 text-sm">
                {activity.timezone && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Timezone:</span>
                    <span className="text-base-content/70">
                      {activity.timezone}
                    </span>
                  </div>
                )}
                {activity.isManual && (
                  <div className="badge badge-outline">Manually Entered</div>
                )}
                {activity.isPrivate && (
                  <div className="badge badge-outline">Private Activity</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link href="/dashboard" className="btn btn-ghost">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

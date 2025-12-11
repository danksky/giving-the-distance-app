import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const params = await searchParams;
  const errorMessage = params.error;
  const successMessage = params.success;

  // Get user with Strava connection
  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    include: {
      accounts: {
        where: { provider: "strava" },
      },
      stravaAthlete: true,
      activities: {
        orderBy: {
          startDate: "desc",
        },
        take: 20, // Show last 20 activities (including deleted)
      },
    },
  });

  const hasStrava = (user?.accounts.length ?? 0) > 0;
  const stravaAthlete = user?.stravaAthlete;
  const activities = user?.activities ?? [];

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
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar placeholder"
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="bg-neutral text-neutral-content w-10 rounded-full">
                  <span className="text-xl">
                    {session.user.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li className="menu-title">{session.user.email}</li>
              <li>
                <Link href="/api/auth/signout">Sign Out</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Success Message */}
        {successMessage && (
          <div role="alert" className="alert alert-success mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Success!</h3>
              <div className="text-sm">
                {decodeURIComponent(successMessage)}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div role="alert" className="alert alert-error mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Connection Failed</h3>
              <div className="text-sm">{decodeURIComponent(errorMessage)}</div>
              <div className="text-xs mt-1">
                Please make sure to authorize all requested permissions when
                connecting to Strava.
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <div className="flex items-center gap-4">
              {session.user.image && (
                <div className="avatar">
                  <div className="w-16 rounded-full">
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={64}
                      height={64}
                    />
                  </div>
                </div>
              )}
              <div>
                <h2 className="card-title text-2xl">
                  Welcome, {session.user.name}! 👋
                </h2>
                <p>
                  Your Google account is connected. Let&apos;s set up Strava
                  next.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Strava Connection Card */}
        {!hasStrava ? (
          <div className="card bg-warning text-warning-content shadow-xl mb-8">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="card-title text-xl mb-2">
                    Connect Your Strava Account
                  </h3>
                  <p className="mb-2">
                    Link your Strava to start tracking your activities and
                    creating sponsorships. We&apos;ll automatically add donation
                    messages to your activities.
                  </p>
                  <div className="text-sm opacity-80 mb-4">
                    <strong>Required permissions:</strong> Activity Read,
                    Profile Read, Activity Write
                  </div>
                  <a href="/api/strava/connect" className="btn btn-primary">
                    🔗 Connect Strava
                  </a>
                </div>
                <div className="text-6xl">🏃‍♂️</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card bg-success text-success-content shadow-xl mb-8">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {stravaAthlete?.profile && (
                    <div className="avatar">
                      <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <Image
                          src={stravaAthlete.profile}
                          alt="Strava Profile"
                          width={64}
                          height={64}
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="card-title text-xl">✓ Strava Connected</h3>
                    <p className="font-semibold">
                      {stravaAthlete?.firstname} {stravaAthlete?.lastname}
                    </p>
                    {stravaAthlete?.city && stravaAthlete?.state && (
                      <p className="text-sm opacity-80">
                        {stravaAthlete.city}, {stravaAthlete.state}
                      </p>
                    )}
                    <form
                      action="/api/strava/disconnect"
                      method="POST"
                      className="mt-3"
                    >
                      <button type="submit" className="btn btn-ghost btn-xs">
                        Disconnect Strava
                      </button>
                    </form>
                  </div>
                </div>
                <div className="text-6xl">✅</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        {hasStrava && (
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h3 className="card-title">Recent Activities</h3>
              {activities.length === 0 ? (
                <div className="text-center py-8 opacity-60">
                  <p className="mb-2">No activities yet.</p>
                  <p className="text-sm">
                    Activities from Strava will appear here automatically once
                    you complete them.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Type</th>
                        <th>Distance</th>
                        <th>Time</th>
                        <th>Elevation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity) => {
                        const isDeleted = !!activity.deletedAt;

                        const distanceKm =
                          !isDeleted && activity.distanceMeters
                            ? (Number(activity.distanceMeters) / 1000).toFixed(
                                2
                              )
                            : "—";
                        const distanceMi =
                          !isDeleted && activity.distanceMeters
                            ? (
                                Number(activity.distanceMeters) / 1609.34
                              ).toFixed(2)
                            : "—";

                        const movingTime =
                          !isDeleted && activity.movingTimeSeconds
                            ? formatDuration(activity.movingTimeSeconds)
                            : "—";

                        const elevationM =
                          !isDeleted && activity.totalElevationGain
                            ? `${Number(activity.totalElevationGain).toFixed(
                                0
                              )}m`
                            : "—";
                        const elevationFt =
                          !isDeleted && activity.totalElevationGain
                            ? `${(
                                Number(activity.totalElevationGain) * 3.28084
                              ).toFixed(0)}ft`
                            : "—";

                        const date = activity.startDateLocal
                          ? new Date(
                              activity.startDateLocal
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—";

                        return (
                          <tr
                            key={activity.id}
                            className={isDeleted ? "opacity-50" : ""}
                          >
                            <td>{date}</td>
                            <td>
                              {isDeleted ? (
                                <span className="italic opacity-60">
                                  [Deleted Activity]
                                </span>
                              ) : (
                                <span>{activity.name || "Untitled"}</span>
                              )}
                            </td>
                            <td>
                              {!isDeleted && (
                                <>
                                  {getActivityEmoji(activity.type)}{" "}
                                  {activity.type}
                                </>
                              )}
                            </td>
                            <td>
                              {!isDeleted ? (
                                <>
                                  <div>{distanceKm} km</div>
                                  <div className="text-xs opacity-60">
                                    {distanceMi} mi
                                  </div>
                                </>
                              ) : (
                                <span className="opacity-40">—</span>
                              )}
                            </td>
                            <td>
                              {!isDeleted ? (
                                movingTime
                              ) : (
                                <span className="opacity-40">—</span>
                              )}
                            </td>
                            <td>
                              {!isDeleted ? (
                                <>
                                  <div>{elevationM}</div>
                                  <div className="text-xs opacity-60">
                                    {elevationFt}
                                  </div>
                                </>
                              ) : (
                                <span className="opacity-40">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Details */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Account Information</h3>
            <div className="stats stats-vertical lg:stats-horizontal shadow">
              <div className="stat">
                <div className="stat-title">Email</div>
                <div className="stat-value text-sm">{session.user.email}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Name</div>
                <div className="stat-value text-sm">{session.user.name}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Google</div>
                <div className="stat-value text-sm text-success">
                  ✓ Connected
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Strava</div>
                <div
                  className={`stat-value text-sm ${
                    hasStrava ? "text-success" : "text-base-content opacity-40"
                  }`}
                >
                  {hasStrava ? "✓ Connected" : "✗ Not yet"}
                </div>
              </div>
              {hasStrava && (
                <div className="stat">
                  <div className="stat-title">Total Activities</div>
                  <div className="stat-value text-sm">{activities.length}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="collapse collapse-arrow bg-base-100 mt-8">
            <input type="checkbox" />
            <div className="collapse-title font-medium">
              🔧 Debug Info (Dev Only)
            </div>
            <div className="collapse-content">
              <div className="mockup-code text-xs">
                <pre>{JSON.stringify(session, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

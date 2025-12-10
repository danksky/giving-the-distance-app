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
        take: 20, // Show last 20 activities
      },
    },
  });

  const hasStrava = (user?.accounts.length ?? 0) > 0;
  const stravaAthlete = user?.stravaAthlete;
  const activities = user?.activities ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Giving the Distance
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {session.user.email}
              </span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <h3 className="text-green-900 font-semibold mb-1">Success!</h3>
                <p className="text-green-700 text-sm">
                  {decodeURIComponent(successMessage)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-red-900 font-semibold mb-1">
                  Connection Failed
                </h3>
                <p className="text-red-700 text-sm mb-3">
                  {decodeURIComponent(errorMessage)}
                </p>
                <p className="text-red-600 text-xs">
                  Please make sure to authorize all requested permissions when
                  connecting to Strava.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={64}
                height={64}
                className="rounded-full"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome, {session.user.name}! 👋
              </h2>
              <p className="text-gray-600">
                Your Google account is connected. Let&apos;s set up Strava next.
              </p>
            </div>
          </div>
        </div>

        {/* Strava Connection Card */}
        {!hasStrava ? (
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg shadow p-6 mb-8 border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Connect Your Strava Account
                </h3>
                <p className="text-gray-600 mb-2">
                  Link your Strava to start tracking your activities and
                  creating sponsorships.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  <strong>Required permissions:</strong> Activity Read, Profile
                  Read
                </p>
                <a
                  href="/api/strava/connect"
                  className="inline-block px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl"
                >
                  🔗 Connect Strava
                </a>
              </div>
              <div className="text-6xl">🏃‍♂️</div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 mb-8 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {stravaAthlete?.profile && (
                  <Image
                    src={stravaAthlete.profile}
                    alt="Strava Profile"
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-orange-400"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    ✓ Strava Connected
                  </h3>
                  <p className="text-gray-600">
                    {stravaAthlete?.firstname} {stravaAthlete?.lastname}
                  </p>
                  {stravaAthlete?.city && stravaAthlete?.state && (
                    <p className="text-sm text-gray-500">
                      {stravaAthlete.city}, {stravaAthlete.state}
                    </p>
                  )}
                  <form
                    action="/api/strava/disconnect"
                    method="POST"
                    className="mt-3"
                  >
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Disconnect Strava
                    </button>
                  </form>
                </div>
              </div>
              <div className="text-6xl">✅</div>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        {hasStrava && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Recent Activities
            </h3>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No activities yet.</p>
                <p className="text-sm">
                  Activities from Strava will appear here automatically once you
                  complete them.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Elevation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activities.map((activity) => {
                      const distanceKm = activity.distanceMeters
                        ? (Number(activity.distanceMeters) / 1000).toFixed(2)
                        : "—";
                      const distanceMi = activity.distanceMeters
                        ? (Number(activity.distanceMeters) / 1609.34).toFixed(2)
                        : "—";

                      const movingTime = activity.movingTimeSeconds
                        ? formatDuration(activity.movingTimeSeconds)
                        : "—";

                      const elevationM = activity.totalElevationGain
                        ? `${Number(activity.totalElevationGain).toFixed(0)}m`
                        : "—";
                      const elevationFt = activity.totalElevationGain
                        ? `${(
                            Number(activity.totalElevationGain) * 3.28084
                          ).toFixed(0)}ft`
                        : "—";

                      const date = activity.startDateLocal
                        ? new Date(activity.startDateLocal).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "—";

                      return (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {date}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {activity.name || "Untitled"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {getActivityEmoji(activity.type)} {activity.type}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div>{distanceKm} km</div>
                            <div className="text-xs text-gray-500">
                              {distanceMi} mi
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {movingTime}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div>{elevationM}</div>
                            <div className="text-xs text-gray-500">
                              {elevationFt}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Account Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Account Information
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600">Email:</dt>
              <dd className="font-medium text-gray-900">
                {session.user.email}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Name:</dt>
              <dd className="font-medium text-gray-900">{session.user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Google Connected:</dt>
              <dd className="font-medium text-green-600">✓ Yes</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Strava Connected:</dt>
              <dd
                className={`font-medium ${
                  hasStrava ? "text-green-600" : "text-gray-400"
                }`}
              >
                {hasStrava ? "✓ Yes" : "✗ Not yet"}
              </dd>
            </div>
            {hasStrava && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Activities:</dt>
                <dd className="font-medium text-gray-900">
                  {activities.length}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 bg-gray-100 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-gray-700">
              🔧 Debug Info (Dev Only)
            </summary>
            <pre className="mt-4 text-xs overflow-auto bg-white p-4 rounded border">
              {JSON.stringify(session, null, 2)}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}

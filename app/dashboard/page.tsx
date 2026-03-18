import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import Navbar from "@/components/Navbar";

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const errorMessage = params.error;
  const successMessage = params.success;

  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    include: {
      accounts: {
        where: { provider: "strava" },
      },
      activities: {
        orderBy: {
          startDate: "desc",
        },
        take: 4,
      },
    },
  });

  const hasStrava = (user?.accounts.length ?? 0) > 0;
  const activities = user?.activities ?? [];
  const totalRaisedAggregate = user
    ? await db.charityCommitment.aggregate({
        where: {
          userId: user.id,
        },
        _sum: {
          amountCents: true,
        },
      })
    : null;
  const totalRaised = (totalRaisedAggregate?._sum.amountCents ?? 0) / 100;

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <main className="container mx-auto max-w-7xl px-4 py-8">
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

        {!hasStrava && (
          <div className="card bg-base-100">
            <div className="card-body">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 flex-shrink-0">
                    <Image
                      src="/logos/services/strava.svg"
                      alt="Strava"
                      width={48}
                      height={48}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="card-title mb-1 text-xl sm:text-2xl">
                      Connect Strava
                    </h2>
                    <p className="text-sm text-base-content/70">
                      Link your account to sync your activities here.
                    </p>
                  </div>
                </div>
                <Link
                  href="/settings/strava"
                  className="btn btn-primary w-full sm:w-auto"
                >
                  Connect Strava
                </Link>
              </div>
            </div>
          </div>
        )}

        {hasStrava && (
          <div className="space-y-8">
            <div className="card bg-base-100">
              <div className="card-body">
                <h3 className="text-2xl font-bold mb-4">Impact</h3>
                <div>
                  <div className="text-sm font-semibold text-base-content/60 mb-2">
                    TOTAL RAISED
                  </div>
                  <div className="text-5xl font-bold text-[#8B4ACC] mb-2">
                    ${totalRaised.toFixed(2)}
                  </div>
                  <div className="text-sm text-base-content/60">
                    Generated across your activities
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body">
                <h3 className="card-title">Recent Activities</h3>
                {activities.length === 0 ? (
                  <div className="py-8 text-center opacity-60">
                    <p className="mb-2">No activities yet.</p>
                    <p className="text-sm">
                      Activities from Strava will appear here automatically once
                      you complete them.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra">
                        <thead>
                          <tr>
                            <th className="whitespace-nowrap">Date</th>
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
                                ? (
                                    Number(activity.distanceMeters) / 1000
                                  ).toFixed(2)
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
                                ? `${Number(
                                    activity.totalElevationGain
                                  ).toFixed(0)}m`
                                : "—";
                            const elevationFt =
                              !isDeleted && activity.totalElevationGain
                                ? `${(
                                    Number(activity.totalElevationGain) *
                                    3.28084
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
                                className={
                                  isDeleted ? "opacity-50" : "hover:bg-base-200"
                                }
                              >
                                <td className="whitespace-nowrap">{date}</td>
                                <td className="max-w-[12rem] truncate">
                                  {isDeleted ? (
                                    <span className="italic opacity-60">
                                      [Deleted Activity]
                                    </span>
                                  ) : (
                                    <Link
                                      href={`/activities/${activity.id}`}
                                      className="link link-hover font-bold underline"
                                    >
                                      {activity.name || "Untitled"}
                                    </Link>
                                  )}
                                </td>
                                <td>{!isDeleted ? activity.type : "—"}</td>
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

                    <div className="flex justify-end border-t border-base-200 pt-4">
                      <Link href="/activities" className="btn btn-outline btn-sm">
                        All activities
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {process.env.NODE_ENV === "development" && (
          <div className="collapse collapse-arrow bg-base-100 mt-8">
            <input type="checkbox" />
            <div className="collapse-title font-medium">
              Debug Info (Dev Only)
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

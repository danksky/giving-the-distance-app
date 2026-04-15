import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import PaginationNav from "@/components/PaginationNav";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 25;

function getStringParam(
  value: string | string[] | undefined,
  fallback: string
): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function buildPageHref(page: number) {
  const search = new URLSearchParams({
    page: String(page),
  });

  return `/admin/activities?${search.toString()}`;
}

function buildDetailHref(activityId: string, page: number) {
  const search = new URLSearchParams({
    fromPage: String(page),
  });

  return `/admin/activities/${activityId}?${search.toString()}`;
}

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDistance(distanceMeters: unknown) {
  if (distanceMeters === null || distanceMeters === undefined) {
    return "—";
  }

  const meters = Number(distanceMeters);

  if (Number.isNaN(meters)) {
    return "—";
  }

  const kilometers = meters / 1000;
  const miles = meters / 1609.34;

  return `${kilometers.toFixed(2)} km / ${miles.toFixed(2)} mi`;
}

export default async function AdminActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  if (!isAdmin(session.user.email)) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content">
          <div className="card bg-base-100 max-w-md">
            <div className="card-body text-center">
              <h1 className="card-title text-2xl justify-center">
                Access Denied
              </h1>
              <p className="mb-2">
                You don&apos;t have permission to access this page.
              </p>
              <p className="text-sm opacity-70 mb-6">
                Admin access is required to view activities.
              </p>
              <Link href="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(
    1,
    Number.parseInt(getStringParam(params.page, "1"), 10) || 1
  );

  const historyModel = (
    db as typeof db & {
      stravaActivityHistory?: {
        findMany: (args: Record<string, unknown>) => Promise<
          Array<{
            activityId: string | null;
          }>
        >;
      };
    }
  ).stravaActivityHistory;

  const [
    totalActivities,
    activeActivities,
    deletedActivities,
    activitiesWithCommitments,
  ] = await Promise.all([
    db.activity.count(),
    db.activity.count({
      where: {
        deletedAt: null,
      },
    }),
    db.activity.count({
      where: {
        deletedAt: {
          not: null,
        },
      },
    }),
    db.activity.count({
      where: {
        charityCommitments: {
          some: {},
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalActivities / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const activities = await db.activity.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      charityCommitments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          amountCents: true,
          charity: {
            select: {
              name: true,
            },
          },
          campaign: {
            select: {
              sponsor: {
                select: {
                  businessName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [
      {
        startDateLocal: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const [historyActivityIds, pageHistoryEntries] = historyModel
    ? await Promise.all([
        historyModel.findMany({
          where: {
            activityId: {
              not: null,
            },
          },
          select: {
            activityId: true,
          },
          distinct: ["activityId"],
        }),
        historyModel.findMany({
          where: {
            activityId: {
              in: activities.map((activity) => activity.id),
            },
          },
          select: {
            activityId: true,
          },
        }),
      ])
    : [[], []];

  const pageHistoryCounts = new Map<string, number>();

  for (const entry of pageHistoryEntries) {
    if (!entry.activityId) {
      continue;
    }

    pageHistoryCounts.set(
      entry.activityId,
      (pageHistoryCounts.get(entry.activityId) ?? 0) + 1
    );
  }

  const activitiesWithHistory = historyModel
    ? historyActivityIds.length
    : 0;

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <div className="text-sm breadcrumbs">
            <ul>
              <li>
                <Link href="/admin" className="link link-hover">
                  Admin Home
                </Link>
              </li>
              <li className="font-semibold">Activity Table</li>
            </ul>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Activity Table</h1>
            <p className="mt-2 text-sm opacity-70">
              Master view of synced activities across the app, including
              sponsorship status and history coverage.
            </p>
          </div>
          <Link href="/admin/webhooks" className="btn btn-ghost btn-sm w-fit">
            Open webhook monitoring
          </Link>
        </div>

        <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
          <div className="stat">
            <div className="stat-title">Total Activities</div>
            <div className="stat-value">{totalActivities}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Active</div>
            <div className="stat-value text-success">{activeActivities}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Deleted</div>
            <div className="stat-value text-warning">{deletedActivities}</div>
          </div>
          <div className="stat">
            <div className="stat-title">With History</div>
            <div className="stat-value text-info">{activitiesWithHistory}</div>
            {!historyModel && (
              <div className="stat-desc text-warning">Unavailable</div>
            )}
          </div>
          <div className="stat">
            <div className="stat-title">With Commitment</div>
            <div className="stat-value text-secondary">
              {activitiesWithCommitments}
            </div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="card-title">All Activities</h2>
                <p className="text-sm opacity-70">
                  Sorted by most recent activity date. Open any activity to view
                  its admin detail and history timeline.
                </p>
              </div>
              <div className="text-sm opacity-70">
                Showing {activities.length} of {totalActivities}
              </div>
            </div>

            {activities.length === 0 ? (
              <div className="py-10 text-center opacity-60">
                No activities have been synced yet.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Athlete</th>
                        <th>Type</th>
                        <th>Distance</th>
                        <th>Status</th>
                        <th>Commitment</th>
                        <th>History</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity) => {
                        const commitment = activity.charityCommitments[0];
                        const commitmentAmount = commitment
                          ? `$${(commitment.amountCents / 100).toFixed(2)}`
                          : "—";
                        const sponsorName =
                          commitment?.campaign.sponsor.businessName ?? "—";
                        const charityName = commitment?.charity.name ?? "—";

                        return (
                          <tr
                            key={activity.id}
                            className={activity.deletedAt ? "opacity-60" : ""}
                          >
                            <td className="whitespace-nowrap">
                              {formatDate(activity.startDateLocal)}
                            </td>
                            <td className="min-w-[18rem]">
                              <div>
                                <Link
                                  href={buildDetailHref(activity.id, currentPage)}
                                  className="link link-hover font-semibold"
                                >
                                  {activity.name || "Untitled"}
                                </Link>
                                <div className="font-mono text-xs opacity-60">
                                  Strava {activity.stravaActivityId.toString()}
                                </div>
                              </div>
                            </td>
                            <td className="min-w-[14rem]">
                              <div>{activity.user.name || "Unnamed user"}</div>
                              <div className="text-xs opacity-60">
                                {activity.user.email}
                              </div>
                            </td>
                            <td>{activity.type}</td>
                            <td className="whitespace-nowrap">
                              {formatDistance(activity.distanceMeters)}
                            </td>
                            <td>
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`badge ${
                                    activity.deletedAt
                                      ? "badge-warning"
                                      : "badge-success"
                                  }`}
                                >
                                  {activity.deletedAt ? "Deleted" : "Active"}
                                </span>
                                <span
                                  className={`badge ${
                                    activity.isPrivate
                                      ? "badge-neutral"
                                      : "badge-outline"
                                  }`}
                                >
                                  {activity.isPrivate ? "Private" : "Public"}
                                </span>
                              </div>
                            </td>
                            <td className="min-w-[14rem]">
                              <div>{commitmentAmount}</div>
                              <div className="text-xs opacity-60">
                                {sponsorName}
                              </div>
                              <div className="text-xs opacity-60">
                                {charityName}
                              </div>
                            </td>
                            <td>
                              {(() => {
                                const historyCount =
                                  pageHistoryCounts.get(activity.id) ?? 0;

                                return (
                                  <>
                                    <div className="font-semibold">
                                      {historyCount}
                                    </div>
                                    <div className="text-xs opacity-60">
                                      {historyCount === 1
                                        ? "history entry"
                                        : "history entries"}
                                    </div>
                                  </>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <PaginationNav
                  currentPage={currentPage}
                  totalPages={totalPages}
                  getPageHref={buildPageHref}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

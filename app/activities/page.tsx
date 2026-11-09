import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import ActivitiesTypeFilter from "@/components/ActivitiesTypeFilter";
import PaginationNav from "@/components/PaginationNav";
import { db } from "@/lib/db";
import { getActivityPath } from "@/lib/activity-url";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

const PAGE_SIZE = 10;
const SORT_FIELDS = ["date", "distance", "time"] as const;
const SORT_DIRECTIONS = ["asc", "desc"] as const;

type SortField = (typeof SORT_FIELDS)[number];
type SortDirection = (typeof SORT_DIRECTIONS)[number];

function getStringParam(
  value: string | string[] | undefined,
  fallback: string
): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function buildPageHref(params: {
  page: number;
  sort: SortField;
  dir: SortDirection;
  type: string;
}) {
  const search = new URLSearchParams({
    page: String(params.page),
    sort: params.sort,
    dir: params.dir,
  });

  if (params.type !== "all") {
    search.set("type", params.type);
  }

  return `/activities?${search.toString()}`;
}

function getNextSortDirection(
  currentSort: SortField,
  currentDirection: SortDirection,
  targetSort: SortField
): SortDirection {
  if (currentSort !== targetSort) {
    return "desc";
  }

  return currentDirection === "desc" ? "asc" : "desc";
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    dir?: string;
    type?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const page = Math.max(
    1,
    Number.parseInt(getStringParam(params.page, "1"), 10) || 1
  );
  const requestedSort = getStringParam(params.sort, "date");
  const requestedDir = getStringParam(params.dir, "desc");
  const requestedType = getStringParam(params.type, "all");

  const sortField: SortField = SORT_FIELDS.includes(requestedSort as SortField)
    ? (requestedSort as SortField)
    : "date";
  const sortDirection: SortDirection = SORT_DIRECTIONS.includes(
    requestedDir as SortDirection
  )
    ? (requestedDir as SortDirection)
    : "desc";

  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    include: {
      accounts: {
        where: { provider: "strava" },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const hasStrava = user.accounts.length > 0;

  const availableTypes = await db.activity.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
    },
    distinct: ["type"],
    select: {
      type: true,
    },
    orderBy: {
      type: "asc",
    },
  });

  const typeOptions = availableTypes.map(({ type }) => type);
  const typeFilter =
    requestedType === "all" || !typeOptions.includes(requestedType)
      ? "all"
      : requestedType;

  const where: Prisma.ActivityWhereInput = {
    userId: user.id,
    ...(typeFilter !== "all" ? { type: typeFilter } : {}),
  };

  const orderBy: Prisma.ActivityOrderByWithRelationInput =
    sortField === "distance"
      ? { distanceMeters: sortDirection }
      : sortField === "time"
        ? { movingTimeSeconds: sortDirection }
        : { startDate: sortDirection };

  const totalActivities = await db.activity.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalActivities / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const activities = await db.activity.findMany({
    where,
    include: {
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
    orderBy,
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Activities</h1>
          </div>
          <Link href="/dashboard" className="btn btn-outline btn-sm w-fit">
            ← Back to Dashboard
          </Link>
        </div>

        {!hasStrava && (
          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title">Strava connections are paused</h2>
              <p className="text-sm opacity-70">
                Giving the Distance is on pause, so new Strava connections are unavailable.
              </p>
              <div className="card-actions justify-start">
                <Link href="/settings/strava" className="btn btn-primary btn-sm">
                  Strava settings
                </Link>
              </div>
            </div>
          </div>
        )}

        {hasStrava && (
          <div className="space-y-6">
            <div className="card bg-base-100">
              <div className="card-body">
                <div className="text-sm uppercase tracking-[0.2em] opacity-60">
                  Total Activities
                </div>
                <div className="mt-2 text-4xl font-bold">{totalActivities}</div>
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body">
                <div className="mb-4 flex justify-end">
                  <ActivitiesTypeFilter
                    typeFilter={typeFilter}
                    typeOptions={typeOptions}
                    sortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>

                {activities.length === 0 ? (
                  <div className="py-8 text-center opacity-60">
                    <p className="mb-2">No activities found.</p>
                    <p className="text-sm">
                      Try a different filter or complete a new activity in
                      Strava.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra">
                        <thead>
                          <tr>
                            <th className="whitespace-nowrap">
                              <Link
                                href={buildPageHref({
                                  page: 1,
                                  sort: "date",
                                  dir: getNextSortDirection(
                                    sortField,
                                    sortDirection,
                                    "date"
                                  ),
                                  type: typeFilter,
                                })}
                                className="inline-flex items-center gap-1 font-semibold"
                              >
                                Date
                                <span className="text-xs opacity-70">
                                  {sortField === "date"
                                    ? sortDirection === "desc"
                                      ? "↓"
                                      : "↑"
                                    : "↕"}
                                </span>
                              </Link>
                            </th>
                            <th>Activity</th>
                            <th>Commitment</th>
                            <th>Type</th>
                            <th>Sponsor</th>
                            <th>Charity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activities.map((activity) => {
                            const isDeleted = !!activity.deletedAt;
                            const commitment =
                              activity.charityCommitments?.[0];
                            const commitmentAmount = commitment
                              ? `$${(commitment.amountCents / 100).toFixed(2)}`
                              : "—";
                            const sponsorName =
                              commitment?.campaign.sponsor.businessName ?? "—";
                            const charityName = commitment?.charity.name ?? "—";
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
                                <td className="max-w-[16rem] truncate">
                                  {isDeleted ? (
                                    <span className="italic opacity-60">
                                      [Deleted Activity]
                                    </span>
                                  ) : (
                                    <Link
                                      href={getActivityPath(activity)}
                                      className="link link-hover font-bold underline"
                                    >
                                      {activity.name || "Untitled"}
                                    </Link>
                                  )}
                                </td>
                                <td>{commitmentAmount}</td>
                                <td>{!isDeleted ? activity.type : "—"}</td>
                                <td>{sponsorName}</td>
                                <td>{charityName}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <PaginationNav
                      currentPage={currentPage}
                      totalPages={totalPages}
                      getPageHref={(nextPage) =>
                        buildPageHref({
                          page: nextPage,
                          sort: sortField,
                          dir: sortDirection,
                          type: typeFilter,
                        })
                      }
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

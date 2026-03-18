import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

const PAGE_SIZE = 20;
const SORT_FIELDS = ["date", "distance", "time"] as const;
const SORT_DIRECTIONS = ["asc", "desc"] as const;

type SortField = (typeof SORT_FIELDS)[number];
type SortDirection = (typeof SORT_DIRECTIONS)[number];

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
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const activities = await db.activity.findMany({
    where,
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
            <p className="mt-2 text-sm opacity-70">
              Browse your activity history with sorting, filtering, and
              pagination.
            </p>
          </div>
          <Link href="/dashboard" className="btn btn-ghost btn-sm w-fit">
            Back to dashboard
          </Link>
        </div>

        {!hasStrava && (
          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title">Connect Strava to See Activities</h2>
              <p className="text-sm opacity-70">
                Once your Strava account is connected, your activities will
                appear here automatically.
              </p>
              <div className="card-actions justify-start">
                <Link href="/settings/strava" className="btn btn-primary btn-sm">
                  Connect Strava
                </Link>
              </div>
            </div>
          </div>
        )}

        {hasStrava && (
          <div className="space-y-6">
            <div className="card bg-base-100">
              <div className="card-body gap-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] opacity-60">
                      Total Activities
                    </div>
                    <div className="mt-2 text-4xl font-bold">{totalActivities}</div>
                  </div>

                  <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="form-control w-full sm:w-56">
                      <div className="label pb-2">
                        <span className="label-text">Type</span>
                      </div>
                      <select
                        name="type"
                        defaultValue={typeFilter}
                        className="select select-bordered"
                      >
                        <option value="all">All types</option>
                        {typeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <input type="hidden" name="sort" value={sortField} />
                    <input type="hidden" name="dir" value={sortDirection} />
                    <input type="hidden" name="page" value="1" />
                    <button type="submit" className="btn btn-outline btn-sm">
                      Filter
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body">
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
                            <th>Type</th>
                            <th>
                              <Link
                                href={buildPageHref({
                                  page: 1,
                                  sort: "distance",
                                  dir: getNextSortDirection(
                                    sortField,
                                    sortDirection,
                                    "distance"
                                  ),
                                  type: typeFilter,
                                })}
                                className="inline-flex items-center gap-1 font-semibold"
                              >
                                Distance
                                <span className="text-xs opacity-70">
                                  {sortField === "distance"
                                    ? sortDirection === "desc"
                                      ? "↓"
                                      : "↑"
                                    : "↕"}
                                </span>
                              </Link>
                            </th>
                            <th>
                              <Link
                                href={buildPageHref({
                                  page: 1,
                                  sort: "time",
                                  dir: getNextSortDirection(
                                    sortField,
                                    sortDirection,
                                    "time"
                                  ),
                                  type: typeFilter,
                                })}
                                className="inline-flex items-center gap-1 font-semibold"
                              >
                                Time
                                <span className="text-xs opacity-70">
                                  {sortField === "time"
                                    ? sortDirection === "desc"
                                      ? "↓"
                                      : "↑"
                                    : "↕"}
                                </span>
                              </Link>
                            </th>
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
                                <td className="max-w-[16rem] truncate">
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

                    <div className="mt-6 flex flex-col gap-3 border-t border-base-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm opacity-70">
                        Page {currentPage} of {totalPages}
                      </div>
                      {totalPages > 1 && (
                        <div className="join">
                          {hasPreviousPage ? (
                            <Link
                              href={buildPageHref({
                                page: currentPage - 1,
                                sort: sortField,
                                dir: sortDirection,
                                type: typeFilter,
                              })}
                              className="join-item btn btn-sm"
                            >
                              Previous
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="join-item btn btn-sm"
                              disabled
                            >
                              Previous
                            </button>
                          )}

                          {hasNextPage ? (
                            <Link
                              href={buildPageHref({
                                page: currentPage + 1,
                                sort: sortField,
                                dir: sortDirection,
                                type: typeFilter,
                              })}
                              className="join-item btn btn-sm"
                            >
                              Next
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="join-item btn btn-sm"
                              disabled
                            >
                              Next
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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

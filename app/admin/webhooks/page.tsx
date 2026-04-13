import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  getSkippedDescriptionUpdateReason,
  isSkippedDescriptionUpdateMessage,
} from "@/lib/strava-description-updates";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Fragment } from "react";

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

  return `/admin/webhooks?${search.toString()}`;
}

function buildActivityHref(activityId: string, page: number) {
  const search = new URLSearchParams({
    fromPage: "1",
    fromWebhookPage: String(page),
  });

  return `/admin/activities/${activityId}?${search.toString()}`;
}

export default async function WebhooksPage({
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
                Admin access is required to view webhook events.
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

  const [
    totalEvents,
    processedEvents,
    failedEvents,
    activityEvents,
    athleteEvents,
    descriptionUpdatedEvents,
  ] = await Promise.all([
    db.stravaWebhookEvent.count(),
    db.stravaWebhookEvent.count({
      where: {
        processed: true,
      },
    }),
    db.stravaWebhookEvent.count({
      where: {
        processingError: {
          not: null,
        },
      },
    }),
    db.stravaWebhookEvent.count({
      where: {
        objectType: "activity",
      },
    }),
    db.stravaWebhookEvent.count({
      where: {
        objectType: "athlete",
      },
    }),
    db.stravaWebhookEvent.count({
      where: {
        descriptionUpdated: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalEvents / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const events = await db.stravaWebhookEvent.findMany({
    orderBy: {
      eventTime: "desc",
    },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const currentPageAspectStats = {
    create: events.filter((event) => event.aspectType === "create").length,
    update: events.filter((event) => event.aspectType === "update").length,
    delete: events.filter((event) => event.aspectType === "delete").length,
    descriptionSkipped: events.filter((event) =>
      isSkippedDescriptionUpdateMessage(event.descriptionUpdateError)
    ).length,
    descriptionFailed: events.filter(
      (event) =>
        !!event.descriptionUpdateError &&
        !isSkippedDescriptionUpdateMessage(event.descriptionUpdateError)
    ).length,
  };

  const activityObjectIds = Array.from(
    new Set(
      events
        .filter((event) => event.objectType === "activity")
        .map((event) => event.objectId.toString())
    )
  );

  const relatedActivities =
    activityObjectIds.length > 0
      ? await db.activity.findMany({
          where: {
            stravaActivityId: {
              in: activityObjectIds.map((value) => BigInt(value)),
            },
          },
          select: {
            id: true,
            stravaActivityId: true,
            name: true,
            deletedAt: true,
          },
        })
      : [];

  const activityIdByStravaId = new Map(
    relatedActivities.map((activity) => [
      activity.stravaActivityId.toString(),
      activity,
    ])
  );

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
              <li className="font-semibold">Webhook Events</li>
            </ul>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Webhook Events</h1>
            <p className="mt-2 text-sm opacity-70">
              Focused view of Strava webhook delivery and processing. Use the
              activity table for full activity history and admin drill-in.
            </p>
          </div>
          <Link href="/admin/activities" className="btn btn-ghost btn-sm w-fit">
            Open activity table
          </Link>
        </div>

        <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
          <div className="stat">
            <div className="stat-title">Total Webhook Events</div>
            <div className="stat-value">{totalEvents}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Processed</div>
            <div className="stat-value text-success">{processedEvents}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Failed</div>
            <div className="stat-value text-error">{failedEvents}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Description Updated</div>
            <div className="stat-value text-info">
              {descriptionUpdatedEvents}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Activity vs Athlete</div>
            <div className="stat-value text-secondary">{activityEvents}</div>
            <div className="stat-desc">{athleteEvents} athlete events</div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body">
            <h2 className="card-title">Current Page Breakdown</h2>
            <p className="text-sm opacity-70">
              Quick read on the {events.length} webhook rows shown below.
            </p>
            <div className="stats stats-vertical md:stats-horizontal shadow mt-4">
              <div className="stat">
                <div className="stat-title">Creates</div>
                <div className="stat-value text-2xl">
                  {currentPageAspectStats.create}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Updates</div>
                <div className="stat-value text-2xl">
                  {currentPageAspectStats.update}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Deletes</div>
                <div className="stat-value text-2xl">
                  {currentPageAspectStats.delete}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Desc. Skipped</div>
                <div className="stat-value text-2xl text-warning">
                  {currentPageAspectStats.descriptionSkipped}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Desc. Failed</div>
                <div className="stat-value text-2xl text-error">
                  {currentPageAspectStats.descriptionFailed}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 mt-8">
          <div className="card-body">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="card-title">Recent Webhook Events</h2>
                <p className="text-sm opacity-70">
                  Paginated Strava webhook rows with direct links into matching
                  admin activity records when available.
                </p>
              </div>
              <div className="text-sm opacity-70">
                Showing {events.length} of {totalEvents}
              </div>
            </div>

            {events.length === 0 ? (
              <div className="py-10 text-center opacity-60">
                No webhook events yet. Create an activity on Strava to see them
                appear here.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Aspect</th>
                        <th>Object</th>
                        <th>Owner ID</th>
                        <th>Processing</th>
                        <th>Description Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => {
                        const skippedReason = getSkippedDescriptionUpdateReason(
                          event.descriptionUpdateError
                        );
                        const relatedActivity = activityIdByStravaId.get(
                          event.objectId.toString()
                        );

                        return (
                          <Fragment key={event.id}>
                            <tr>
                              <td className="whitespace-nowrap text-sm">
                                {new Date(event.eventTime).toLocaleString()}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    event.objectType === "activity"
                                      ? "badge-info"
                                      : "badge-secondary"
                                  }`}
                                >
                                  {event.objectType}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    event.aspectType === "create"
                                      ? "badge-success"
                                      : event.aspectType === "delete"
                                        ? "badge-error"
                                        : "badge-warning"
                                  }`}
                                >
                                  {event.aspectType}
                                </span>
                              </td>
                              <td className="min-w-[16rem]">
                                <div className="font-mono text-sm opacity-70">
                                  {event.objectId.toString()}
                                </div>
                                {event.objectType === "activity" &&
                                  (relatedActivity ? (
                                    <div className="mt-1">
                                      <Link
                                        href={buildActivityHref(
                                          relatedActivity.id,
                                          currentPage
                                        )}
                                        className="link link-hover text-xs"
                                      >
                                        Open admin activity
                                      </Link>
                                      {relatedActivity.name && (
                                        <div className="text-xs opacity-60">
                                          {relatedActivity.name}
                                          {relatedActivity.deletedAt
                                            ? " (deleted)"
                                            : ""}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-xs opacity-50">
                                      No internal activity record linked yet
                                    </div>
                                  ))}
                              </td>
                              <td className="font-mono text-sm opacity-70">
                                {event.ownerId.toString()}
                              </td>
                              <td>
                                {event.processingError ? (
                                  <span
                                    className="badge badge-error cursor-help"
                                    title={event.processingError}
                                  >
                                    Error
                                  </span>
                                ) : event.processed ? (
                                  <span className="badge badge-success">
                                    Processed
                                  </span>
                                ) : (
                                  <span className="badge badge-ghost">Pending</span>
                                )}
                              </td>
                              <td>
                                {event.objectType === "activity" ? (
                                  skippedReason ? (
                                    <div className="flex items-start gap-2">
                                      <span
                                        className="badge badge-warning cursor-help"
                                        title={skippedReason}
                                      >
                                        Skipped
                                      </span>
                                      <span className="text-xs opacity-60 line-clamp-2">
                                        {skippedReason}
                                      </span>
                                    </div>
                                  ) : event.descriptionUpdateError ? (
                                    <div className="flex items-start gap-2">
                                      <span
                                        className="badge badge-error cursor-help"
                                        title={event.descriptionUpdateError}
                                      >
                                        Failed
                                      </span>
                                      <span className="text-xs opacity-60 line-clamp-2">
                                        {event.descriptionUpdateError.substring(
                                          0,
                                          100
                                        )}
                                        {event.descriptionUpdateError.length >
                                          100 && "..."}
                                      </span>
                                    </div>
                                  ) : event.descriptionUpdated ? (
                                    <span className="badge badge-info">
                                      Updated
                                    </span>
                                  ) : (
                                    <span className="badge badge-ghost">N/A</span>
                                  )
                                ) : (
                                  <span className="text-xs opacity-40">N/A</span>
                                )}
                              </td>
                            </tr>
                            {event.processingError && (
                              <tr className="bg-error/10">
                                <td colSpan={7} className="py-2">
                                  <div className="text-sm">
                                    <span className="font-semibold text-error">
                                      Error:{" "}
                                    </span>
                                    <span className="text-error opacity-90">
                                      {event.processingError}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
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
                          href={buildPageHref(currentPage - 1)}
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
                          href={buildPageHref(currentPage + 1)}
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
      </main>
    </div>
  );
}

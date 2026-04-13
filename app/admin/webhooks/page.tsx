import { db } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/auth-helpers";
import {
  getSkippedDescriptionUpdateReason,
  isSkippedDescriptionUpdateMessage,
} from "@/lib/strava-description-updates";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Fragment } from "react";

// Force dynamic rendering - don't cache this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WebhooksPage() {
  // Check authentication
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  // Check admin access
  if (!isAdmin(session.user.email)) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content">
          <div className="card bg-base-100  max-w-md">
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

  const events = await db.stravaWebhookEvent.findMany({
    orderBy: {
      eventTime: "desc",
    },
    take: 100, // Last 100 events
  });

  const historyEntries = await db.stravaActivityHistory.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  const stats = {
    total: events.length,
    processed: events.filter((e) => e.processed).length,
    failed: events.filter((e) => e.processingError).length,
    descriptionUpdated: events.filter((e) => e.descriptionUpdated).length,
    descriptionSkipped: events.filter((e) =>
      isSkippedDescriptionUpdateMessage(e.descriptionUpdateError)
    ).length,
    descriptionFailed: events.filter(
      (e) =>
        !!e.descriptionUpdateError &&
        !isSkippedDescriptionUpdateMessage(e.descriptionUpdateError)
    ).length,
    byType: {
      activity: events.filter((e) => e.objectType === "activity").length,
      athlete: events.filter((e) => e.objectType === "athlete").length,
    },
    byAspect: {
      create: events.filter((e) => e.aspectType === "create").length,
      update: events.filter((e) => e.aspectType === "update").length,
      delete: events.filter((e) => e.aspectType === "delete").length,
    },
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <Navbar />

      {/* Breadcrumb */}
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
        {/* Stats Cards */}
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
          <div className="stat">
            <div className="stat-title">Total Events</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Processed</div>
            <div className="stat-value text-success">{stats.processed}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Failed</div>
            <div className="stat-value text-error">{stats.failed}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Desc. Updated</div>
            <div className="stat-value text-info">
              {stats.descriptionUpdated}
            </div>
            {stats.descriptionSkipped > 0 && (
              <div className="stat-desc text-warning">
                {stats.descriptionSkipped} skipped
              </div>
            )}
            {stats.descriptionFailed > 0 && (
              <div className="stat-desc text-error">
                {stats.descriptionFailed} failed
              </div>
            )}
          </div>
          <div className="stat">
            <div className="stat-title">Activity Events</div>
            <div className="stat-value text-secondary">
              {stats.byType.activity}
            </div>
          </div>
        </div>

        {/* Event Type Breakdown */}
        <div className="card bg-base-100  mb-8">
          <div className="card-body">
            <h2 className="card-title">Event Breakdown</h2>
            <div className="stats stats-vertical lg:stats-horizontal shadow">
              <div className="stat">
                <div className="stat-title">Creates</div>
                <div className="stat-value text-2xl">
                  {stats.byAspect.create}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Updates</div>
                <div className="stat-value text-2xl">
                  {stats.byAspect.update}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Deletes</div>
                <div className="stat-value text-2xl">
                  {stats.byAspect.delete}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="card bg-base-100 ">
          <div className="card-body">
            <h2 className="card-title">Recent Events</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Aspect</th>
                    <th>Object ID</th>
                    <th>Owner ID</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    const skippedReason = getSkippedDescriptionUpdateReason(
                      event.descriptionUpdateError
                    );

                    return (
                      <Fragment key={event.id}>
                        <tr>
                          <td className="text-sm">
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
                          <td className="font-mono text-sm opacity-70">
                            {event.objectId.toString()}
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
                            {event.objectType === "activity" &&
                            event.aspectType === "create" ? (
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
                                    {event.descriptionUpdateError.length > 100 &&
                                      "..."}
                                  </span>
                                </div>
                              ) : event.descriptionUpdated ? (
                                <span className="badge badge-info">Updated</span>
                              ) : (
                                <span className="badge badge-ghost">Pending</span>
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
          </div>
        </div>

        <div className="card bg-base-100 mt-8">
          <div className="card-body">
            <h2 className="card-title">Activity History</h2>
            <p className="text-sm opacity-70">
              Timeline of webhook snapshots and app-driven description changes.
            </p>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Source</th>
                    <th>Event</th>
                    <th>Activity</th>
                    <th>Visibility</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {historyEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="text-sm">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            entry.source === "app"
                              ? "badge-secondary"
                              : "badge-info"
                          }`}
                        >
                          {entry.source}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{entry.eventType}</td>
                      <td>
                        <div className="font-mono text-sm opacity-70">
                          {entry.stravaActivityId.toString()}
                        </div>
                        {entry.name && (
                          <div className="text-xs opacity-70">{entry.name}</div>
                        )}
                      </td>
                      <td className="text-xs">
                        {entry.visibility ?? "n/a"}
                        {entry.isPrivate === null
                          ? ""
                          : entry.isPrivate
                          ? " / private"
                          : " / public"}
                      </td>
                      <td>
                        <div className="flex items-start gap-2">
                          <span
                            className={`badge ${
                              entry.descriptionPresent
                                ? "badge-success"
                                : entry.descriptionPresent === false
                                ? "badge-ghost"
                                : "badge-warning"
                            }`}
                          >
                            {entry.descriptionPresent === null
                              ? "No Snapshot"
                              : entry.descriptionPresent
                              ? "Present"
                              : "Empty"}
                          </span>
                          {entry.descriptionHasGtdMarker && (
                            <span className="badge badge-info">#GTD</span>
                          )}
                          <div
                            className="max-w-md text-xs opacity-70 line-clamp-2"
                            title={entry.descriptionText ?? undefined}
                          >
                            {entry.descriptionText ||
                              (entry.descriptionPresent === false
                                ? "Description is empty"
                                : "No description snapshot captured")}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historyEntries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center opacity-60">
                        No activity history recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {events.length === 0 && (
          <div className="text-center py-12 opacity-60">
            No webhook events yet. Create an activity on Strava to see events
            appear here!
          </div>
        )}
      </main>
    </div>
  );
}

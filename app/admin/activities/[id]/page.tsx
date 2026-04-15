import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getStringParam(
  value: string | string[] | undefined,
  fallback: string
): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

function formatDuration(seconds: number | null) {
  if (!seconds) {
    return "—";
  }

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

function formatCurrency(amountCents: number | null | undefined) {
  if (amountCents === null || amountCents === undefined) {
    return "—";
  }

  return `$${(amountCents / 100).toFixed(2)}`;
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default async function AdminActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromPage?: string }>;
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
                Admin access is required to view activity details.
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

  const [{ id }, pageParams] = await Promise.all([params, searchParams]);
  const fromPage = Math.max(
    1,
    Number.parseInt(getStringParam(pageParams.fromPage, "1"), 10) || 1
  );

  const activity = await db.activity.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
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
          createdAt: true,
          charity: {
            select: {
              id: true,
              name: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
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
  });

  if (!activity) {
    notFound();
  }

  const historyModel = (
    db as typeof db & {
      stravaActivityHistory?: {
        findMany: (args: Record<string, unknown>) => Promise<
          Array<{
            id: string;
            createdAt: Date;
            webhookEventId: string | null;
            source: string;
            eventType: string;
            aspectType: string | null;
            name: string | null;
            type: string | null;
            isPrivate: boolean | null;
            visibility: string | null;
            descriptionText: string | null;
            descriptionPresent: boolean | null;
            descriptionHasGtdMarker: boolean | null;
            descriptionLength: number | null;
            updates: unknown;
            metadata: unknown;
          }>
        >;
      };
    }
  ).stravaActivityHistory;

  const [historyEntries, relatedWebhookEvents] = await Promise.all([
    historyModel
      ? historyModel.findMany({
          where: {
            activityId: activity.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
        })
      : [],
    db.stravaWebhookEvent.findMany({
      where: {
        objectType: "activity",
        objectId: activity.stravaActivityId,
      },
      orderBy: {
        eventTime: "desc",
      },
      take: 25,
    }),
  ]);

  const sponsorMatchModel = db as typeof db & {
    sponsorMatch?: {
      findMany: (args: Record<string, unknown>) => Promise<
        Array<{
          matchedAt: Date;
          campaignId: string | null;
          decrementCents: number;
          notes: string | null;
        }>
      >;
    };
  };

  const latestSponsorMatchRecord = sponsorMatchModel.sponsorMatch
    ? (
        await sponsorMatchModel.sponsorMatch.findMany({
          where: {
            activityId: activity.id,
          },
          orderBy: {
            matchedAt: "desc",
          },
          take: 1,
          select: {
            matchedAt: true,
            campaignId: true,
            decrementCents: true,
            notes: true,
          },
        })
      )[0] ?? null
    : null;

  const latestSponsorMatchCampaign = latestSponsorMatchRecord?.campaignId
    ? await db.campaign.findUnique({
        where: {
          id: latestSponsorMatchRecord.campaignId,
        },
        select: {
          name: true,
          sponsor: {
            select: {
              businessName: true,
            },
          },
        },
      })
    : null;

  const latestCommitment = activity.charityCommitments[0];
  const backHref = `/admin/activities?page=${fromPage}`;

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
              <li>
                <Link href={backHref} className="link link-hover">
                  Activity Table
                </Link>
              </li>
              <li className="font-semibold">{activity.name || "Untitled"}</li>
            </ul>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {activity.name || "Untitled Activity"}
            </h1>
            <p className="mt-2 text-sm opacity-70">
              Activity admin detail, history timeline, and related webhook
              events.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={backHref} className="btn btn-ghost btn-sm">
              Back to table
            </Link>
            {!activity.deletedAt && (
              <Link
                href={`/activities/${activity.id}`}
                className="btn btn-outline btn-sm"
              >
                Open public page
              </Link>
            )}
          </div>
        </div>

        <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
          <div className="stat">
            <div className="stat-title">Activity Status</div>
            <div className="stat-value text-2xl">
              {activity.deletedAt ? "Deleted" : "Active"}
            </div>
            {activity.deletedAt && (
              <div className="stat-desc">
                Deleted {formatDateTime(activity.deletedAt)}
              </div>
            )}
          </div>
          <div className="stat">
            <div className="stat-title">Visibility</div>
            <div className="stat-value text-2xl">
              {activity.isPrivate ? "Private" : "Public"}
            </div>
            <div className="stat-desc">
              Profile {activity.isPublicProfile ? "public" : "anonymized"}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">History Entries</div>
            <div className="stat-value text-2xl">{historyEntries.length}</div>
            {!historyModel && (
              <div className="stat-desc text-warning">Unavailable</div>
            )}
          </div>
          <div className="stat">
            <div className="stat-title">Webhook Events</div>
            <div className="stat-value text-2xl">
              {relatedWebhookEvents.length}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Commitment</div>
            <div className="stat-value text-2xl">
              {formatCurrency(latestCommitment?.amountCents)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="card bg-base-100 xl:col-span-2">
            <div className="card-body">
              <h2 className="card-title">Activity Summary</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                    Athlete
                  </div>
                  <div className="mt-1 font-semibold">
                    {activity.user.name || "Unnamed user"}
                  </div>
                  <div className="text-sm opacity-70">{activity.user.email}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                    Type
                  </div>
                  <div className="mt-1 font-semibold">{activity.type}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                    Distance
                  </div>
                  <div className="mt-1 font-semibold">
                    {formatDistance(activity.distanceMeters)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                    Moving Time
                  </div>
                  <div className="mt-1 font-semibold">
                    {formatDuration(activity.movingTimeSeconds)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                    Started
                  </div>
                  <div className="mt-1 font-semibold">
                    {formatDateTime(activity.startDateLocal)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                    Timezone
                  </div>
                  <div className="mt-1 font-semibold">
                    {activity.timezone || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                    Internal ID
                  </div>
                  <div className="mt-1 font-mono text-sm">{activity.id}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                    Strava ID
                  </div>
                  <div className="mt-1 font-mono text-sm">
                    {activity.stravaActivityId.toString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                    Shortcode
                  </div>
                  <div className="mt-1 font-semibold">
                    {activity.shortcode || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                    GPX
                  </div>
                  <div className="mt-1">
                    {activity.gpxBlobUrl ? (
                      <a
                        href={activity.gpxBlobUrl}
                        className="link link-hover"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open GPX file
                      </a>
                    ) : (
                      <span className="opacity-70">Not available</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-base-100">
              <div className="card-body">
                <h2 className="card-title">Latest Commitment</h2>
                {latestCommitment ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="opacity-60">Amount:</span>{" "}
                      <span className="font-semibold">
                        {formatCurrency(latestCommitment.amountCents)}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Sponsor:</span>{" "}
                      <span className="font-semibold">
                        {latestCommitment.campaign.sponsor.businessName}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Campaign:</span>{" "}
                      <span className="font-semibold">
                        {latestCommitment.campaign.name}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Charity:</span>{" "}
                      <span className="font-semibold">
                        {latestCommitment.charity.name}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Recorded:</span>{" "}
                      <span className="font-semibold">
                        {formatDateTime(latestCommitment.createdAt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm opacity-70">
                    No charity commitment has been recorded for this activity.
                  </p>
                )}
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body">
                <h2 className="card-title">Latest Sponsor Match</h2>
                {latestSponsorMatchRecord ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="opacity-60">Matched At:</span>{" "}
                      <span className="font-semibold">
                        {formatDateTime(latestSponsorMatchRecord.matchedAt)}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Campaign:</span>{" "}
                      <span className="font-semibold">
                        {latestSponsorMatchCampaign?.name || "No linked campaign"}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Sponsor:</span>{" "}
                      <span className="font-semibold">
                        {latestSponsorMatchCampaign?.sponsor.businessName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Decrement:</span>{" "}
                      <span className="font-semibold">
                        {formatCurrency(latestSponsorMatchRecord.decrementCents)}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-60">Notes:</span>{" "}
                      <span className="font-semibold">
                        {latestSponsorMatchRecord.notes || "—"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm opacity-70">
                    No sponsor match record has been stored for this activity.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 mt-8">
          <div className="card-body">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="card-title">Activity History</h2>
                <p className="text-sm opacity-70">
                  Snapshot and app-write timeline for this activity.
                </p>
              </div>
            </div>

            {!historyModel && (
              <div className="alert alert-warning text-sm">
                Activity history is not available in this runtime yet.
                Regenerate Prisma Client and restart the app server.
              </div>
            )}

            {historyEntries.length === 0 ? (
              <div className="py-8 text-center opacity-60">
                No history has been recorded for this activity yet.
              </div>
            ) : (
              <div className="space-y-4">
                {historyEntries.map((entry) => {
                  const updatesJson = formatJson(entry.updates);
                  const metadataJson = formatJson(entry.metadata);

                  return (
                    <div key={entry.id} className="rounded-lg border border-base-300 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`badge ${
                                entry.source === "app"
                                  ? "badge-secondary"
                                  : "badge-info"
                              }`}
                            >
                              {entry.source}
                            </span>
                            <span className="badge badge-outline">
                              {entry.eventType}
                            </span>
                            {entry.aspectType && (
                              <span className="badge badge-ghost">
                                {entry.aspectType}
                              </span>
                            )}
                            {entry.descriptionHasGtdMarker && (
                              <span className="badge badge-info">#GTD</span>
                            )}
                          </div>
                          <div className="mt-3 text-sm opacity-70">
                            {formatDateTime(entry.createdAt)}
                          </div>
                        </div>
                        <div className="text-sm opacity-70">
                          {entry.webhookEventId ? (
                            <span className="font-mono">
                              Webhook {entry.webhookEventId}
                            </span>
                          ) : (
                            <span>App event</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                            Activity
                          </div>
                          <div className="mt-1 text-sm font-semibold">
                            {entry.name || activity.name || "Untitled"}
                          </div>
                          <div className="text-xs opacity-60">
                            {entry.type || activity.type}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                            Visibility
                          </div>
                          <div className="mt-1 text-sm font-semibold">
                            {entry.visibility || "n/a"}
                          </div>
                          <div className="text-xs opacity-60">
                            {entry.isPrivate === null
                              ? "privacy unknown"
                              : entry.isPrivate
                                ? "private"
                                : "public"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                            Description
                          </div>
                          <div className="mt-1 text-sm font-semibold">
                            {entry.descriptionPresent === null
                              ? "No snapshot"
                              : entry.descriptionPresent
                                ? "Present"
                                : "Empty"}
                          </div>
                          <div className="text-xs opacity-60">
                            {entry.descriptionLength ?? 0} chars
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                            Raw Entry ID
                          </div>
                          <div className="mt-1 font-mono text-xs">
                            {entry.id}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                          Description Snapshot
                        </div>
                        <div className="mt-2 rounded-lg bg-base-200 p-3 text-sm whitespace-pre-wrap break-words">
                          {entry.descriptionText ||
                            (entry.descriptionPresent === false
                              ? "Description was empty"
                              : "No description snapshot captured")}
                        </div>
                      </div>

                      {(updatesJson || metadataJson) && (
                        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                          {updatesJson && (
                            <div>
                              <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                                Updates
                              </div>
                              <pre className="mt-2 overflow-x-auto rounded-lg bg-base-200 p-3 text-xs">
                                {updatesJson}
                              </pre>
                            </div>
                          )}
                          {metadataJson && (
                            <div>
                              <div className="text-xs uppercase tracking-[0.2em] opacity-60">
                                Metadata
                              </div>
                              <pre className="mt-2 overflow-x-auto rounded-lg bg-base-200 p-3 text-xs">
                                {metadataJson}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 mt-8">
          <div className="card-body">
            <h2 className="card-title">Related Webhook Events</h2>
            <p className="text-sm opacity-70">
              Recent `stravaWebhookEvent` rows for this Strava activity ID.
            </p>

            {relatedWebhookEvents.length === 0 ? (
              <div className="py-8 text-center opacity-60">
                No webhook events found for this activity.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Aspect</th>
                      <th>Status</th>
                      <th>Description Update</th>
                      <th>Owner ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedWebhookEvents.map((event) => (
                      <tr key={event.id}>
                        <td className="whitespace-nowrap">
                          {formatDateTime(event.eventTime)}
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
                        <td>
                          {event.processingError ? (
                            <span
                              className="badge badge-error"
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
                          {event.descriptionUpdated ? (
                            <span className="badge badge-info">Updated</span>
                          ) : event.descriptionUpdateError ? (
                            <span
                              className="badge badge-warning"
                              title={event.descriptionUpdateError}
                            >
                              Skipped/Failed
                            </span>
                          ) : (
                            <span className="badge badge-ghost">N/A</span>
                          )}
                        </td>
                        <td className="font-mono text-sm">
                          {event.ownerId.toString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

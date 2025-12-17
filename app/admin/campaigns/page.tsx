import { db } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SponsorMatchResult } from "@prisma/client";

// Force dynamic rendering - don't cache this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CampaignsPage() {
  // Check authentication
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
  }

  // Check admin access
  if (!isAdmin(session.user.email)) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content">
          <div className="card bg-base-100  max-w-md">
            <div className="card-body text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="card-title text-2xl justify-center">
                Access Denied
              </h1>
              <p className="mb-2">
                You don&apos;t have permission to access this page.
              </p>
              <p className="text-sm opacity-70 mb-6">
                Admin access is required to view campaigns.
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

  // Fetch campaigns with related data
  const campaigns = await db.campaign.findMany({
    include: {
      sponsor: true,
      topUps: {
        orderBy: { createdAt: "desc" },
      },
      sponsorMatches: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      charityCommitments: true,
      _count: {
        select: {
          sponsorMatches: true,
          charityCommitments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch recent sponsor matches across all campaigns
  const recentMatches = await db.sponsorMatch.findMany({
    include: {
      campaign: {
        include: {
          sponsor: true,
        },
      },
      activity: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  // Calculate overall stats
  const totalBudgetRemaining = campaigns.reduce(
    (sum, c) => sum + c.budgetRemainingCents,
    0
  );
  const totalBudgetAllocated = campaigns.reduce(
    (sum, c) => sum + c.topUps.reduce((s, t) => s + t.amountCents, 0),
    0
  );
  const totalBudgetSpent = totalBudgetAllocated - totalBudgetRemaining;
  const totalActivitiesMatched = recentMatches.filter(
    (m) => m.result === SponsorMatchResult.MATCHED
  ).length;
  const totalCommitments = campaigns.reduce(
    (sum, c) => sum + c._count.charityCommitments,
    0
  );

  // Calculate sponsor match results breakdown
  const matchStats = {
    matched: recentMatches.filter(
      (m) => m.result === SponsorMatchResult.MATCHED
    ).length,
    noBudget: recentMatches.filter(
      (m) => m.result === SponsorMatchResult.SKIPPED_NO_BUDGET
    ).length,
    noCampaign: recentMatches.filter(
      (m) => m.result === SponsorMatchResult.SKIPPED_NO_ACTIVE_CAMPAIGN
    ).length,
    alreadySponsored: recentMatches.filter(
      (m) => m.result === SponsorMatchResult.SKIPPED_ALREADY_SPONSORED
    ).length,
    updateFailed: recentMatches.filter(
      (m) => m.result === SponsorMatchResult.SKIPPED_UPDATE_FAILED
    ).length,
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100 ">
        <div className="flex-1 max-w-7xl mx-auto px-4 w-full">
          <h1 className="text-2xl font-bold">💰 Campaign Management</h1>
        </div>
        <div className="flex-none gap-2 px-4">
          <span className="text-sm opacity-70">
            Admin: {session.user.email}
          </span>
          <Link href="/admin/webhooks" className="btn btn-ghost btn-sm">
            Webhooks
          </Link>
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            Dashboard
          </Link>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Overall Stats */}
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
          <div className="stat">
            <div className="stat-figure text-primary text-3xl">💵</div>
            <div className="stat-title">Total Budget Allocated</div>
            <div className="stat-value text-primary">
              ${(totalBudgetAllocated / 100).toFixed(2)}
            </div>
          </div>
          <div className="stat">
            <div className="stat-figure text-success text-3xl">💰</div>
            <div className="stat-title">Remaining Budget</div>
            <div className="stat-value text-success">
              ${(totalBudgetRemaining / 100).toFixed(2)}
            </div>
          </div>
          <div className="stat">
            <div className="stat-figure text-info text-3xl">📊</div>
            <div className="stat-title">Budget Spent</div>
            <div className="stat-value text-info">
              ${(totalBudgetSpent / 100).toFixed(2)}
            </div>
            <div className="stat-desc">
              {totalBudgetAllocated > 0
                ? ((totalBudgetSpent / totalBudgetAllocated) * 100).toFixed(1)
                : 0}
              % utilized
            </div>
          </div>
          <div className="stat">
            <div className="stat-figure text-secondary text-3xl">✅</div>
            <div className="stat-title">Activities Matched</div>
            <div className="stat-value text-secondary">{totalCommitments}</div>
          </div>
        </div>

        {/* Sponsor Match Results Breakdown */}
        <div className="card bg-base-100  mb-8">
          <div className="card-body">
            <h2 className="card-title">
              <span className="text-2xl mr-2">📈</span>
              Sponsor Match Results (Last 20)
            </h2>
            <div className="stats stats-vertical lg:stats-horizontal shadow">
              <div className="stat">
                <div className="stat-title">✅ Matched</div>
                <div className="stat-value text-success text-2xl">
                  {matchStats.matched}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">💸 No Budget</div>
                <div className="stat-value text-warning text-2xl">
                  {matchStats.noBudget}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">🚫 No Campaign</div>
                <div className="stat-value text-error text-2xl">
                  {matchStats.noCampaign}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">🔁 Already Sponsored</div>
                <div className="stat-value text-info text-2xl">
                  {matchStats.alreadySponsored}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">⚠️ Update Failed</div>
                <div className="stat-value text-error text-2xl">
                  {matchStats.updateFailed}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-6 mb-8">
          <h2 className="text-3xl font-bold">
            <span className="mr-2">🎯</span>
            Active Campaigns
          </h2>
          {campaigns.map((campaign) => {
            const totalTopUps = campaign.topUps.reduce(
              (sum, t) => sum + t.amountCents,
              0
            );
            const spent = totalTopUps - campaign.budgetRemainingCents;
            const percentUsed =
              totalTopUps > 0 ? (spent / totalTopUps) * 100 : 0;

            return (
              <div key={campaign.id} className="card bg-base-100 ">
                <div className="card-body">
                  {/* Campaign Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="card-title text-2xl">
                        {campaign.sponsor.businessName}
                      </h3>
                      <p className="text-sm opacity-70">{campaign.name}</p>
                      {campaign.sponsor.website && (
                        <a
                          href={campaign.sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm link link-primary"
                        >
                          {campaign.sponsor.website}
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className={`badge ${
                          campaign.isActive ? "badge-success" : "badge-error"
                        } badge-lg`}
                      >
                        {campaign.isActive ? "✅ Active" : "❌ Inactive"}
                      </div>
                    </div>
                  </div>

                  {/* Budget Stats */}
                  <div className="stats stats-vertical sm:stats-horizontal shadow mt-4">
                    <div className="stat">
                      <div className="stat-title">Budget Remaining</div>
                      <div className="stat-value text-success text-2xl">
                        ${(campaign.budgetRemainingCents / 100).toFixed(2)}
                      </div>
                      <div className="stat-desc">
                        {Math.floor(campaign.budgetRemainingCents / 10)}{" "}
                        activities left
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Total Allocated</div>
                      <div className="stat-value text-primary text-2xl">
                        ${(totalTopUps / 100).toFixed(2)}
                      </div>
                      <div className="stat-desc">
                        ${(spent / 100).toFixed(2)} spent
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Activities Matched</div>
                      <div className="stat-value text-secondary text-2xl">
                        {campaign._count.charityCommitments}
                      </div>
                    </div>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Budget Usage</span>
                      <span className="font-semibold">
                        {percentUsed.toFixed(1)}%
                      </span>
                    </div>
                    <progress
                      className={`progress ${
                        percentUsed > 90
                          ? "progress-error"
                          : percentUsed > 70
                          ? "progress-warning"
                          : "progress-success"
                      } w-full`}
                      value={percentUsed}
                      max="100"
                    ></progress>
                  </div>

                  {/* Top-ups History */}
                  {campaign.topUps.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">💰 Budget Top-ups</h4>
                      <div className="overflow-x-auto">
                        <table className="table table-xs">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {campaign.topUps.map((topUp) => (
                              <tr key={topUp.id}>
                                <td className="text-xs">
                                  {new Date(
                                    topUp.createdAt
                                  ).toLocaleDateString()}
                                </td>
                                <td className="text-success font-semibold">
                                  +${(topUp.amountCents / 100).toFixed(2)}
                                </td>
                                <td className="text-xs opacity-70">
                                  {topUp.notes || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Recent Sponsor Matches for this campaign */}
                  {campaign.sponsorMatches.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">
                        📊 Recent Sponsor Matches
                      </h4>
                      <div className="space-y-2">
                        {campaign.sponsorMatches.map((match) => (
                          <div
                            key={match.id}
                            className="flex items-center justify-between bg-base-200 p-2 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`badge badge-sm ${
                                  match.result === SponsorMatchResult.MATCHED
                                    ? "badge-success"
                                    : match.result ===
                                      SponsorMatchResult.SKIPPED_NO_BUDGET
                                    ? "badge-warning"
                                    : "badge-error"
                                }`}
                              >
                                {match.result}
                              </span>
                              <span className="text-xs opacity-70">
                                Activity {match.stravaActivityId.toString()}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs opacity-70">
                                {new Date(match.createdAt).toLocaleString()}
                              </div>
                              {match.decrementCents > 0 && (
                                <div className="text-xs text-success">
                                  -${(match.decrementCents / 100).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Sponsor Matches */}
        <div className="card bg-base-100 ">
          <div className="card-body">
            <h2 className="card-title text-2xl">
              <span className="mr-2">📋</span>
              Recent Sponsor Matches
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Campaign</th>
                    <th>Activity</th>
                    <th>Athlete</th>
                    <th>Result</th>
                    <th>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMatches.map((match) => (
                    <tr key={match.id}>
                      <td className="text-xs">
                        {new Date(match.createdAt).toLocaleString()}
                      </td>
                      <td>
                        {match.campaign ? (
                          <div>
                            <div className="font-semibold text-sm">
                              {match.campaign.sponsor.businessName}
                            </div>
                            <div className="text-xs opacity-60">
                              {match.campaign.name}
                            </div>
                          </div>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                      <td>
                        {match.activity ? (
                          <Link
                            href={`/activities/${match.activity.id}`}
                            className="link link-primary text-xs font-mono"
                          >
                            {match.stravaActivityId.toString().substring(0, 10)}
                            ...
                          </Link>
                        ) : (
                          <span className="text-xs font-mono opacity-40">
                            {match.stravaActivityId.toString().substring(0, 10)}
                            ...
                          </span>
                        )}
                      </td>
                      <td className="text-xs">
                        {match.activity?.user?.name || "Unknown"}
                      </td>
                      <td>
                        <span
                          className={`badge badge-sm ${
                            match.result === SponsorMatchResult.MATCHED
                              ? "badge-success"
                              : match.result ===
                                SponsorMatchResult.SKIPPED_NO_BUDGET
                              ? "badge-warning"
                              : match.result ===
                                SponsorMatchResult.SKIPPED_ALREADY_SPONSORED
                              ? "badge-info"
                              : "badge-error"
                          }`}
                        >
                          {match.result}
                        </span>
                      </td>
                      <td>
                        {match.decrementCents > 0 ? (
                          <span className="text-success font-semibold text-sm">
                            ${(match.decrementCents / 100).toFixed(2)}
                          </span>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                      <td className="text-xs opacity-70 max-w-xs truncate">
                        {match.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12 opacity-60">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-xl mb-2">No campaigns yet</p>
            <p className="text-sm">
              Run the seed script to create default campaigns
            </p>
            <code className="text-xs bg-base-200 px-3 py-1 rounded mt-2 inline-block">
              npm run db:seed
            </code>
          </div>
        )}
      </main>
    </div>
  );
}

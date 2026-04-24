import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getActivityPath } from "@/lib/activity-url";
import Navbar from "@/components/Navbar";
import RaisedOverTimeChart from "@/components/RaisedOverTimeChart";

function getLastFourMonths() {
  const months: { key: string; label: string; shortLabel: string; date: Date }[] = [];
  const now = new Date();

  for (let offset = 3; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      shortLabel: date.toLocaleDateString("en-US", {
        month: "short",
      }),
      date,
    });
  }

  return months;
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
        where: {
          deletedAt: null,
        },
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
        orderBy: {
          startDate: "desc",
        },
        take: 5,
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
  const monthlyCommitments = user
    ? await db.charityCommitment.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
          },
        },
        select: {
          amountCents: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      })
    : [];
  const lastFourMonths = getLastFourMonths();
  const monthlyRaisedMap = new Map<string, number>(
    lastFourMonths.map((month) => [month.key, 0])
  );

  monthlyCommitments.forEach((commitment) => {
    const createdAt = new Date(commitment.createdAt);
    const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;

    if (monthlyRaisedMap.has(key)) {
      monthlyRaisedMap.set(
        key,
        (monthlyRaisedMap.get(key) ?? 0) + commitment.amountCents / 100
      );
    }
  });

  const monthlyRaised = lastFourMonths.map((month) => ({
    ...month,
    amount: monthlyRaisedMap.get(month.key) ?? 0,
  }));

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
                      Sync with Strava so each new activity can generate
                      donations for your cause.
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
            <div
              className="card"
              style={{
                backgroundColor: "#FFF8E1",
                borderColor: "#D9B44A",
              }}
            >
              <div className="card-body">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="mb-4 text-2xl font-bold text-[#6B4E16]">
                      Impact
                    </h3>
                    <div className="text-sm font-semibold text-[#8C6A1D]/80 mb-2">
                      TOTAL RAISED
                    </div>
                    <div className="mb-2 text-5xl font-bold text-[#8B4ACC]">
                      ${totalRaised.toFixed(2)}
                    </div>
                    <div className="text-sm text-[#8C6A1D]/80">
                      Generated across your activities
                    </div>
                  </div>
                  <div className="pt-1 text-[#B8860B]">
                    <i
                      aria-hidden="true"
                      className="bi bi-coin text-5xl sm:text-6xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body">
                <h3 className="card-title">Raised Over Time</h3>
                <p className="text-sm text-base-content/70">
                  Your last four months of fundraising activity.
                </p>

                <RaisedOverTimeChart data={monthlyRaised} />
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
                            <th>Commitment</th>
                            <th>Type</th>
                            <th>Sponsor</th>
                            <th>Charity</th>
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
                              <tr key={activity.id} className="hover:bg-base-200">
                                <td className="whitespace-nowrap">{date}</td>
                                <td className="max-w-[12rem] truncate">
                                  <Link
                                    href={getActivityPath(activity)}
                                    className="link link-hover font-bold underline"
                                  >
                                    {activity.name || "Untitled"}
                                  </Link>
                                </td>
                                <td>{commitmentAmount}</td>
                                <td>{activity.type}</td>
                                <td>{sponsorName}</td>
                                <td>{charityName}</td>
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

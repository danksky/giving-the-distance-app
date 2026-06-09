import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "No commitments yet";
  }

  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminCharityImpactPage() {
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
                Admin access is required to view charity impact.
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

  const [charities, commitmentTotals, athleteGroups] = await Promise.all([
    db.charity.findMany({
      select: {
        id: true,
        name: true,
        fullName: true,
        category: true,
        isDefault: true,
      },
    }),
    db.charityCommitment.groupBy({
      by: ["charityId"],
      _sum: {
        amountCents: true,
      },
      _count: {
        _all: true,
      },
      _max: {
        createdAt: true,
      },
    }),
    db.charityCommitment.groupBy({
      by: ["charityId", "userId"],
    }),
  ]);

  const totalsByCharity = new Map(
    commitmentTotals.map((total) => [total.charityId, total])
  );
  const athleteCounts = new Map<string, number>();

  for (const group of athleteGroups) {
    athleteCounts.set(
      group.charityId,
      (athleteCounts.get(group.charityId) ?? 0) + 1
    );
  }

  const impactRows = charities
    .map((charity) => {
      const totals = totalsByCharity.get(charity.id);

      return {
        ...charity,
        amountCents: totals?._sum.amountCents ?? 0,
        commitmentCount: totals?._count._all ?? 0,
        athleteCount: athleteCounts.get(charity.id) ?? 0,
        latestCommitmentAt: totals?._max.createdAt ?? null,
      };
    })
    .sort(
      (left, right) =>
        right.amountCents - left.amountCents ||
        right.commitmentCount - left.commitmentCount ||
        left.name.localeCompare(right.name)
    );

  const totalAmountCents = impactRows.reduce(
    (sum, charity) => sum + charity.amountCents,
    0
  );
  const totalCommitments = impactRows.reduce(
    (sum, charity) => sum + charity.commitmentCount,
    0
  );
  const charitiesWithImpact = impactRows.filter(
    (charity) => charity.commitmentCount > 0
  ).length;
  const uniqueAthletes = new Set(athleteGroups.map((group) => group.userId))
    .size;

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
              <li className="font-semibold">Charity Impact</li>
            </ul>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Charity Impact</h1>
            <p className="mt-2 max-w-2xl text-sm opacity-70">
              High-level view of the commitments generated for every charity,
              ranked by total accumulated impact.
            </p>
          </div>
          <Link href="/admin/charities" className="btn btn-outline w-fit">
            Manage charity catalog
          </Link>
        </div>

        <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
          <div className="stat">
            <div className="stat-title">Total Impact</div>
            <div className="stat-value text-success">
              {formatCurrency(totalAmountCents)}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Charities Supported</div>
            <div className="stat-value text-primary">
              {charitiesWithImpact}
            </div>
            <div className="stat-desc">of {charities.length} in the catalog</div>
          </div>
          <div className="stat">
            <div className="stat-title">Supported Activities</div>
            <div className="stat-value text-secondary">{totalCommitments}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Participating Athletes</div>
            <div className="stat-value text-info">{uniqueAthletes}</div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body">
            <div className="mb-4">
              <h2 className="card-title">Impact by Charity</h2>
              <p className="text-sm opacity-70">
                Each commitment represents a sponsored activity benefiting the
                athlete&apos;s selected charity.
              </p>
            </div>

            {impactRows.length === 0 ? (
              <div className="py-10 text-center opacity-60">
                No charities are currently in the catalog.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Charity</th>
                      <th>Accumulated Impact</th>
                      <th>Share</th>
                      <th>Activities</th>
                      <th>Athletes</th>
                      <th>Latest Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impactRows.map((charity, index) => {
                      const impactShare =
                        totalAmountCents > 0
                          ? (charity.amountCents / totalAmountCents) * 100
                          : 0;

                      return (
                        <tr key={charity.id}>
                          <td className="min-w-[18rem]">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 w-6 text-right text-sm font-semibold opacity-40">
                                {index + 1}
                              </span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/charities/${charity.id}`}
                                    className="link link-hover font-semibold"
                                  >
                                    {charity.name}
                                  </Link>
                                  {charity.isDefault && (
                                    <span className="badge badge-primary badge-sm">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs opacity-60">
                                  {charity.fullName}
                                </div>
                                <div className="mt-1 text-xs opacity-50">
                                  {charity.category}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap">
                            <span
                              className={`text-lg font-semibold ${
                                charity.amountCents > 0 ? "text-success" : ""
                              }`}
                            >
                              {formatCurrency(charity.amountCents)}
                            </span>
                          </td>
                          <td className="min-w-[10rem]">
                            <div className="flex items-center gap-3">
                              <progress
                                className="progress progress-primary w-24"
                                value={impactShare}
                                max="100"
                              />
                              <span className="whitespace-nowrap text-sm">
                                {impactShare.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="font-semibold">
                              {charity.commitmentCount}
                            </span>
                          </td>
                          <td>
                            <span className="font-semibold">
                              {charity.athleteCount}
                            </span>
                          </td>
                          <td className="whitespace-nowrap">
                            {formatDate(charity.latestCommitmentAt)}
                          </td>
                        </tr>
                      );
                    })}
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

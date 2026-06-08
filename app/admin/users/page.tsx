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

type AdminUsersPageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

function buildPageHref(page: number, query: string) {
  const search = new URLSearchParams();

  if (page > 1) {
    search.set("page", String(page));
  }

  if (query) {
    search.set("q", query);
  }

  const params = search.toString();
  return params ? `/admin/users?${params}` : "/admin/users";
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
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
                Admin access is required to view users.
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

  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() ?? "";
  const requestedPage = Number.parseInt(params?.page ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [
    totalUsers,
    matchingUsers,
    stravaUsers,
    usersWithActivities,
    totalCommitments,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where }),
    db.user.count({
      where: {
        stravaAthlete: {
          is: {
            stravaAuthorized: true,
          },
        },
      },
    }),
    db.user.count({
      where: {
        activities: {
          some: {},
        },
      },
    }),
    db.charityCommitment.aggregate({
      _sum: {
        amountCents: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(matchingUsers / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const users = await db.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { email: "asc" }],
    skip: offset,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      selectedCharity: {
        select: {
          name: true,
        },
      },
      stravaAthlete: {
        select: {
          username: true,
          stravaAuthorized: true,
        },
      },
      accounts: {
        select: {
          provider: true,
        },
      },
      _count: {
        select: {
          activities: true,
          charityCommitments: true,
        },
      },
    },
  });

  const commitmentTotals =
    users.length > 0
      ? await db.charityCommitment.groupBy({
          by: ["userId"],
          where: {
            userId: {
              in: users.map((user) => user.id),
            },
          },
          _sum: {
            amountCents: true,
          },
        })
      : [];
  const commitmentAmountByUser = new Map(
    commitmentTotals.map((total) => [
      total.userId,
      total._sum.amountCents ?? 0,
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
              <li className="font-semibold">User Directory</li>
            </ul>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Directory</h1>
          <p className="mt-2 text-sm opacity-70">
            Review account connections, participation, and generated charity
            impact across the app.
          </p>
        </div>

        <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
          <div className="stat">
            <div className="stat-title">Total Users</div>
            <div className="stat-value">{totalUsers}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Strava Connected</div>
            <div className="stat-value text-info">{stravaUsers}</div>
          </div>
          <div className="stat">
            <div className="stat-title">With Activities</div>
            <div className="stat-value text-secondary">
              {usersWithActivities}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Impact</div>
            <div className="stat-value text-success">
              {formatCurrency(totalCommitments._sum.amountCents ?? 0)}
            </div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="card-title">All Users</h2>
                <p className="text-sm opacity-70">
                  Sorted by newest account first.
                </p>
              </div>
              <form
                action="/admin/users"
                method="get"
                className="flex w-full max-w-md gap-2"
              >
                <label className="input input-bordered flex flex-1 items-center gap-2">
                  <span className="sr-only">Search users</span>
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search name or email"
                    className="grow"
                  />
                </label>
                <button type="submit" className="btn btn-primary">
                  Search
                </button>
                {query && (
                  <Link href="/admin/users" className="btn btn-ghost">
                    Clear
                  </Link>
                )}
              </form>
            </div>

            <div className="mb-4 text-sm opacity-70">
              {query
                ? `${matchingUsers} result${matchingUsers === 1 ? "" : "s"} for “${query}”`
                : `Showing ${users.length} of ${totalUsers} users`}
            </div>

            {users.length === 0 ? (
              <div className="py-10 text-center opacity-60">
                No users match this search.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Connections</th>
                        <th>Selected Charity</th>
                        <th>Activities</th>
                        <th>Impact</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const providers = Array.from(
                          new Set(user.accounts.map((account) => account.provider))
                        );
                        const impact = commitmentAmountByUser.get(user.id) ?? 0;

                        return (
                          <tr key={user.id}>
                            <td className="min-w-[16rem]">
                              <div className="flex items-center gap-3">
                                <div className="avatar placeholder">
                                  <div className="h-10 w-10 rounded-full bg-neutral text-neutral-content">
                                    {user.image ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={user.image}
                                        alt=""
                                        className="h-full w-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <span>
                                        {(user.name || user.email)
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold">
                                      {user.name || "Unnamed user"}
                                    </span>
                                    {isAdmin(user.email) && (
                                      <span className="badge badge-primary badge-sm">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <a
                                    href={`mailto:${user.email}`}
                                    className="link link-hover text-xs opacity-60"
                                  >
                                    {user.email}
                                  </a>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="flex min-w-[9rem] flex-wrap gap-2">
                                {providers.map((provider) => (
                                  <span
                                    key={provider}
                                    className="badge badge-outline capitalize"
                                  >
                                    {provider}
                                  </span>
                                ))}
                                {user.stravaAthlete && (
                                  <span
                                    className={`badge ${
                                      user.stravaAthlete.stravaAuthorized
                                        ? "badge-success"
                                        : "badge-warning"
                                    }`}
                                  >
                                    {user.stravaAthlete.stravaAuthorized
                                      ? "Strava active"
                                      : "Strava revoked"}
                                  </span>
                                )}
                                {providers.length === 0 &&
                                  !user.stravaAthlete && (
                                    <span className="opacity-50">None</span>
                                  )}
                              </div>
                              {user.stravaAthlete?.username && (
                                <div className="mt-1 text-xs opacity-60">
                                  @{user.stravaAthlete.username}
                                </div>
                              )}
                            </td>
                            <td className="min-w-[11rem]">
                              {user.selectedCharity?.name ?? (
                                <span className="opacity-50">Not selected</span>
                              )}
                            </td>
                            <td>
                              <div className="font-semibold">
                                {user._count.activities}
                              </div>
                            </td>
                            <td className="whitespace-nowrap">
                              <div className="font-semibold">
                                {formatCurrency(impact)}
                              </div>
                              <div className="text-xs opacity-60">
                                {user._count.charityCommitments} commitment
                                {user._count.charityCommitments === 1 ? "" : "s"}
                              </div>
                            </td>
                            <td className="whitespace-nowrap">
                              {formatDate(user.createdAt)}
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
                  getPageHref={(nextPage) =>
                    buildPageHref(nextPage, query)
                  }
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

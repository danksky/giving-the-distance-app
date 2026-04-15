import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CharityCatalogManager from "@/components/admin/CharityCatalogManager";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 10;

type AdminCharitiesPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

function getPageHref(page: number) {
  return page <= 1 ? "/admin/charities" : `/admin/charities?page=${page}`;
}

export default async function AdminCharitiesPage({
  searchParams,
}: AdminCharitiesPageProps) {
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
                Admin access is required to manage charities.
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

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedPage = Number(resolvedSearchParams?.page ?? "1");
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const totalCount = await db.charity.count();
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

  const charities = await db.charity.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    skip: offset,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      fullName: true,
      description: true,
      category: true,
      logoUrl: true,
      website: true,
      charityNavigatorScore: true,
      isDefault: true,
    },
  });

  const startIndex = totalCount === 0 ? 0 : offset + 1;
  const endIndex = offset + charities.length;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

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
              <li className="font-semibold">Charity Catalog</li>
            </ul>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <div className="space-y-3">
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-base-content/40">
              Admin
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Charity Catalog
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-base-content/70">
              Manage the live charity roster directly in the database. This is
              now the primary place to add or update charities in the app.
            </p>
            <div className="pt-2">
              <Link href="/admin/charities/new" className="btn btn-primary">
                Add Charity
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-info/20 bg-info/5 p-5 text-sm leading-relaxed text-info-content/80">
            <span className="block font-medium text-info-content">
              Database-first catalog
            </span>
            <span className="mt-2 block">
              Routine app reads already come from the database. The remaining
              legacy JSON import is now a one-time bootstrap tool only.
            </span>
          </div>
        </div>

        <CharityCatalogManager charities={charities} />

        <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-base-content/65">
            Showing {startIndex}-{endIndex} of {totalCount} charities
          </div>

          <div className="join self-start sm:self-auto">
            <Link
              href={getPageHref(safePage - 1)}
              className={`btn join-item btn-sm ${safePage <= 1 ? "btn-disabled pointer-events-none" : ""}`}
              aria-disabled={safePage <= 1}
            >
              Previous
            </Link>

            {pageNumbers.map((page) => (
              <Link
                key={page}
                href={getPageHref(page)}
                className={`btn join-item btn-sm ${page === safePage ? "btn-primary" : "btn-ghost"}`}
              >
                {page}
              </Link>
            ))}

            <Link
              href={getPageHref(safePage + 1)}
              className={`btn join-item btn-sm ${safePage >= totalPages ? "btn-disabled pointer-events-none" : ""}`}
              aria-disabled={safePage >= totalPages}
            >
              Next
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

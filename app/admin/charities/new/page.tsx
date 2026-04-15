import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  CharityCreateForm,
} from "@/components/admin/CharityCatalogManager";
import { isAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCharitiesNewPage() {
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

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto max-w-5xl px-4 py-3">
          <div className="text-sm breadcrumbs">
            <ul>
              <li>
                <Link href="/admin" className="link link-hover">
                  Admin Home
                </Link>
              </li>
              <li>
                <Link href="/admin/charities" className="link link-hover">
                  Charity Catalog
                </Link>
              </li>
              <li className="font-semibold">Add Charity</li>
            </ul>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="mb-8 space-y-3">
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-base-content/40">
            Admin
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Add Charity
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-base-content/70">
            Create a new charity in the live catalog without cluttering the
            main management view.
          </p>
        </div>

        <CharityCreateForm />
      </main>
    </div>
  );
}

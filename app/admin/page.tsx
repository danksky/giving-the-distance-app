import { auth } from "@/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default async function AdminPage() {
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
          <div className="card bg-base-100 max-w-md">
            <div className="card-body text-center">
              <h1 className="card-title text-2xl justify-center">
                Access Denied
              </h1>
              <p className="mb-2">
                You don&apos;t have permission to access this page.
              </p>
              <p className="text-sm opacity-70 mb-6">
                Admin access is required.
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
      {/* Header */}
      <Navbar />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campaigns Card */}
          <Link
            href="/admin/campaigns"
            className="card bg-base-100 hover:border-gray-300 transition-colors"
          >
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="badge badge-primary">Primary</div>
              </div>
              <h2 className="card-title text-2xl mt-4">Campaign Management</h2>
              <p className="opacity-70">
                View and manage sponsor campaigns, budgets, and placement logs
              </p>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary">View Campaigns →</button>
              </div>
            </div>
          </Link>

          {/* Webhooks Card */}
          <Link
            href="/admin/webhooks"
            className="card bg-base-100 hover:border-gray-300 transition-colors"
          >
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="badge badge-secondary">Monitoring</div>
              </div>
              <h2 className="card-title text-2xl mt-4">Webhook Events</h2>
              <p className="opacity-70">
                Monitor Strava webhook events and activity processing status
              </p>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-secondary">View Events →</button>
              </div>
            </div>
          </Link>

          {/* GPX Backfill Card */}
          <Link
            href="/admin/gpx"
            className="card bg-base-100 hover:border-gray-300 transition-colors"
          >
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="badge badge-warning">Maintenance</div>
              </div>
              <h2 className="card-title text-2xl mt-4">GPX Management</h2>
              <p className="opacity-70">
                View GPX statistics and backfill missing route files
              </p>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-warning">Manage GPX →</button>
              </div>
            </div>
          </Link>

          {/* Database Card */}
          <a
            href="http://localhost:5555"
            target="_blank"
            rel="noopener noreferrer"
            className="card bg-base-100 hover:border-gray-300 transition-colors"
          >
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="badge badge-info">External</div>
              </div>
              <h2 className="card-title text-2xl mt-4">Prisma Studio</h2>
              <p className="opacity-70">
                Direct database access and management interface
              </p>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-info">Open Studio ↗</button>
              </div>
            </div>
          </a>

          {/* System Info Card */}
          <div className="card bg-base-100">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="badge badge-success">Info</div>
              </div>
              <h2 className="card-title text-2xl mt-4">System Information</h2>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="opacity-70">Admin User:</span>
                  <span className="font-semibold">{session.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Commitment Amount:</span>
                  <span className="font-semibold">$0.10 per activity</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">System Status:</span>
                  <span className="badge badge-success">Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card bg-base-100  mt-8">
          <div className="card-body">
            <h2 className="card-title text-2xl">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Run Seed Script</div>
                <div className="stat-desc mt-2">
                  Add sponsors and campaigns to database
                </div>
                <code className="text-xs mt-2 block">npm run db:seed</code>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Run Tests</div>
                <div className="stat-desc mt-2">
                  Execute unit tests for sponsor matching
                </div>
                <code className="text-xs mt-2 block">npm test</code>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">View Logs</div>
                <div className="stat-desc mt-2">
                  Check application and webhook logs
                </div>
                <code className="text-xs mt-2 block">npm run dev</code>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div className="card bg-base-100  mt-8">
          <div className="card-body">
            <h2 className="card-title text-2xl">Documentation</h2>
            <div className="mt-4 text-sm text-base-content/80">
              Internal docs are stored in the repository under <code>docs/</code>
              and are not publicly served by the app.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

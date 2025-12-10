import { db } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WebhooksPage() {
  // Check authentication
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
  }

  // Check admin access
  if (!isAdmin(session.user.email)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Admin access is required to view webhook events.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>
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

  const stats = {
    total: events.length,
    processed: events.filter((e) => e.processed).length,
    failed: events.filter((e) => e.processingError).length,
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Strava Webhook Events</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Admin: {session.user.email}
            </span>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Events</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Processed</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.processed}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-3xl font-bold text-red-600">
              {stats.failed}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Activity Events</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.byType.activity}
            </div>
          </div>
        </div>

        {/* Event Type Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Event Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Creates</div>
              <div className="text-2xl font-bold">{stats.byAspect.create}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Updates</div>
              <div className="text-2xl font-bold">{stats.byAspect.update}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Deletes</div>
              <div className="text-2xl font-bold">{stats.byAspect.delete}</div>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">Recent Events</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aspect
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Object ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(event.eventTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded ${
                          event.objectType === "activity"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {event.objectType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded ${
                          event.aspectType === "create"
                            ? "bg-green-100 text-green-800"
                            : event.aspectType === "delete"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.aspectType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {event.objectId.toString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {event.ownerId.toString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {event.processingError ? (
                        <span
                          className="px-2 py-1 rounded bg-red-100 text-red-800"
                          title={event.processingError}
                        >
                          ❌ Error
                        </span>
                      ) : event.processed ? (
                        <span className="px-2 py-1 rounded bg-green-100 text-green-800">
                          ✅ Processed
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {events.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No webhook events yet. Create an activity on Strava to see events
            appear here!
          </div>
        )}
      </div>
    </div>
  );
}

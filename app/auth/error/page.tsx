import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  // Check if this is a Strava permission error
  const isPermissionError = error?.toLowerCase().includes("permission");
  const isAccessDenied = error?.toLowerCase().includes("accessdenied");
  const isStravaError = isPermissionError || isAccessDenied;

  // Parse specific missing permissions from error message
  let missingPermissions: string[] = [];
  if (error?.includes("Missing required permissions:")) {
    const match = error.match(/Missing required permissions: ([^.]+)/);
    if (match) {
      missingPermissions = match[1].split(",").map((s) => s.trim());
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isStravaError
                ? "Strava Permissions Required"
                : "Authentication Error"}
            </h1>
            <p className="text-gray-600">
              {isStravaError
                ? "We need your permission to access certain Strava data"
                : "Something went wrong while signing you in"}
            </p>
          </div>

          {isStravaError ? (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Missing Permissions
              </h3>

              {missingPermissions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-orange-800">
                    The following permissions are required for this app to
                    function:
                  </p>
                  <ul className="space-y-2">
                    {missingPermissions.map((permission) => (
                      <li
                        key={permission}
                        className="flex items-start gap-2 text-sm text-orange-900"
                      >
                        <span className="text-red-500 font-bold">✗</span>
                        <div>
                          <span className="font-medium">{permission}</span>
                          {permission === "activity:read_all" && (
                            <span className="block text-orange-700 text-xs mt-1">
                              Required to read your workout data for sponsorship
                              tracking
                            </span>
                          )}
                          {permission === "profile:read_all" && (
                            <span className="block text-orange-700 text-xs mt-1">
                              Required to display your athlete profile
                              information
                            </span>
                          )}
                          {permission === "activity:write" && (
                            <span className="block text-orange-700 text-xs mt-1">
                              Required to add donation messages to your
                              activities
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-orange-800">
                  You must authorize all requested permissions to use this app.
                </p>
              )}

              <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
                <p className="text-sm text-gray-700 font-medium mb-2">
                  💡 How to fix this:
                </p>
                <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
                  <li>Click &quot;Try Again&quot; below</li>
                  <li>
                    Make sure <strong>ALL checkboxes</strong> are checked on
                    Strava
                  </li>
                  <li>Click &quot;Authorize&quot; to connect your account</li>
                </ol>
              </div>
            </div>
          ) : (
            error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Error:</span>{" "}
                  {decodeURIComponent(error)}
                </p>
              </div>
            )
          )}

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
            >
              {isStravaError ? "Try Again" : "Back to Dashboard"}
            </Link>
            <Link
              href="/"
              className="block w-full text-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

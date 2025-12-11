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
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col max-w-2xl">
        <div className="card bg-base-100 shadow-xl w-full">
          <div className="card-body">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="card-title text-3xl justify-center mb-2">
                {isStravaError
                  ? "Strava Permissions Required"
                  : "Authentication Error"}
              </h1>
              <p>
                {isStravaError
                  ? "We need your permission to access certain Strava data"
                  : "Something went wrong while signing you in"}
              </p>
            </div>

            {isStravaError ? (
              <div className="alert alert-warning">
                <div className="flex-col items-start w-full">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <span className="text-xl">⚠️</span>
                    Missing Permissions
                  </h3>

                  {missingPermissions.length > 0 ? (
                    <div className="space-y-3 w-full">
                      <p className="text-sm">
                        The following permissions are required for this app to
                        function:
                      </p>
                      <ul className="space-y-2">
                        {missingPermissions.map((permission) => (
                          <li
                            key={permission}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-error font-bold">✗</span>
                            <div>
                              <span className="font-medium">{permission}</span>
                              {permission === "activity:read_all" && (
                                <span className="block text-xs mt-1 opacity-80">
                                  Required to read your workout data for
                                  sponsorship tracking
                                </span>
                              )}
                              {permission === "profile:read_all" && (
                                <span className="block text-xs mt-1 opacity-80">
                                  Required to display your athlete profile
                                  information
                                </span>
                              )}
                              {permission === "activity:write" && (
                                <span className="block text-xs mt-1 opacity-80">
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
                    <p className="text-sm">
                      You must authorize all requested permissions to use this
                      app.
                    </p>
                  )}

                  <div className="mt-4 p-4 bg-base-100 rounded-lg w-full">
                    <p className="text-sm font-medium mb-2">
                      💡 How to fix this:
                    </p>
                    <ol className="text-sm space-y-1 ml-4 list-decimal">
                      <li>Click &quot;Try Again&quot; below</li>
                      <li>
                        Make sure <strong>ALL checkboxes</strong> are checked on
                        Strava
                      </li>
                      <li>
                        Click &quot;Authorize&quot; to connect your account
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              error && (
                <div className="alert alert-error">
                  <div>
                    <span className="font-medium">Error:</span>{" "}
                    {decodeURIComponent(error)}
                  </div>
                </div>
              )
            )}

            <div className="card-actions justify-center mt-4 flex-col gap-3">
              <Link href="/dashboard" className="btn btn-primary w-full">
                {isStravaError ? "Try Again" : "Back to Dashboard"}
              </Link>
              <Link href="/" className="btn btn-ghost w-full">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

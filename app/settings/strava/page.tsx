import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import Navbar from "@/components/Navbar";

export default async function StravaSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const params = await searchParams;
  const errorMessage = params.error;
  const successMessage = params.success;

  // Get user with Strava connection
  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    include: {
      accounts: {
        where: { provider: "strava" },
      },
      stravaAthlete: true,
    },
  });

  const hasStrava = (user?.accounts.length ?? 0) > 0;
  const stravaAthlete = user?.stravaAthlete;

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/settings" className="btn btn-ghost btn-sm mb-2">
            ← Back to Settings
          </Link>
          <h1 className="text-3xl font-bold">Strava Connection</h1>
        </div>

        {/* Success Message */}
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

        {/* Error Message */}
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

        {/* Strava Connection Card */}
        {!hasStrava ? (
          <div className="card bg-base-100 mb-8">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-2xl">
                  Connect Your Strava Account
                </h2>
                <div className="w-16 h-16 relative flex-shrink-0">
                  <Image
                    src="/logos/services/strava.svg"
                    alt="Strava"
                    width={64}
                    height={64}
                  />
                </div>
              </div>
              <p className="mb-4">
                Link your Strava to start tracking your activities and receiving
                donations. We&apos;ll automatically add donation messages to
                your activities.
              </p>
              <div className="alert alert-info mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <div>
                  <div className="text-sm font-semibold mb-1">
                    Required Permissions:
                  </div>
                  <ul className="text-xs list-disc list-inside">
                    <li>Activity Read - View your activity data</li>
                    <li>Profile Read - Access your profile information</li>
                    <li>
                      Activity Write - Update activity descriptions with
                      donation info
                    </li>
                  </ul>
                </div>
              </div>
              <a href="/api/strava/connect" className="btn btn-primary btn-lg">
                Connect to Strava
              </a>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 mb-8">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-2xl">
                  Strava Account Connected
                </h2>
                <div className="w-16 h-16 relative flex-shrink-0">
                  <Image
                    src="/logos/services/strava.svg"
                    alt="Strava"
                    width={64}
                    height={64}
                  />
                </div>
              </div>

              {/* Connected Account Info */}
              <div className="bg-success/10 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-4">
                  {stravaAthlete?.profile && (
                    <div className="avatar">
                      <div className="w-20 h-20 rounded-full ring ring-success ring-offset-base-100 ring-offset-2">
                        <Image
                          src={stravaAthlete.profile}
                          alt="Strava Profile"
                          width={80}
                          height={80}
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xl font-bold">
                      {stravaAthlete?.firstname} {stravaAthlete?.lastname}
                    </div>
                    {stravaAthlete?.username && (
                      <div className="text-sm text-base-content/60">
                        @{stravaAthlete.username}
                      </div>
                    )}
                    {stravaAthlete?.city && stravaAthlete?.state && (
                      <div className="text-sm text-base-content/60">
                        {stravaAthlete.city}, {stravaAthlete.state}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="alert alert-success mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
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
                  <div className="font-semibold">All Set!</div>
                  <div className="text-sm">
                    Your activities will automatically be tracked and donation
                    messages will be added.
                  </div>
                </div>
              </div>

              {/* Disconnect Section */}
              <div className="divider"></div>
              <div>
                <h3 className="font-semibold mb-2">Disconnect Strava</h3>
                <p className="text-sm text-base-content/60 mb-4">
                  Disconnecting will stop tracking new activities. Your existing
                  activity history will be preserved.
                </p>
                <form action="/api/strava/disconnect" method="POST">
                  <button type="submit" className="btn btn-error btn-outline">
                    Disconnect Strava Account
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Information Card */}
        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="card-title">About Strava Integration</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-semibold mb-1">Automatic Syncing</div>
                <p className="text-base-content/60">
                  New activities are automatically imported from Strava when you
                  complete them.
                </p>
              </div>
              <div>
                <div className="font-semibold mb-1">Donation Messages</div>
                <p className="text-base-content/60">
                  We automatically add donation information to your activity
                  descriptions on Strava.
                </p>
              </div>
              <div>
                <div className="font-semibold mb-1">Privacy & Security</div>
                <p className="text-base-content/60">
                  Your Strava data is securely stored and only used to track
                  your charitable contributions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

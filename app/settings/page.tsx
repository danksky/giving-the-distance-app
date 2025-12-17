import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import CharityLogo from "@/components/CharityLogo";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  // Get user with Strava connection and selected charity
  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    include: {
      accounts: {
        where: { provider: "strava" },
      },
      stravaAthlete: true,
      selectedCharity: true,
    },
  });

  const hasStrava = (user?.accounts.length ?? 0) > 0;
  const stravaAthlete = user?.stravaAthlete;

  // Get current charity (user's selection or default)
  let currentCharity = user?.selectedCharity;
  if (!currentCharity) {
    currentCharity = await db.charity.findFirst({
      where: { isDefault: true },
    });
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">
            Giving the Distance
          </Link>
        </div>
        <div className="flex-none gap-2">
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            Dashboard
          </Link>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-circle">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg">
                  {session.user.name?.charAt(0) || "U"}
                </span>
              )}
            </button>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li className="menu-title">{session.user.email}</li>
              <li>
                <Link href="/api/auth/signout">Sign Out</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Settings Cards */}
        <div className="space-y-0">
          {/* Strava Settings */}
          <Link href="/settings/strava">
            <div className="card bg-base-100 hover:border-gray-300 transition-colors cursor-pointer">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 relative flex-shrink-0">
                      <Image
                        src="/logos/services/strava.svg"
                        alt="Strava"
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="card-title">Strava Connection</h2>
                      <p className="text-base-content/60">
                        {hasStrava
                          ? "Manage your Strava account connection"
                          : "Connect your Strava account to track activities"}
                      </p>
                      {hasStrava && stravaAthlete && (
                        <div className="flex items-center gap-2 mt-2">
                          {stravaAthlete.profile && (
                            <div className="avatar">
                              <div className="w-8 h-8 rounded-full">
                                <Image
                                  src={stravaAthlete.profile}
                                  alt="Strava Profile"
                                  width={32}
                                  height={32}
                                />
                              </div>
                            </div>
                          )}
                          <span className="text-sm font-semibold text-success">
                            Connected as {stravaAthlete.firstname}{" "}
                            {stravaAthlete.lastname}
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`badge badge-lg ${
                        hasStrava ? "badge-success" : "badge-warning"
                      }`}
                    >
                      {hasStrava ? "Connected" : "Not Connected"}
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6 opacity-50"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Divider */}
          <div className="py-6">
            <div className="border-t border-base-300"></div>
          </div>

          {/* Charity Settings */}
          <Link href="/settings/charity">
            <div className="card bg-base-100 hover:border-gray-300 transition-colors cursor-pointer">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <CharityLogo
                      name={currentCharity?.name || "Charity"}
                      logoUrl={currentCharity?.logoUrl}
                      size="md"
                    />
                    <div className="flex-1">
                      <h2 className="card-title">Charity Selection</h2>
                      <p className="text-base-content/60">
                        Choose which charity your activities will benefit
                      </p>
                      {currentCharity && (
                        <div className="flex items-center gap-2 mt-2">
                          <CharityLogo
                            name={currentCharity.name}
                            logoUrl={currentCharity.logoUrl}
                            size="sm"
                          />
                          <span className="text-sm font-semibold text-primary">
                            {currentCharity.name}
                            {currentCharity.isDefault &&
                              !user?.selectedCharityId &&
                              " (Default)"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="badge badge-lg badge-outline">Optional</div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6 opacity-50"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Account Information */}
        <div className="card bg-base-100 mt-8">
          <div className="card-body">
            <h3 className="card-title mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24">Email:</span>
                <span className="text-base-content/70">
                  {session.user.email}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24">Name:</span>
                <span className="text-base-content/70">
                  {session.user.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24">Google:</span>
                <span className="badge badge-success badge-sm">Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Link href="/dashboard" className="btn btn-ghost">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

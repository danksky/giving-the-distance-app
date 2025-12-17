import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import CharityLogo from "@/components/CharityLogo";
import Navbar from "@/components/Navbar";

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
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Settings Cards */}
        <div className="space-y-0">
          {/* Strava Settings */}
          <Link href="/settings/strava">
            <div className="card bg-base-100 hover:border-gray-300 transition-colors cursor-pointer">
              <div className="card-body">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 sm:w-12 sm:h-12 relative flex-shrink-0">
                      <Image
                        src="/logos/services/strava.svg"
                        alt="Strava"
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="card-title text-lg sm:text-xl">
                          Strava Connection
                        </h2>
                        <div
                          className={`badge badge-sm sm:badge-lg flex-shrink-0 ${
                            hasStrava ? "badge-success" : "badge-warning"
                          }`}
                        >
                          {hasStrava ? "Connected" : "Not Connected"}
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-base-content/60">
                        {hasStrava
                          ? "Manage your Strava account connection"
                          : "Connect your Strava account to track activities"}
                      </p>
                      {hasStrava && stravaAthlete && (
                        <div className="flex items-center gap-2 mt-2">
                          {stravaAthlete.profile && (
                            <div className="avatar">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full">
                                <Image
                                  src={stravaAthlete.profile}
                                  alt="Strava Profile"
                                  width={32}
                                  height={32}
                                />
                              </div>
                            </div>
                          )}
                          <span className="text-xs sm:text-sm font-semibold text-success">
                            Connected as {stravaAthlete.firstname}{" "}
                            {stravaAthlete.lastname}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 sm:w-6 sm:h-6 opacity-50 flex-shrink-0 mt-1"
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
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <CharityLogo
                      name={currentCharity?.name || "Charity"}
                      logoUrl={currentCharity?.logoUrl}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="card-title text-lg sm:text-xl">
                          Charity Selection
                        </h2>
                        <div className="badge badge-sm sm:badge-lg badge-outline flex-shrink-0">
                          Optional
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-base-content/60">
                        Choose which charity your activities will benefit
                      </p>
                      {currentCharity && (
                        <div className="flex items-center gap-2 mt-2">
                          <CharityLogo
                            name={currentCharity.name}
                            logoUrl={currentCharity.logoUrl}
                            size="sm"
                          />
                          <span className="text-xs sm:text-sm font-semibold text-primary">
                            {currentCharity.name}
                            {currentCharity.isDefault &&
                              !user?.selectedCharityId &&
                              " (Default)"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 sm:w-6 sm:h-6 opacity-50 flex-shrink-0 mt-1"
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
            <h3 className="card-title text-lg sm:text-xl mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="font-semibold text-sm sm:text-base sm:w-24">
                  Email:
                </span>
                <span className="text-sm sm:text-base text-base-content/70 break-all">
                  {session.user.email}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="font-semibold text-sm sm:text-base sm:w-24">
                  Name:
                </span>
                <span className="text-sm sm:text-base text-base-content/70">
                  {session.user.name}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="font-semibold text-sm sm:text-base sm:w-24">
                  Google:
                </span>
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

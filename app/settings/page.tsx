import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ensureUserHasSelectedCharity } from "@/lib/charity-helpers";
import CharityLogo from "@/components/CharityLogo";
import Navbar from "@/components/Navbar";
import { getUserPrivacyDefaultsByEmail } from "@/lib/user-privacy";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
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

  // Ensure the default charity is persisted for users missing a selection
  const currentCharity = user
    ? await ensureUserHasSelectedCharity(user.id)
    : null;
  const privacyDefaults = session.user.email
    ? await getUserPrivacyDefaultsByEmail(session.user.email)
    : {
        defaultActivityIsPublic: true,
        defaultActivityMapIsPublic: false,
      };
  const defaultActivityIsPublic = privacyDefaults.defaultActivityIsPublic;
  const defaultActivityMapIsPublic =
    privacyDefaults.defaultActivityMapIsPublic;

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link href="/dashboard" className="btn btn-outline btn-sm w-fit">
            ← Back to Dashboard
          </Link>
        </div>

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
                      charityId={currentCharity?.id}
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
                        <div className="badge badge-sm sm:badge-lg badge-success flex-shrink-0">
                          Active
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-base-content/60">
                        Choose which charity your activities will benefit
                      </p>
                      {currentCharity && (
                        <div className="flex items-center gap-2 mt-2">
                          <CharityLogo
                            charityId={currentCharity.id}
                            name={currentCharity.name}
                            logoUrl={currentCharity.logoUrl}
                            size="sm"
                          />
                          <span className="text-xs sm:text-sm font-semibold text-primary">
                            {currentCharity.name}
                            {currentCharity.isDefault && " (Default)"}
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

          {/* Privacy Settings */}
          <Link href="/settings/privacy">
            <div className="card bg-base-100 hover:border-gray-300 transition-colors cursor-pointer">
              <div className="card-body">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 0h10.5A2.25 2.25 0 0119.5 12.75v6A2.25 2.25 0 0117.25 21h-10.5A2.25 2.25 0 014.5 18.75v-6A2.25 2.25 0 016.75 10.5z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="card-title text-lg sm:text-xl">
                          Privacy
                        </h2>
                        <div className="badge badge-sm sm:badge-lg badge-primary flex-shrink-0">
                          {defaultActivityIsPublic ? "Public Default" : "Private Default"}
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-base-content/60">
                        Choose the default visibility for activity details and
                        route maps
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs sm:text-sm font-semibold">
                        <span className="text-primary">
                          Activity pages:{" "}
                          {defaultActivityIsPublic ? "Public" : "Private"}
                        </span>
                        <span className="text-base-content/40">•</span>
                        <span className="text-secondary">
                          Route maps:{" "}
                          {defaultActivityMapIsPublic ? "Shared" : "Owner only"}
                        </span>
                      </div>
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
      </main>
    </div>
  );
}

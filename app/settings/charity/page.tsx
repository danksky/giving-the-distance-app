import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import CharitySelector from "@/components/CharitySelector";
import CharityLogo from "@/components/CharityLogo";
import Navbar from "@/components/Navbar";

export default async function CharitySettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  // Get user with selected charity
  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    include: { selectedCharity: true },
  });

  // Get all charities from database
  const charities = await db.charity.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  // Current charity - use user's selection or default to UNICEF
  const currentCharity =
    user?.selectedCharity || charities.find((c) => c.isDefault) || charities[0];

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
          <h1 className="text-3xl font-bold">Charity Selection</h1>
        </div>

        {/* Info Alert */}
        <div className="alert alert-info mb-6">
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
            <div className="font-semibold">Select Your Charity</div>
            <div className="text-sm">
              Choose which charity your activities will support. UNICEF is the
              default selection.
            </div>
          </div>
        </div>

        {/* Current Charity Card */}
        <div className="card bg-base-100 mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-2xl">Your Selected Charity</h2>
              <div className="badge badge-success badge-lg">Active</div>
            </div>

            <div className="bg-gradient-to-br from-[#B56DFF]/10 to-[#E5D4FF]/30 rounded-lg p-4 sm:p-6 border border-[#B56DFF]/20">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <CharityLogo
                  name={currentCharity.name}
                  logoUrl={currentCharity.logoUrl}
                  size="xl"
                  className="mx-auto sm:mx-0"
                />
                <div className="flex-1 w-full">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#8B4ACC] mb-2">
                    {currentCharity.name}
                  </h3>
                  <div className="text-base sm:text-lg font-semibold mb-3">
                    {currentCharity.fullName}
                  </div>
                  <p className="text-sm sm:text-base text-base-content/70 mb-4">
                    {currentCharity.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={currentCharity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                    >
                      Visit Website
                    </Link>
                    {currentCharity.isDefault && (
                      <div className="badge badge-outline">Default Charity</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="card bg-base-100 mb-6">
          <div className="card-body">
            <h3 className="card-title">
              Your Impact with {currentCharity.name}
            </h3>
            <p className="text-sm text-base-content/60 mb-4">
              Every activity you complete generates donations that support{" "}
              {currentCharity.name}&apos;s mission.
            </p>
            <div className="stats stats-vertical lg:stats-horizontal">
              <div className="stat">
                <div className="stat-title">Total Donated</div>
                <div className="stat-value text-2xl text-[#8B4ACC]">$0.00</div>
                <div className="stat-desc">Coming soon</div>
              </div>
              <div className="stat">
                <div className="stat-title">Activities</div>
                <div className="stat-value text-2xl text-[#8B4ACC]">0</div>
                <div className="stat-desc">Contributing to charity</div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Charities */}
        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="card-title mb-4">Available Charities</h3>
            <p className="text-sm text-base-content/60 mb-6">
              Choose from our curated list of highly-rated charities. All
              organizations have been verified by Charity Navigator.
            </p>
            <CharitySelector
              charities={charities}
              currentCharityId={currentCharity.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

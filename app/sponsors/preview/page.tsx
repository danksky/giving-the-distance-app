import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import CharityLogo from "@/components/CharityLogo";
import SponsorContactForm from "@/components/SponsorContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsor Preview | Giving the Distance",
  description: "Preview your sponsor profile on Giving the Distance",
};

async function fetchPlacePhotos(
  placeId: string
): Promise<{ photos: string[] }> {
  try {
    // Construct the base URL properly
    let baseUrl = "http://localhost:3000";

    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }

    const url = `${baseUrl}/api/places/photos?placeId=${encodeURIComponent(
      placeId
    )}`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return { photos: [] };
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching place photos:", error);
    return { photos: [] };
  }
}

// Mock data for preview
const MOCK_CHARITIES = [
  {
    name: "ASPCA",
    logoUrl: "/logos/charities/aspca.jpeg",
  },
  {
    name: "UNICEF",
    logoUrl: "/logos/charities/unicef.png",
  },
];

const MOCK_ACTIVITIES = [
  {
    id: "preview-1",
    athleteName: "Sarah M.",
    activityType: "Run",
    distance: 8.5,
    distanceUnit: "km",
    donationAmount: 0.08,
    charity: "ASPCA",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: "preview-2",
    athleteName: "Michael K.",
    activityType: "Ride",
    distance: 24.3,
    distanceUnit: "km",
    donationAmount: 0.07,
    charity: "UNICEF",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: "preview-3",
    athleteName: "Jessica L.",
    activityType: "Run",
    distance: 5.2,
    distanceUnit: "km",
    donationAmount: 0.08,
    charity: "ASPCA",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
  {
    id: "preview-4",
    athleteName: "David R.",
    activityType: "Walk",
    distance: 3.1,
    distanceUnit: "km",
    donationAmount: 0.1,
    charity: "UNICEF",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  },
];

async function PreviewContent({
  searchParams,
}: {
  searchParams: { name?: string; location?: string; placeId?: string };
}) {
  const businessName = searchParams.name || "Your Business";
  const businessLocation = searchParams.location || "Brooklyn, New York";
  const placeId = searchParams.placeId;

  // Extract city and state from location
  const locationParts = businessLocation.split(",");
  const city = locationParts[locationParts.length - 2]?.trim() || "Brooklyn";
  const state = locationParts[locationParts.length - 1]?.trim() || "NY";

  // Fetch Google Photos if we have a placeId
  const placePhotos = placeId
    ? await fetchPlacePhotos(placeId)
    : { photos: [] };

  // Mock impact data
  const totalDonated = MOCK_ACTIVITIES.reduce(
    (sum, activity) => sum + activity.donationAmount,
    0
  );
  const activitiesSponsored = MOCK_ACTIVITIES.length;
  const athletesSupported = new Set(MOCK_ACTIVITIES.map((a) => a.athleteName))
    .size;

  // Create a simple Google Maps embed URL
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  }&q=${encodeURIComponent(businessLocation)}&zoom=15`;

  return (
    <div className="min-h-screen bg-[#fff]">
      {/* Header */}
      <Navbar />

      {/* Preview Banner */}
      <div className="bg-gradient-to-r from-[#B56DFF] to-[#004e89] text-white">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <div>
                <div className="font-bold">Preview Mode</div>
                <div className="text-sm opacity-90">
                  This is how your sponsor profile could look
                </div>
              </div>
            </div>
            <Link
              href="/sponsor-landing"
              className="btn btn-sm bg-white text-[#B56DFF] hover:bg-white/90 border-0"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Cover Image */}
        {placePhotos.photos.length > 0 ? (
          <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
            <Image
              src={placePhotos.photos[0]}
              alt={`${businessName} cover`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="relative w-full h-64 mb-6 bg-gradient-to-br from-[#B56DFF]/10 via-[#004e89]/10 to-[#B56DFF]/5 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-20 h-20 mx-auto text-[#B56DFF]/30 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-[#6b7280]">Your cover photo here</p>
            </div>
          </div>
        )}

        {/* Business Header */}
        <div className="mb-8">
          {/* Logo + Title Row */}
          <div className="flex items-start gap-6 mb-6">
            {/* Logo Placeholder */}
            <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#B56DFF]/20 to-[#004e89]/20 rounded-lg flex items-center justify-center">
              <span className="text-4xl font-bold text-[#B56DFF]">
                {businessName
                  .split(" ")
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>

            {/* Title + Badge + Address */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-2">{businessName}</h1>
              <div className="mb-2">
                <span className="badge badge-lg bg-[#B56DFF]/10 text-[#8B4ACC] border border-[#B56DFF]/20 font-semibold">
                  DONOR
                </span>
              </div>
              <p className="font-medium">📍 {businessLocation}</p>
            </div>
          </div>

          {/* Map + Photos Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Map */}
            <div className="w-full h-64 md:h-72 rounded overflow-hidden bg-base-200">
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapUrl}
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#f3f4f6]">
                  <p className="text-[#6b7280]">Map preview</p>
                </div>
              )}
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 grid-rows-3 gap-2 h-64 md:h-72">
              {/* Main photo (or placeholder) */}
              {placePhotos.photos.length > 1 ? (
                <div className="relative col-span-2 row-span-2 rounded-lg overflow-hidden">
                  <Image
                    src={placePhotos.photos[1]}
                    alt={`${businessName} interior`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative col-span-2 row-span-2 bg-gradient-to-br from-[#B56DFF]/5 to-[#004e89]/5 rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-[#B56DFF]/30 mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-xs text-[#6b7280]">Your team photo</p>
                  </div>
                </div>
              )}

              {/* Small photos (or placeholders) */}
              {placePhotos.photos.length > 2 ? (
                <div className="relative bg-gradient-to-br from-[#B56DFF]/5 to-[#004e89]/5 rounded-lg overflow-hidden">
                  <Image
                    src={placePhotos.photos[2]}
                    alt={`${businessName} photo`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative bg-gradient-to-br from-[#B56DFF]/5 to-[#004e89]/5 rounded-lg flex items-center justify-center">
                  <p className="text-xs text-[#6b7280] text-center px-2">
                    Photo
                  </p>
                </div>
              )}

              {placePhotos.photos.length > 3 ? (
                <div className="relative bg-gradient-to-br from-[#B56DFF]/5 to-[#004e89]/5 rounded-lg overflow-hidden">
                  <Image
                    src={placePhotos.photos[3]}
                    alt={`${businessName} photo`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative bg-gradient-to-br from-[#B56DFF]/5 to-[#004e89]/5 rounded-lg flex items-center justify-center">
                  <p className="text-xs text-[#6b7280] text-center px-2">
                    Photo
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Blurb */}
          <p className="text-lg mb-4 italic text-base-content/80">
            A beloved {city} establishment supporting local athletes and giving
            back to the community through charitable sponsorships.
          </p>

          {/* Links Placeholder */}
          <div className="flex gap-4">
            <button className="btn btn-outline btn-sm" disabled>
              Website
            </button>
            <button className="btn btn-outline btn-sm" disabled>
              Instagram
            </button>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="card bg-base-100 mb-6">
          <div className="card-body">
            <h2 className="text-2xl font-bold mb-4">Impact Summary</h2>
            <div className="bg-[#fff8e1] border border-[#ffd54f] rounded-lg p-4 mb-6">
              <p className="text-sm text-[#f57f17]">
                <strong>Preview Data:</strong> These are sample activities to
                show what your impact could look like.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Total Donated</div>
                <div className="stat-value text-2xl text-[#8B4ACC]">
                  $
                  {totalDonated.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Activities Supported</div>
                <div className="stat-value text-2xl text-[#8B4ACC]">
                  {activitiesSponsored}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Athletes Supported</div>
                <div className="stat-value text-2xl text-[#8B4ACC]">
                  {athletesSupported}
                </div>
              </div>
            </div>

            {/* Charities Supported */}
            <div>
              <h3 className="text-xl font-semibold mb-3">
                Charities Supported
              </h3>
              <div className="flex flex-wrap gap-4">
                {MOCK_CHARITIES.map((charity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-base-200 rounded-lg p-3"
                  >
                    <CharityLogo
                      name={charity.name}
                      logoUrl={charity.logoUrl}
                      size="md"
                    />
                    <span className="font-medium">{charity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Supported Activities */}
        <div className="card bg-base-100 mb-6">
          <div className="card-body">
            <h2 className="text-2xl font-bold mb-4">
              Recent Supported Activities
            </h2>
            <div className="space-y-4">
              {MOCK_ACTIVITIES.map((activity) => (
                <div
                  key={activity.id}
                  className="border-b border-base-300 pb-4 last:border-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {activity.athleteName}
                        </span>
                        <span className="text-base-content/60">
                          • {activity.activityType}
                        </span>
                      </div>
                      <div className="text-sm text-base-content/70">
                        <span>
                          {activity.distance.toFixed(2)} {activity.distanceUnit}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{activity.charity}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {new Date(activity.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-[#8B4ACC]">
                        ${activity.donationAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-base-content/60">
                        donated
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div
          id="contact"
          className="card bg-white border border-[#e5e7eb] scroll-mt-20"
        >
          <div className="card-body">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4">Like what you see?</h2>
              <p className="text-lg text-[#6b7280]">
                Leave your info and we&apos;ll walk you through it.
                <br />
                No obligation.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <SponsorContactForm />
            </div>

            {/* Footer Signal */}
            <p className="text-center text-sm text-[#6b7280] mt-8">
              Built in Brooklyn. Run by real people.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default async function SponsorPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    location?: string;
    placeId?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fff] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B56DFF] mx-auto mb-4"></div>
            <p className="text-[#6b7280]">Loading preview...</p>
          </div>
        </div>
      }
    >
      <PreviewContent searchParams={params} />
    </Suspense>
  );
}

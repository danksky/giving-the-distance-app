import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import LightboxImage from "@/components/LightboxImage";

interface SponsorProfile {
  id: string;
  businessName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  };
  map?: {
    embedUrl?: string;
  };
  blurb: string;
  links: {
    instagram: string;
    website: string;
  };
  images: {
    logo: string;
    cover: string;
    staff: string;
    products: string[];
  };
  impact: {
    totalDonated: number;
    activitiesSponsored: number;
    athletesSupported: number;
    charities: Array<{
      name: string;
      logo: string;
    }>;
  };
  recentActivities: Array<{
    id: string;
    athleteName: string;
    activityType: string;
    distance: number;
    distanceUnit: string;
    donationAmount: number;
    charity: string;
    date: string;
  }>;
}

function getActivityEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    Run: "🏃",
    Ride: "🚴",
    Walk: "🚶",
    Swim: "🏊",
    Hike: "🥾",
  };
  return emojiMap[type] || "🏃";
}

async function getSponsorProfile(slug: string): Promise<SponsorProfile | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "sponsors",
      slug,
      "profile.json"
    );
    const fileContents = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents);
  } catch {
    return null;
  }
}

function extractIframeSrc(maybeIframeOrUrl?: string) {
  if (!maybeIframeOrUrl) return null;
  const trimmed = maybeIframeOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  const match = trimmed.match(/src\s*=\s*"([^"]+)"/i);
  return match?.[1] ?? null;
}

export default async function SponsorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getSponsorProfile(slug);

  if (!profile) {
    notFound();
  }

  const embeddedSrc = extractIframeSrc(profile.map?.embedUrl);

  const mapUrl =
    embeddedSrc ??
    (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? `https://www.google.com/maps/embed/v1/place?key=${
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        }&q=${encodeURIComponent(profile.address.fullAddress)}&zoom=15`
      : `https://www.google.com/maps?q=${encodeURIComponent(
          profile.address.fullAddress
        )}&output=embed`);

  return (
    <div className="min-h-screen bg-[#fff]">
      {/* Header */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">
            Giving the Distance
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Cover Image */}
        {profile.images.cover && (
          <LightboxImage
            src={profile.images.cover}
            alt={`${profile.businessName} cover`}
            containerClassName="relative w-full h-64 mb-6 bg-base-300 rounded-lg overflow-hidden cursor-pointer"
            imageClassName="object-cover"
            sizes="(max-width: 768px) 100vw, 1024px"
          />
        )}

        {/* Business Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            {profile.images.logo && (
              <div className="flex-shrink-0">
                <LightboxImage
                  src={profile.images.logo}
                  alt={`${profile.businessName} logo`}
                  containerClassName="w-32 h-32 relative bg-base-200 rounded-lg overflow-hidden cursor-pointer"
                  imageClassName="object-contain p-2"
                  sizes="128px"
                />
              </div>
            )}

            {/* Business Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {profile.businessName}
              </h1>
              <div className="mb-4">
                <span className="badge badge-lg bg-[#af2878]/10 text-[#af2878] border border-[#af2878]/20 font-semibold">
                  SPONSOR
                </span>
              </div>

              {/* Address with Map */}
              <div className="mb-4">
                <p className="font-medium mb-2">
                  📍 {profile.address.fullAddress}
                </p>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Map */}
                  <div className="w-full h-64 md:h-72 rounded overflow-hidden bg-base-200">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={mapUrl}
                    ></iframe>
                  </div>

                  {/* Photos (in same box as map) */}
                  {(profile.images.staff ||
                    (profile.images.products &&
                      profile.images.products.length > 0)) && (
                    <div className="grid grid-cols-2 grid-rows-3 gap-2 h-64 md:h-72">
                      {profile.images.staff && (
                        <LightboxImage
                          src={profile.images.staff}
                          alt={`${profile.businessName} staff`}
                          containerClassName="relative col-span-2 row-span-2 bg-base-200 rounded-lg overflow-hidden cursor-pointer"
                          imageClassName="object-cover"
                          sizes="(max-width: 768px) 100vw, 600px"
                        />
                      )}

                      {profile.images.products &&
                        profile.images.products
                          .slice(0, 4)
                          .map((product, index) => (
                            <LightboxImage
                              key={product}
                              src={product}
                              alt={`${profile.businessName} product ${
                                index + 1
                              }`}
                              containerClassName="relative bg-base-200 rounded-lg overflow-hidden cursor-pointer"
                              imageClassName="object-cover"
                              sizes="(max-width: 768px) 50vw, 300px"
                            />
                          ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Blurb */}
              <p className="text-lg mb-4 italic text-base-content/80">
                {profile.blurb}
              </p>

              {/* Links */}
              <div className="flex gap-4">
                {profile.links.website && (
                  <Link
                    href={profile.links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    🌐 Website
                  </Link>
                )}
                {profile.links.instagram && (
                  <Link
                    href={profile.links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    📷 Instagram
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="relative rounded-lg shadow-lg p-6 mb-6 overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#af2878] via-[#d68bb5] to-[#f3dce8] opacity-90"></div>

          {/* Content overlay */}
          <div className="relative z-10 bg-base-100/95 backdrop-blur-sm rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-4">Impact Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat bg-gradient-to-br from-[#af2878]/10 to-[#f3dce8]/30 rounded-lg p-4 border border-[#af2878]/20">
                <div className="stat-title">Total Donated</div>
                <div className="stat-value text-2xl text-[#af2878]">
                  $
                  {profile.impact.totalDonated.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="stat bg-gradient-to-br from-[#af2878]/10 to-[#f3dce8]/30 rounded-lg p-4 border border-[#af2878]/20">
                <div className="stat-title">Activities Sponsored</div>
                <div className="stat-value text-2xl text-[#af2878]">
                  {profile.impact.activitiesSponsored}
                </div>
              </div>
              <div className="stat bg-gradient-to-br from-[#af2878]/10 to-[#f3dce8]/30 rounded-lg p-4 border border-[#af2878]/20">
                <div className="stat-title">Athletes Supported</div>
                <div className="stat-value text-2xl text-[#af2878]">
                  {profile.impact.athletesSupported}
                </div>
              </div>
            </div>

            {/* Charities Supported */}
            <div>
              <h3 className="text-xl font-semibold mb-3">
                Charities Supported
              </h3>
              <div className="flex flex-wrap gap-4">
                {profile.impact.charities.map((charity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-base-200 rounded-lg p-3"
                  >
                    {charity.logo && (
                      <div className="w-12 h-12 relative">
                        <LightboxImage
                          src={charity.logo}
                          alt={charity.name}
                          containerClassName="w-12 h-12 relative cursor-pointer"
                          imageClassName="object-contain"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <span className="font-medium">{charity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sponsored Activities */}
        <div className="relative rounded-lg shadow-lg p-6 mb-6 overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#af2878] via-[#d68bb5] to-[#f3dce8] opacity-90"></div>

          {/* Content overlay */}
          <div className="relative z-10 bg-base-100/95 backdrop-blur-sm rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-4">
              Recent Sponsored Activities
            </h2>
            <div className="space-y-4">
              {profile.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="border-b border-base-300 pb-4 last:border-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">
                          {getActivityEmoji(activity.activityType)}
                        </span>
                        <span className="font-semibold">
                          {activity.athleteName}
                        </span>
                        <span className="text-base-content/60">
                          • {activity.activityType}
                        </span>
                      </div>
                      <div className="text-sm text-base-content/70 ml-8">
                        <span>
                          {activity.distance} {activity.distanceUnit}
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
                      <div className="font-bold text-lg text-[#af2878]">
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
      </main>
    </div>
  );
}

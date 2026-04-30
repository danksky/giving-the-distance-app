import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { getDisplayName } from "@/lib/activity-privacy";
import { getActivityPath } from "@/lib/activity-url";
import { getLogger } from "@/lib/logger";
import LightboxImage from "@/components/LightboxImage";
import LocationPin from "@/components/LocationPin";
import CharityLogo from "@/components/CharityLogo";
import Navbar from "@/components/Navbar";
import type { Metadata } from "next";

const logger = getLogger("sponsor-profile-page");

// Business info from JSON file
interface SponsorBusinessInfo {
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
}

// Impact data from database
interface SponsorImpact {
  totalDonated: number;
  activitiesSponsored: number;
  athletesSupported: number;
  charities: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
  }>;
  recentActivities: Array<{
    id: string;
    shortcode: string | null;
    athleteName: string;
    activityType: string;
    distance: number;
    distanceUnit: string;
    donationAmount: number;
    charity: string;
    date: string;
  }>;
}

function emptySponsorImpact(): SponsorImpact {
  return {
    totalDonated: 0,
    activitiesSponsored: 0,
    athletesSupported: 0,
    charities: [],
    recentActivities: [],
  };
}

// Get business information from JSON file
async function getSponsorBusinessInfo(
  slug: string
): Promise<SponsorBusinessInfo | null> {
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

// Get real impact data from database
async function getSponsorImpact(sponsorId: string): Promise<SponsorImpact> {
  let commitments;

  try {
    // Query all commitments for this sponsor
    commitments = await db.charityCommitment.findMany({
      where: {
        campaign: {
          sponsorId: sponsorId,
        },
      },
      include: {
        activity: {
          include: {
            user: true,
          },
        },
        charity: true,
        campaign: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    logger.warn("Failed to load sponsor impact data; falling back to empty state", {
      sponsorId,
      error,
    });
    return emptySponsorImpact();
  }

  // Calculate impact statistics
  const totalDonated = commitments.reduce(
    (sum, c) => sum + c.amountCents / 100,
    0
  );
  const activitiesSponsored = commitments.length;
  const uniqueUserIds = new Set(commitments.map((c) => c.userId));
  const athletesSupported = uniqueUserIds.size;

  // Get unique charities
  const charitiesMap = new Map<
    string,
    { id: string; name: string; logoUrl: string | null }
  >();
  commitments.forEach((c) => {
    if (!charitiesMap.has(c.charityId)) {
      charitiesMap.set(c.charityId, {
        id: c.charityId,
        name: c.charity.name,
        logoUrl: c.charity.logoUrl,
      });
    }
  });
  const charities = Array.from(charitiesMap.values());

  // Map recent activities with anonymization
  const recentActivities = commitments.slice(0, 10).map((c) => ({
    id: c.activityId,
    shortcode: c.activity.shortcode,
    athleteName: getDisplayName(
      c.activity.user.name,
      c.activity.userId,
      c.activity.isPublicProfile,
      undefined
    ),
    activityType: c.activity.type,
    distance: Number(c.activity.distanceMeters || 0) / 1000,
    distanceUnit: "km",
    donationAmount: c.amountCents / 100,
    charity: c.charity.name,
    date: c.createdAt.toISOString(),
  }));

  return {
    totalDonated,
    activitiesSponsored,
    athletesSupported,
    charities,
    recentActivities,
  };
}

function extractIframeSrc(maybeIframeOrUrl?: string) {
  if (!maybeIframeOrUrl) return null;
  const trimmed = maybeIframeOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  const match = trimmed.match(/src\s*=\s*"([^"]+)"/i);
  return match?.[1] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const businessInfo = await getSponsorBusinessInfo(slug);

  if (!businessInfo) {
    return {
      title: "Donor Not Found | Giving the Distance",
    };
  }

  const title = `${businessInfo.businessName} | Giving the Distance Donor`;
  const description = businessInfo.blurb;

  // Get base URL from environment or use Vercel URL
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://givingthedistance.com";

  const coverImageUrl = businessInfo.images.cover
    ? `${baseUrl}${businessInfo.images.cover}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: coverImageUrl ? [{ url: coverImageUrl }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: coverImageUrl ? [coverImageUrl] : [],
    },
  };
}

export default async function SponsorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const businessInfo = await getSponsorBusinessInfo(slug);

  if (!businessInfo) {
    notFound();
  }

  // Get real impact data from database
  const impact = await getSponsorImpact(businessInfo.id);

  const embeddedSrc = extractIframeSrc(businessInfo.map?.embedUrl);

  const mapUrl =
    embeddedSrc ??
    `https://www.google.com/maps?q=${encodeURIComponent(
      businessInfo.address.fullAddress
    )}&output=embed`;

  return (
    <div className="min-h-screen bg-[#fff]">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Cover Image */}
        {businessInfo.images.cover && (
          <LightboxImage
            src={businessInfo.images.cover}
            alt={`${businessInfo.businessName} cover`}
            containerClassName="relative w-full h-64 mb-6 bg-base-300 rounded-lg overflow-hidden cursor-pointer"
            imageClassName="object-cover"
            sizes="(max-width: 768px) 100vw, 1024px"
          />
        )}

        {/* Business Header */}
        <div className="mb-8">
          {/* Logo + Title Row */}
          <div className="flex items-start gap-6 mb-6">
            {/* Logo */}
            {businessInfo.images.logo && (
              <LightboxImage
                src={businessInfo.images.logo}
                alt={`${businessInfo.businessName} logo`}
                containerClassName="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 relative bg-base-200 rounded-lg overflow-hidden cursor-pointer"
                imageClassName="object-contain p-2"
                sizes="128px"
              />
            )}

            {/* Title + Badge + Address */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-2">
                {businessInfo.businessName}
              </h1>
              <div className="mb-2">
                <span className="badge badge-lg bg-[#B56DFF]/10 text-[#8B4ACC] border border-[#B56DFF]/20 font-semibold">
                  DONOR
                </span>
              </div>
              <p className="font-medium inline-flex items-center gap-2">
                <LocationPin className="w-5 h-5 text-[#8B4ACC]" />
                <span>{businessInfo.address.fullAddress}</span>
              </p>
            </div>
          </div>

          {/* Map + Photos Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Map */}
            <div className="w-full h-80 md:h-[26rem] rounded overflow-hidden bg-base-200">
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

            {/* Photos */}
            {(businessInfo.images.staff ||
              (businessInfo.images.products &&
                businessInfo.images.products.length > 0)) && (
              <div className="grid grid-cols-2 grid-rows-3 gap-2 h-80 md:h-[26rem]">
                {businessInfo.images.staff && (
                  <LightboxImage
                    src={businessInfo.images.staff}
                    alt={businessInfo.businessName}
                    containerClassName="relative col-span-2 row-span-2 bg-base-200 rounded-lg overflow-hidden cursor-pointer"
                    imageClassName="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                )}

                {businessInfo.images.products &&
                  businessInfo.images.products
                    .slice(0, 4)
                    .map((product) => (
                      <LightboxImage
                        key={product}
                        src={product}
                        alt={businessInfo.businessName}
                        containerClassName="relative bg-base-200 rounded-lg overflow-hidden cursor-pointer"
                        imageClassName="object-cover"
                        sizes="(max-width: 768px) 50vw, 300px"
                      />
                    ))}
              </div>
            )}
          </div>

          {/* Blurb */}
          <p className="text-lg mb-4 italic text-base-content/80">
            {businessInfo.blurb}
          </p>

          {/* Links */}
          <div className="flex gap-4">
            {businessInfo.links.website && (
              <Link
                href={businessInfo.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                <i className="bi bi-globe2 text-base-content/60" aria-hidden="true" />
                Website
              </Link>
            )}
            {businessInfo.links.instagram && (
              <Link
                href={businessInfo.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                <i
                  className="bi bi-instagram text-base-content/60"
                  aria-hidden="true"
                />
                Instagram
              </Link>
            )}
          </div>
        </div>

        {/* Impact Summary */}
        <div className="card bg-base-100 mb-6">
          <div className="card-body">
            <h2 className="text-2xl font-bold mb-4">Impact Summary</h2>
            {impact.activitiesSponsored === 0 ? (
              <div className="text-center py-8 text-base-content/60">
                <p className="text-lg mb-2">No activities supported yet</p>
                <p className="text-sm">
                  This donor will appear here once they start supporting
                  athletes.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <div className="stat-title">Total Donated</div>
                    <div className="stat-value text-2xl text-[#8B4ACC]">
                      $
                      {impact.totalDonated.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <div className="stat-title">Activities Supported</div>
                    <div className="stat-value text-2xl text-[#8B4ACC]">
                      {impact.activitiesSponsored}
                    </div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <div className="stat-title">Athletes Supported</div>
                    <div className="stat-value text-2xl text-[#8B4ACC]">
                      {impact.athletesSupported}
                    </div>
                  </div>
                </div>

                {/* Charities Supported */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    Charities Supported
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {impact.charities.map((charity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-base-200 rounded-lg p-3"
                      >
                        <CharityLogo
                          charityId={charity.id}
                          name={charity.name}
                          logoUrl={charity.logoUrl}
                          size="md"
                        />
                        <span className="font-medium">{charity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Supported Activities */}
        {impact.recentActivities.length > 0 && (
          <div className="card bg-base-100 mb-6">
            <div className="card-body">
              <h2 className="text-2xl font-bold mb-4">
                Recent Supported Activities
              </h2>
              <div className="space-y-4">
                {impact.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border-b border-base-300 pb-4 last:border-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={getActivityPath(activity)}
                            className="font-semibold link link-hover"
                          >
                            {activity.athleteName}
                          </Link>
                          <span className="text-base-content/60">
                            • {activity.activityType}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-base-content/70">
                          <span className="whitespace-nowrap">
                            {activity.distance.toFixed(2)}{" "}
                            {activity.distanceUnit}
                          </span>
                          <span className="whitespace-nowrap">
                            • {activity.charity}
                          </span>
                          <span className="whitespace-nowrap">
                            •{" "}
                            {new Date(activity.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
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
        )}
      </main>
    </div>
  );
}

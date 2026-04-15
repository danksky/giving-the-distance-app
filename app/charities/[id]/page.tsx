import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import CharityLogo from "@/components/CharityLogo";
import { anonymizeName } from "@/lib/activity-privacy";
import { db } from "@/lib/db";
import { getAbsoluteCharityLogoUrl } from "@/lib/charity-logo";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface CharityImpact {
  totalRaised: number;
  activitiesSupported: number;
  athletesSupported: number;
  donorsSupporting: number;
  topDonors: Array<{
    id: string;
    businessName: string;
    slug: string;
    totalDonated: number;
  }>;
  recentActivities: Array<{
    id: string;
    athleteName: string;
    activityName: string;
    activityType: string;
    distanceKm: number;
    donationAmount: number;
    sponsorName: string;
    sponsorSlug: string;
    date: string;
  }>;
}

async function getCharity(id: string) {
  try {
    return await db.charity.findUnique({
      where: { id },
    });
  } catch {
    return null;
  }
}

async function getCharityImpact(charityId: string): Promise<CharityImpact> {
  const commitments = await db.charityCommitment.findMany({
    where: {
      charityId,
    },
    select: {
      amountCents: true,
      userId: true,
      activityId: true,
      createdAt: true,
      activity: {
        select: {
          id: true,
          name: true,
          type: true,
          distanceMeters: true,
          startDateLocal: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      campaign: {
        select: {
          sponsorId: true,
          sponsor: {
            select: {
              businessName: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalRaised = commitments.reduce(
    (sum, commitment) => sum + commitment.amountCents / 100,
    0
  );
  const athletesSupported = new Set(commitments.map((commitment) => commitment.userId)).size;
  const donorsSupporting = new Set(
    commitments.map((commitment) => commitment.campaign.sponsorId)
  ).size;

  const donorTotals = new Map<
    string,
    {
      id: string;
      businessName: string;
      slug: string;
      totalDonated: number;
    }
  >();

  commitments.forEach((commitment) => {
    const sponsorId = commitment.campaign.sponsorId;
    const existing = donorTotals.get(sponsorId);

    donorTotals.set(sponsorId, {
      id: sponsorId,
      businessName: commitment.campaign.sponsor.businessName,
      slug: commitment.campaign.sponsor.slug,
      totalDonated:
        (existing?.totalDonated ?? 0) + commitment.amountCents / 100,
    });
  });

  const topDonors = Array.from(donorTotals.values())
    .sort((a, b) => b.totalDonated - a.totalDonated)
    .slice(0, 6);

  const recentActivities = commitments.slice(0, 10).map((commitment) => ({
    id: commitment.activityId,
    athleteName: anonymizeName(commitment.activity.user.name),
    activityName:
      commitment.activity.name || `${commitment.activity.type} activity`,
    activityType: commitment.activity.type,
    distanceKm: Number(commitment.activity.distanceMeters || 0) / 1000,
    donationAmount: commitment.amountCents / 100,
    sponsorName: commitment.campaign.sponsor.businessName,
    sponsorSlug: commitment.campaign.sponsor.slug,
    date: (
      commitment.activity.startDateLocal ?? commitment.createdAt
    ).toISOString(),
  }));

  return {
    totalRaised,
    activitiesSupported: commitments.length,
    athletesSupported,
    donorsSupporting,
    topDonors,
    recentActivities,
  };
}

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://givingthedistance.com"
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const charity = await getCharity(id);

  if (!charity) {
    return {
      title: "Charity Not Found | Giving the Distance",
    };
  }

  const title = `${charity.name} Impact | Giving the Distance`;
  const description = `See how much Giving the Distance athletes have raised for ${charity.name}.`;
  const logoUrl = getAbsoluteCharityLogoUrl({
    baseUrl: getBaseUrl(),
    charityId: charity.id,
    logoUrl: charity.logoUrl,
  });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: logoUrl ? [{ url: logoUrl }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: logoUrl ? [logoUrl] : [],
    },
  };
}

export default async function CharityImpactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const charity = await getCharity(id);

  if (!charity) {
    notFound();
  }

  const impact = await getCharityImpact(charity.id);
  const hasImpact = impact.activitiesSupported > 0;

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <section className="mb-6 rounded-[2rem] border border-[#B56DFF]/20 bg-gradient-to-br from-[#B56DFF]/10 via-base-100 to-[#E5D4FF]/35 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <CharityLogo
                charityId={charity.id}
                name={charity.name}
                logoUrl={charity.logoUrl}
                size="xl"
                className="flex-shrink-0"
              />
              <div className="max-w-3xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="badge badge-lg bg-[#B56DFF]/10 text-[#8B4ACC] border border-[#B56DFF]/20 font-semibold">
                    CHARITY IMPACT
                  </span>
                  <span className="badge badge-outline badge-lg">
                    {charity.category}
                  </span>
                  {charity.isDefault && (
                    <span className="badge badge-primary badge-lg">
                      Default Charity
                    </span>
                  )}
                </div>
                <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
                  {charity.name}
                </h1>
                <p className="mb-4 text-lg font-semibold text-base-content/75">
                  {charity.fullName}
                </p>
                <p className="text-base leading-7 text-base-content/70">
                  {charity.description}
                </p>
              </div>
            </div>

            <div className="flex min-w-fit flex-col gap-3">
              {charity.charityNavigatorScore > 0 && (
                <div className="rounded-2xl bg-base-100/80 px-5 py-4 shadow-sm ring-1 ring-base-300">
                  <div className="text-xs font-semibold tracking-[0.2em] text-base-content/50">
                    CHARITY NAVIGATOR
                  </div>
                  <div className="mt-2 text-3xl font-bold text-[#8B4ACC]">
                    {charity.charityNavigatorScore}%
                  </div>
                </div>
              )}

              <Link
                href={charity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Visit Website
              </Link>
            </div>
          </div>
        </section>

        <section className="card mb-6 bg-base-100">
          <div className="card-body">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Impact Summary</h2>
                <p className="text-sm text-base-content/60">
                  All donations generated for {charity.name} through Giving the
                  Distance.
                </p>
              </div>
            </div>

            {!hasImpact ? (
              <div className="rounded-2xl bg-base-200 px-6 py-10 text-center text-base-content/60">
                <p className="mb-2 text-lg font-semibold">
                  No donations have been generated yet
                </p>
                <p className="text-sm">
                  Once athletes start raising for {charity.name}, the totals and
                  recent activity feed will show up here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="stat rounded-2xl bg-base-200 p-5">
                  <div className="stat-title">Total Raised</div>
                  <div className="stat-value text-3xl text-[#8B4ACC]">
                    {currencyFormatter.format(impact.totalRaised)}
                  </div>
                  <div className="stat-desc">Committed to this charity</div>
                </div>
                <div className="stat rounded-2xl bg-base-200 p-5">
                  <div className="stat-title">Activities Supported</div>
                  <div className="stat-value text-3xl text-[#8B4ACC]">
                    {impact.activitiesSupported}
                  </div>
                  <div className="stat-desc">Donation-generating activities</div>
                </div>
                <div className="stat rounded-2xl bg-base-200 p-5">
                  <div className="stat-title">Athletes Supported</div>
                  <div className="stat-value text-3xl text-[#8B4ACC]">
                    {impact.athletesSupported}
                  </div>
                  <div className="stat-desc">Unique athlete fundraisers</div>
                </div>
                <div className="stat rounded-2xl bg-base-200 p-5">
                  <div className="stat-title">Donors Supporting</div>
                  <div className="stat-value text-3xl text-[#8B4ACC]">
                    {impact.donorsSupporting}
                  </div>
                  <div className="stat-desc">Businesses funding donations</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {impact.topDonors.length > 0 && (
          <section className="card mb-6 bg-base-100">
            <div className="card-body">
              <h2 className="mb-4 text-2xl font-bold">Supporting Donors</h2>
              <div className="flex flex-wrap gap-3">
                {impact.topDonors.map((donor) => (
                  <Link
                    key={donor.id}
                    href={`/sponsors/${donor.slug}`}
                    className="flex items-center gap-3 rounded-2xl bg-base-200 px-4 py-3 transition hover:bg-base-300"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 font-bold text-primary">
                      {donor.businessName
                        .split(" ")
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{donor.businessName}</div>
                      <div className="text-sm text-base-content/60">
                        {currencyFormatter.format(donor.totalDonated)} donated
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {impact.recentActivities.length > 0 && (
          <section className="card bg-base-100">
            <div className="card-body">
              <h2 className="mb-4 text-2xl font-bold">
                Recent Supported Activities
              </h2>
              <div className="space-y-4">
                {impact.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border-b border-base-300 pb-4 last:border-0"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <Link
                          href={`/activities/${activity.id}`}
                          className="font-semibold link link-hover"
                        >
                          {activity.activityName}
                        </Link>
                        <div className="mt-1 text-sm text-base-content/70">
                          <span>{activity.athleteName}</span>
                          <span className="mx-2">•</span>
                          <span>{activity.activityType}</span>
                          <span className="mx-2">•</span>
                          <span>{activity.distanceKm.toFixed(2)} km</span>
                        </div>
                        <div className="mt-1 text-sm text-base-content/60">
                          Sponsored by{" "}
                          <Link
                            href={`/sponsors/${activity.sponsorSlug}`}
                            className="link link-hover font-medium"
                          >
                            {activity.sponsorName}
                          </Link>
                          <span className="mx-2">•</span>
                          <span>
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
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-bold text-[#8B4ACC]">
                          {currencyFormatter.format(activity.donationAmount)}
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
          </section>
        )}
      </main>
    </div>
  );
}

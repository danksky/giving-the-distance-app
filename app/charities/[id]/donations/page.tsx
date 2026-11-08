import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CharityLogo from "@/components/CharityLogo";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

async function getCharityWithDonations(id: string) {
  return db.charity.findUnique({
    where: { id },
    include: {
      donations: {
        orderBy: {
          donatedAt: "desc",
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const charity = await db.charity.findUnique({
    where: { id },
    select: { name: true },
  });

  if (!charity) {
    return {
      title: "Charity Not Found | Giving the Distance",
    };
  }

  return {
    title: `${charity.name} Donations | Giving the Distance`,
    description: `See donations recorded for ${charity.name} through Giving the Distance.`,
  };
}

export default async function CharityDonationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const charity = await getCharityWithDonations(id);

  if (!charity) {
    notFound();
  }

  const totalDonated = charity.donations.reduce(
    (sum, donation) => sum + donation.amountCents,
    0
  );

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 text-sm breadcrumbs">
          <ul>
            <li>
              <Link href={`/charities/${charity.id}`} className="link link-hover">
                {charity.name}
              </Link>
            </li>
            <li className="font-semibold">Donations</li>
          </ul>
        </div>

        <section className="mb-6 rounded-[2rem] border border-[#B56DFF]/20 bg-gradient-to-br from-[#B56DFF]/10 via-base-100 to-[#E5D4FF]/35 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <CharityLogo
                charityId={charity.id}
                name={charity.name}
                logoUrl={charity.logoUrl}
                size="lg"
                className="flex-shrink-0"
              />
              <div>
                <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#8B4ACC]">
                  Public transparency
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  Donations for {charity.name}
                </h1>
                <p className="mt-2 max-w-2xl text-base-content/65">
                  Contributions recorded through Giving the Distance.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/80 px-5 py-4 sm:text-right">
              <div className="text-sm text-base-content/55">Total donated</div>
              <div className="text-3xl font-bold text-[#8B4ACC]">
                {currencyFormatter.format(totalDonated / 100)}
              </div>
              <div className="text-xs text-base-content/50">
                {charity.donations.length} donation{" "}
                {charity.donations.length === 1 ? "record" : "records"}
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 rounded-2xl border border-info/20 bg-info/5 p-5 text-sm leading-6 text-base-content/70">
          Amounts reflect the gift designated for the charity, excluding any
          separately covered processing fees. Donations made through PayPal
          Giving Fund are granted to charities on its delivery schedule; the
          donation date is not necessarily the date the charity receives funds.
          Direct donations are identified by their payment method.
        </div>

        <section className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
          {charity.donations.length === 0 ? (
            <div className="px-6 py-12 text-center text-base-content/60">
              No donations have been published for this charity yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-base-300 bg-base-200/70 text-xs uppercase tracking-wide text-base-content/55">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Method</th>
                    <th className="px-5 py-4 font-semibold">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {charity.donations.map((donation) => (
                    <tr
                      key={donation.id}
                      className="border-b border-base-300 last:border-0"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        {donation.donatedAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "America/New_York",
                        })}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold">
                        {currencyFormatter.format(donation.amountCents / 100)}
                        {donation.processingFeeCents > 0 && (
                          <div className="text-xs font-normal text-base-content/60">
                            {currencyFormatter.format(donation.processingFeeCents / 100)} processing fee also covered
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {donation.provider}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-sm text-base-content/65">
                        {donation.publicReference
                          ? `Ending ${donation.publicReference}`
                          : "Not available"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

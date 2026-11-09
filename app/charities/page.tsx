import type { Metadata } from "next";
import Link from "next/link";
import CharityLogo from "@/components/CharityLogo";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Charities | Giving the Distance",
  description: "Browse the charities you can support with Giving the Distance.",
};

export default async function CharitiesPage() {
  const charities = await db.charity.findMany({
    select: { id: true, name: true, logoUrl: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold sm:text-4xl">Charities</h1>
          <p className="mt-2 max-w-2xl text-base-content/65">
            Browse the charities you can support with Giving the Distance.
          </p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
          {charities.length === 0 ? (
            <div className="px-6 py-12 text-center text-base-content/60">
              No charities are listed yet.
            </div>
          ) : (
            <ul>
              {charities.map((charity) => (
                <li key={charity.id} className="border-b border-base-300 last:border-0">
                  <Link
                    href={`/charities/${charity.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-base-200/70"
                  >
                    <CharityLogo
                      charityId={charity.id}
                      name={charity.name}
                      logoUrl={charity.logoUrl}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1 font-semibold">{charity.name}</div>
                    <i className="bi bi-chevron-right text-base-content/40" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

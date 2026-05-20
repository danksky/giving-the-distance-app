import { auth, signIn } from "@/auth";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { redirect } from "next/navigation";

const featuredCharities = [
  { name: "UNICEF", src: "/logos/charities/unicef.png" },
  { name: "ASPCA", src: "/logos/charities/aspca.jpeg" },
  { name: "Red Cross", src: "/logos/charities/american-red-cross.png" },
  { name: "St. Jude", src: "/logos/charities/st-jude.png" },
  {
    name: "Doctors Without Borders",
    src: "/logos/charities/doctors-without-borders.jpg",
  },
  { name: "Feeding America", src: "/logos/charities/feeding-america.png" },
  {
    name: "Save the Children",
    src: "/logos/charities/save-the-children.png",
  },
  { name: "CARE", src: "/logos/charities/care-usa.png" },
  { name: "WHO", src: "/logos/charities/who.png" },
  { name: "WWF", src: "/logos/charities/wwf.jpg" },
  { name: "Robin Hood", src: "/logos/charities/robin-hood.svg" },
] as const;

const featuredCharityCarousel = [...featuredCharities, ...featuredCharities];

const FUNDRAISING_START_DATE = "2026-05-14";
const FUNDRAISING_START_AMOUNT = 5400;
const FUNDRAISING_STEP_DAYS = 8;
const FUNDRAISING_STEP_AMOUNT = 50;
const FUNDRAISING_MAX_AMOUNT = 7000;
export const revalidate = 604800;

export const metadata: Metadata = {
  title: "Giving the Distance | Make Your Athletic Activity Go Even Further",
  description:
    "Connect Strava to Giving the Distance so your runs, rides, and walks automatically generate donations from local sponsors.",
};

export default async function Home() {
  const session = await auth();
  const today = new Date();
  const asOfLabel = formatAsOfDate(today);
  const raisedAmount = getRaisedAmount(today);
  const totalMiles = await getTotalMiles();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f7f4fb]">
      <Navbar />

      <main>
        <section className="border-b border-black/5 bg-[radial-gradient(circle_at_top_left,_rgba(181,109,255,0.16),_transparent_30%),linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:py-20">
            <div className="flex flex-col justify-center">
              <h1 className="max-w-3xl text-5xl font-black tracking-tight text-[#171717] sm:text-6xl lg:text-7xl">
                Make your athletic activity go even further.
              </h1>

              <p className="mt-6 max-w-2xl text-xl leading-9 text-[#64607a]">
                Once you connect Strava to Giving the Distance, your runs,
                rides, and walks will automatically generate donations from
                local sponsors.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-stretch">
                <GoogleSignInButton
                  label="Get Going"
                  className="w-full justify-center sm:min-w-[220px]"
                />
                {/* Sponsor CTA can be restored here when the sponsor flow is ready again. */}
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_28px_80px_rgba(96,56,146,0.18)]">
                <div className="relative h-[420px] sm:h-[520px]">
                  <Image
                    src="/landing-runners-hero.jpg"
                    alt="Runner crossing a New York City bridge"
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,16,34,0.05),rgba(22,16,34,0.38))]" />
                </div>
              </div>

              <div className="absolute -bottom-6 left-4 rounded-[1.5rem] border border-[#e8ddfa] bg-white px-5 py-4 shadow-[0_18px_40px_rgba(17,24,39,0.12)] sm:left-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7d7894]">
                  {asOfLabel}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#171717] sm:text-3xl">
                  ${raisedAmount.toLocaleString()}{" "}
                  <span className="text-[#B56DFF]">raised</span>
                </p>
                <p className="mt-1 text-sm text-[#64607a]">
                  across {totalMiles.toLocaleString()} miles in NYC
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/5 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8e89a3]">
                Featured charities
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#171717] sm:text-4xl">
                Move for causes you believe in.
              </h2>
            </div>

            <div className="featured-charity-marquee mt-12">
              <div className="featured-charity-track">
                {featuredCharityCarousel.map((charity, index) => (
                  <div
                    key={`${charity.name}-${index}`}
                    className="featured-charity-item"
                  >
                    <div className="featured-charity-logo-wrap">
                      <Image
                        src={charity.src}
                        alt={`${charity.name} logo`}
                        width={160}
                        height={72}
                        className="featured-charity-logo"
                      />
                    </div>
                    <span className="featured-charity-label">{charity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tight text-[#171717] sm:text-5xl">
              Get noticed, sponsors.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#64607a]">
              Your sponsorship will show up inside of the story of the activity
              itself.
            </p>
          </div>

          <div className="mt-10 space-y-8">
            <div>
              <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-[#8e89a3]">
                The Strava view
              </p>

              <div className="mt-4 rounded-[2rem] border border-[#e5d9f8] bg-white p-6 shadow-[0_22px_60px_rgba(17,24,39,0.07)] sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[#ece4f8]">
                    <Image
                      src="/fake-people/fake-person-1.png"
                      alt="Katie Swift"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-[#171717]">
                      Katie Swift
                    </p>
                    <p className="text-sm text-[#64607a]">
                      Yesterday at 5:42 PM • Brooklyn, NY
                    </p>
                  </div>
                </div>

                <h3 className="mt-8 text-3xl font-semibold tracking-tight text-[#171717]">
                  Sunset Prospect Park Loop
                </h3>

                <div className="mt-8 grid grid-cols-3 gap-4 border-y border-[#eee7f7] py-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d7894]">
                      Distance
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#171717]">
                      6.21 mi
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d7894]">
                      Pace
                    </p>
                    <p className="mt-2 whitespace-nowrap text-2xl font-semibold text-[#171717]">
                      8:12 /mi
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d7894]">
                      Time
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#171717]">
                      50:56
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-[#e7d4ff] bg-[#faf5ff] p-5">
                  <div className="flex items-start">
                    <p className="text-lg leading-8 text-[#231f30]">
                      <span className="font-semibold">Katie&apos;s run</span>{" "}
                      inspired{" "}
                      <span className="font-semibold text-[#B56DFF]">
                        Northside Stride Running Co.
                      </span>{" "}
                      to donate to Katie&apos;s chosen charity,{" "}
                      <span className="font-semibold">NYC Youth Sports</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-[#8e89a3]">
                The donation page view
              </p>

              <div className="mt-4 rounded-[2rem] border border-[#e5d9f8] bg-white p-6 shadow-[0_22px_60px_rgba(17,24,39,0.07)] sm:p-8">
                <div className="flex flex-col gap-4 border-b border-[#eee7f7] pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d7894]">
                      Impact
                    </p>
                    <h3 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-[#171717]">
                      Katie&apos;s activity generated a donation for NYC Youth
                      Sports.
                    </h3>
                  </div>
                  <div className="w-fit rounded-full border border-[#e7d4ff] bg-[#faf5ff] px-4 py-2 text-sm font-semibold text-[#8b4acc]">
                    Public donation page
                  </div>
                </div>

                <div className="grid gap-6 py-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d7894]">
                      Benefiting charity
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#e7d4ff] bg-[#faf5ff] text-lg font-black text-[#8b4acc]">
                        NYS
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-[#171717]">
                          NYC Youth Sports
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#64607a]">
                          Helping kids across the city get moving.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d7894]">
                      Commitment amount
                    </p>
                    <p className="mt-4 text-5xl font-black tracking-tight text-[#B56DFF]">
                      $0.15
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#64607a]">
                      Generated from this activity.
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#eee7f7] pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d7894]">
                    Made possible by
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#171717] text-sm font-black text-white">
                      NS
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-[#171717]">
                        Northside Stride Running Co.
                      </p>
                      <p className="mt-1 text-sm text-[#64607a]">
                        Local sponsor
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#e7dcf7] bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-8 text-center shadow-[0_22px_60px_rgba(17,24,39,0.06)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#9c88bb]">
              Ready when you are
            </p>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-[#171717] sm:text-5xl">
              Start turning miles into support.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#64607a]">
              Connect Strava and make each run, ride, or walk part of
              something bigger.
            </p>

            <div className="mt-8 flex justify-center">
              <GoogleSignInButton
                label="Get Going"
                className="w-full justify-center sm:w-auto sm:min-w-[220px]"
              />
              {/* Sponsor CTA can be restored here when the sponsor flow is ready again. */}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function GoogleSignInButton({
  label,
  className = "",
  variant = "primary",
}: {
  label: string;
  className?: string;
  variant?: "primary" | "light";
}) {
  const buttonStyles =
    variant === "light"
      ? "bg-white text-[#5e2f9f] shadow-[0_16px_35px_rgba(17,24,39,0.14)] hover:bg-[#f6eeff]"
      : "bg-[#B56DFF] text-white shadow-[0_16px_35px_rgba(181,109,255,0.32)] hover:bg-[#9F4FE8]";

  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/dashboard" });
      }}
      className={`w-full sm:w-auto ${className.includes("w-full") ? "sm:flex-1" : ""}`}
    >
      <button
        type="submit"
        className={`inline-flex w-full cursor-pointer items-center gap-3 rounded-xl px-6 py-3 text-sm font-semibold transition ${buttonStyles} ${className}`}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {label}
      </button>
    </form>
  );
}

function formatAsOfDate(date: Date) {
  return `As of ${date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  })}`;
}

function getRaisedAmount(date: Date) {
  const startDate = new Date(`${FUNDRAISING_START_DATE}T00:00:00-04:00`);
  const elapsedMs = Math.max(0, date.getTime() - startDate.getTime());
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const steps = Math.floor(elapsedDays / FUNDRAISING_STEP_DAYS);

  // Intentional landing-page pacing:
  // start at $5,400 on May 14, 2026, add $50 every 8 days,
  // and stop increasing once the displayed total reaches $7,000.
  return Math.min(
    FUNDRAISING_MAX_AMOUNT,
    FUNDRAISING_START_AMOUNT + steps * FUNDRAISING_STEP_AMOUNT
  );
}

async function getTotalMiles() {
  const result = await db.activity.aggregate({
    _sum: { distanceMeters: true },
    where: { deletedAt: null },
  });

  const totalMeters = Number(result._sum.distanceMeters ?? 0);
  return Math.round(totalMeters / 1609.344);
}

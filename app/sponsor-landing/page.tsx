import Navbar from "@/components/Navbar";
import BusinessSearchPreview from "@/components/BusinessSearchPreview";
import SponsorContactForm from "@/components/SponsorContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Sponsor | Giving the Distance",
  description:
    "Get your business seen while doing real good. Sponsor local New York City runs and rides, and your name appears directly on athletes' activities.",
};

export default function SponsorLandingPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-[#fafafa] py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Get your business seen
            <br />
            while doing real good.
          </h1>
          <p className="text-xl md:text-2xl text-[#374151] mb-4">
            Sponsor local runs & rides.
            <br />
            Your name appears directly on athletes&apos; activities.
          </p>
          <p className="text-sm text-[#6b7280] max-w-2xl mx-auto mb-6">
            Built for small businesses. Currently focused on New York City.
            Always charity-first.
          </p>
          <a
            href="#contact"
            className="inline-block bg-[#B56DFF] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#8B4ACC] transition-colors"
          >
            I&apos;m in!
          </a>
        </div>
      </section>

      {/* Interactive Preview Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <BusinessSearchPreview apiKey={apiKey} />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B56DFF]/20 to-[#004e89]/20 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-[#B56DFF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">
                Athletes log runs & rides
              </h3>
              <p className="text-[#6b7280]">
                New York City runners and cyclists record activities on Strava.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B56DFF]/20 to-[#004e89]/20 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-[#B56DFF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">
                Your business sponsors activities
              </h3>
              <p className="text-[#6b7280]">
                We match your donor profile to activities you qualify for.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B56DFF]/20 to-[#004e89]/20 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-[#B56DFF]"
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
              </div>
              <h3 className="text-xl font-bold mb-3">
                Your name appears on their activity
              </h3>
              <p className="text-[#6b7280]">
                Donations go to charity. Your support is visible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Designed for Small Businesses Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-[#fafafa] to-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#6b7280] mb-3 tracking-wide">
              THIS ISN&apos;T AN AD NETWORK. IT&apos;S A COMMUNITY-BASED CHARITY
              PLATFORM.
            </p>
            <h2 className="text-4xl font-bold mb-8">
              Designed for small businesses
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#10b981]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  No bidding wars against national brands
                </h3>
                <p className="text-sm text-[#6b7280]">
                  You&apos;re not competing on price. Every sponsor gets fair
                  visibility.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#10b981]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  Local businesses are prioritized
                </h3>
                <p className="text-sm text-[#6b7280]">
                  We match you with athletes in your area first.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#10b981]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  Sponsorships are matched fairly
                </h3>
                <p className="text-sm text-[#6b7280]">
                  Our algorithm distributes opportunities evenly across all
                  donors.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#10b981]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  You control your comfort level
                </h3>
                <p className="text-sm text-[#6b7280]">
                  Set your own budget, pause anytime, no long-term commitments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-20 bg-white scroll-mt-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Want to try this?</h2>
            <p className="text-lg text-[#6b7280]">
              Leave your info and we&apos;ll walk you through it.
              <br />
              No obligation.
            </p>
          </div>

          <SponsorContactForm />

          {/* Footer Signal */}
          <p className="text-center text-sm text-[#6b7280] mt-8">
            Built in Brooklyn. Run by real people.
          </p>
        </div>
      </section>
    </div>
  );
}

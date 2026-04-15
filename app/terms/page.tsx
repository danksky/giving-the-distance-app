import { Metadata } from "next";
import Navbar from "@/components/Navbar";

const LAST_UPDATED = "April 14, 2026";

export const metadata: Metadata = {
  title: "Terms of Service - Giving the Distance",
  description:
    "Read the terms and conditions for using Giving the Distance platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <Navbar />

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="card bg-base-100 ">
          <div className="card-body prose max-w-none">
            <h1 className="card-title text-3xl">Terms of Service</h1>
            <div className="space-y-8">
              <section>
                <p className="opacity-70 mb-6">
                  <strong>Last Updated:</strong> {LAST_UPDATED}
                </p>
                <p className="leading-relaxed">
                  Welcome to Giving the Distance. By accessing or using our
                  platform, you agree to be bound by these Terms of Service.
                  Please read them carefully before using our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Acceptance of Terms
                </h2>
                <p className="leading-relaxed">
                  By creating an account and using Giving the Distance, you
                  acknowledge that you have read, understood, and agree to be
                  bound by these Terms of Service and our Privacy Policy. If you
                  do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Eligibility</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>To use Giving the Distance, you must:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Be at least 13 years of age</li>
                    <li>Have a valid Google account</li>
                    <li>Have a Strava account to utilize donation features</li>
                    <li>
                      Provide accurate and complete information during
                      registration
                    </li>
                    <li>
                      Comply with all applicable laws and regulations in your
                      jurisdiction
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Account Responsibilities
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>As a user, you are responsible for:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Maintaining the security and confidentiality of your
                      account
                    </li>
                    <li>
                      All activities that occur under your account, whether
                      authorized or not
                    </li>
                    <li>
                      Ensuring your Strava account data is accurate and up to
                      date
                    </li>
                    <li>
                      Notifying us immediately of any unauthorized access or
                      security breach
                    </li>
                    <li>
                      Complying with Strava&apos;s terms of service and API
                      usage guidelines
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Platform Services
                </h2>
                <div className="space-y-4 leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">What We Provide</h3>
                    <p>
                      Giving the Distance connects athletes with donors to
                      support charitable causes. We provide a platform that:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>
                        Integrates with Strava to track your athletic activities
                      </li>
                      <li>
                        Enables creation and management of donation campaigns
                      </li>
                      <li>
                        Displays activity, sponsor, and charity information
                        connected to supported campaigns
                      </li>
                      <li>
                        Facilitates connections between athletes, donors, and
                        charitable organizations
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Service Availability</h3>
                    <p>
                      We strive to provide continuous access to our platform,
                      but we do not guarantee uninterrupted service. We may
                      modify, suspend, or discontinue any aspect of our services
                      at any time without prior notice.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">No Guarantee of Results</h3>
                    <p>
                      Giving the Distance does not guarantee that any athlete,
                      donor, sponsor, charity, or campaign will receive any
                      minimum level of visibility, promotion, public exposure,
                      engagement, participation, matching volume, activity
                      volume, fundraising outcome, or other business or
                      charitable result through the platform.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      No Guarantee for Sponsors
                    </h3>
                    <p>
                      Sponsors and prospective sponsors acknowledge that the
                      platform may feature, reference, or display sponsor names,
                      logos, messages, profiles, or related information, but we
                      do not guarantee that any sponsor will be promoted in any
                      particular way, receive any particular number of matched
                      activities, impressions, clicks, conversions, customer
                      leads, or other commercial benefit.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Strava Integration
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>When you connect your Strava account, you:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Grant us permission to access your Strava activity data,
                      profile information, and to update your activities with
                      donation details
                    </li>
                    <li>
                      Acknowledge that we will use Strava&apos;s API in
                      accordance with their terms of service
                    </li>
                    <li>
                      Understand that disconnecting your Strava account will
                      disable donation tracking features
                    </li>
                    <li>
                      Agree that we may add descriptions or tags to your Strava
                      activities to reflect donations made through our platform
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Payments and Donations
                </h2>
                <div className="space-y-4 leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">Platform Status</h3>
                    <p>
                      Giving the Distance does not currently process payments or
                      donations directly through the platform. Any references to
                      donation amounts, commitments, sponsorships, or campaign
                      values reflect platform features, records, or campaign
                      logic and do not, by themselves, mean that a payment
                      transaction has been processed by Giving the Distance.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Fees</h3>
                    <p>
                      We may introduce paid features, platform fees, or payment
                      processing in the future. If we do, any applicable terms
                      and fees will be disclosed before they take effect.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">No Payment Guarantee</h3>
                    <p>
                      We make no representation or warranty that any sponsor,
                      donor, athlete, or charity will receive, transmit, or be
                      entitled to any particular payment, reimbursement, pledge,
                      donation, or other financial benefit through the platform
                      unless and until such arrangements are separately and
                      expressly established.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">User Conduct</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>You agree NOT to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Manipulate or falsify activity data to increase donation
                      payments
                    </li>
                    <li>
                      Use the platform for any illegal or unauthorized purpose
                    </li>
                    <li>
                      Violate any laws in your jurisdiction or ours (United
                      States)
                    </li>
                    <li>
                      Interfere with or disrupt the platform or servers
                      connected to it
                    </li>
                    <li>
                      Attempt to gain unauthorized access to other user accounts
                      or systems
                    </li>
                    <li>
                      Use automated tools or bots to access or interact with the
                      platform
                    </li>
                    <li>Harass, abuse, or harm other users of the platform</li>
                    <li>
                      Impersonate any person or entity or misrepresent your
                      affiliation
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Intellectual Property
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    All content, features, and functionality of Giving the
                    Distance, including but not limited to text, graphics,
                    logos, icons, images, and software, are the exclusive
                    property of Giving the Distance or its licensors and are
                    protected by copyright, trademark, and other intellectual
                    property laws.
                  </p>
                  <p>You may not:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Copy, modify, or distribute any content from our platform
                      without permission
                    </li>
                    <li>Reverse engineer or attempt to extract source code</li>
                    <li>
                      Remove or alter any copyright, trademark, or proprietary
                      notices
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  User Content License
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    As between you and Giving the Distance, you retain ownership
                    of the content and information you submit, upload, connect,
                    post, or otherwise make available through the platform,
                    subject to any rights granted to us under these Terms.
                  </p>
                  <p>
                    You grant Giving the Distance a worldwide, non-exclusive,
                    royalty-free, transferable, sublicensable license to host,
                    store, reproduce, use, modify, adapt, publish, translate,
                    create derivative works from, distribute, perform, and
                    display such content as reasonably necessary to operate,
                    improve, promote, and provide the platform and related
                    services.
                  </p>
                  <p>
                    You are solely responsible for your content and represent
                    that you have all rights, permissions, and consents needed
                    to provide it and to grant the rights described in these
                    Terms.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Publicity and Promotional Use
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    By using Giving the Distance and participating in campaigns,
                    activities, or other platform features, you grant Giving
                    the Distance and its partners, affiliates, and service
                    providers the right to use your name, username, profile
                    information, photograph, avatar, image, likeness, voice,
                    biographical information, and submitted or connected
                    content, including activity details and campaign
                    participation, for promotional, advertising, publicity,
                    editorial, marketing, and other media-related purposes.
                  </p>
                  <p>
                    This permission includes use in digital, print, social
                    media, press materials, fundraising materials, website
                    content, and other communications now known or later
                    developed, without further notice to you or additional
                    compensation to the extent permitted by law.
                  </p>
                  <p>
                    Unless we expressly agree otherwise in writing, nothing in
                    these Terms obligates Giving the Distance to use, publish,
                    promote, or continue to display any particular name, image,
                    likeness, sponsor profile, campaign, activity, or other
                    content for any period of time or in any specific format.
                  </p>
                  <p>
                    You represent that you have the rights necessary to grant
                    this permission for any content, images, or materials you
                    provide or make available through the platform.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Data Accuracy and Liability
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    While we strive to ensure accurate tracking of athletic
                    activities and donations, we rely on data provided by Strava
                    and other third-party services. We are not responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Inaccuracies in activity data from Strava</li>
                    <li>GPS or tracking errors in athletic activities</li>
                    <li>
                      Delays, failures, or omissions in matching, display, or
                      campaign logic
                    </li>
                    <li>
                      Disputes between sponsors, athletes, donors, charities, or
                      other participants
                    </li>
                    <li>
                      Any expectation that a sponsor, athlete, donor, or charity
                      will receive publicity, exposure, promotion, or financial
                      results
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Disclaimers and Limitation of Liability
                </h2>
                <div className="space-y-4 leading-relaxed">
                  <div className="alert alert-warning">
                    <div>
                      <h3 className="font-bold">IMPORTANT LEGAL NOTICE</h3>
                      <p className="text-sm">
                        THE PLATFORM IS PROVIDED &quot;AS IS&quot; WITHOUT
                        WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO
                        NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED,
                        ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL
                        COMPONENTS.
                      </p>
                    </div>
                  </div>
                  <p>
                    To the maximum extent permitted by law, Giving the Distance
                    shall not be liable for any indirect, incidental, special,
                    consequential, or punitive damages, or any loss of profits
                    or revenues, whether incurred directly or indirectly, or any
                    loss of data, use, goodwill, or other intangible losses.
                  </p>
                  <p>
                    To the maximum extent permitted by law, you agree that your
                    use of the platform is at your own risk and that you will
                    not bring claims against Giving the Distance or its officers,
                    directors, employees, contractors, agents, sponsors,
                    partners, licensors, or service providers for dissatisfaction
                    with platform availability, matching outcomes, sponsor
                    visibility, publicity decisions, campaign performance,
                    business results, fundraising outcomes, or reliance on
                    third-party data or services, except to the extent such
                    limitation is prohibited by applicable law.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
                <p className="leading-relaxed">
                  You agree to indemnify, defend, and hold harmless Giving the
                  Distance, its officers, directors, employees, and agents from
                  any claims, liabilities, damages, losses, and expenses,
                  including reasonable attorney fees, arising out of or in any
                  way connected with your access to or use of the platform, your
                  violation of these Terms, or your violation of any rights of
                  another person or entity. This includes claims arising from
                  content you provide, statements you make, your relationship or
                  dispute with any sponsor, athlete, donor, charity, or third
                  party, and any allegation that Giving the Distance failed to
                  deliver promotion, visibility, commercial results, or other
                  expected outcomes on your behalf.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Termination</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    We reserve the right to terminate or suspend your account
                    and access to the platform at our sole discretion, without
                    prior notice or liability, for any reason, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Violation of these Terms of Service</li>
                    <li>Fraudulent or suspicious activity</li>
                    <li>Request by law enforcement or government agencies</li>
                    <li>Extended periods of inactivity</li>
                  </ul>
                  <p className="mt-3">
                    Upon termination, your right to use the platform will
                    immediately cease. We may delete your account data in
                    accordance with our Privacy Policy.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Changes to Terms
                </h2>
                <p className="leading-relaxed">
                  We reserve the right to modify these Terms of Service at any
                  time. We will notify users of material changes by posting the
                  updated terms on this page and updating the &quot;Last
                  Updated&quot; date. Your continued use of the platform after
                  any changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Governing Law and Dispute Resolution
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    These Terms shall be governed by and construed in accordance
                    with the laws of the United States and the State of New
                    York, without regard to its conflict of law provisions.
                  </p>
                  <p>
                    Any disputes arising from these Terms or your use of the
                    platform shall be resolved through binding arbitration in
                    accordance with the rules of the American Arbitration
                    Association in New York, New York, except where prohibited
                    by law. To the maximum extent permitted by law, you and
                    Giving the Distance agree to bring claims only in an
                    individual capacity and not as a plaintiff or class member
                    in any purported class or representative proceeding.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Severability</h2>
                <p className="leading-relaxed">
                  If any provision of these Terms is found to be unenforceable
                  or invalid, that provision will be limited or eliminated to
                  the minimum extent necessary, and the remaining provisions
                  will remain in full force and effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <p className="leading-relaxed mb-4">
                  If you have any questions about these Terms of Service, please
                  contact us at:
                </p>
                <div className="p-4 bg-base-200 rounded-lg">
                  <p className="font-medium">Giving the Distance</p>
                  <p>Email: legal@givingthedistance.org</p>
                  <p>Support: support@givingthedistance.org</p>
                </div>
              </section>

              <section className="pt-6 border-t border-base-300">
                <p className="text-sm opacity-70">
                  By using Giving the Distance, you acknowledge that you have
                  read, understood, and agree to be bound by these Terms of
                  Service.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

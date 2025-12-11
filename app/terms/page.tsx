import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Giving the Distance",
  description:
    "Read the terms and conditions for using Giving the Distance platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1 max-w-4xl mx-auto px-4">
          <Link href="/" className="btn btn-ghost">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body prose max-w-none">
            <h1 className="card-title text-3xl">Terms of Service</h1>
            <div className="space-y-8">
              <section>
                <p className="opacity-70 mb-6">
                  <strong>Last Updated:</strong>{" "}
                  {new Date().toLocaleDateString()}
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
                    <li>
                      Have a Strava account to utilize sponsorship features
                    </li>
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
                      Giving the Distance connects athletes with sponsors to
                      support charitable causes. We provide a platform that:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>
                        Integrates with Strava to track your athletic activities
                      </li>
                      <li>
                        Enables creation and management of sponsorship campaigns
                      </li>
                      <li>
                        Processes donations based on athletic achievements
                      </li>
                      <li>
                        Facilitates connections between athletes, sponsors, and
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
                      sponsorship details
                    </li>
                    <li>
                      Acknowledge that we will use Strava&apos;s API in
                      accordance with their terms of service
                    </li>
                    <li>
                      Understand that disconnecting your Strava account will
                      disable sponsorship tracking features
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
                    <h3 className="font-semibold mb-2">Payment Processing</h3>
                    <p>
                      All payments are processed through Stripe, a third-party
                      payment processor. By making or receiving payments, you
                      agree to Stripe&apos;s terms of service.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Fees</h3>
                    <p>
                      We may charge platform fees for facilitating sponsorships
                      and donations. Any applicable fees will be clearly
                      disclosed before you confirm a transaction.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Refund Policy</h3>
                    <p>
                      All donations are final and non-refundable unless required
                      by law or in cases of fraud or technical error.
                      Sponsorship agreements may have specific terms that
                      override this general policy.
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
                      Manipulate or falsify activity data to increase
                      sponsorship payments
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
                    <li>Delays or failures in payment processing</li>
                    <li>
                      Disputes between sponsors and athletes regarding
                      sponsorship terms
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
                  another person or entity.
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
                    with the laws of the United States and the State of [Your
                    State], without regard to its conflict of law provisions.
                  </p>
                  <p>
                    Any disputes arising from these Terms or your use of the
                    platform shall be resolved through binding arbitration in
                    accordance with the rules of the American Arbitration
                    Association, except where prohibited by law.
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

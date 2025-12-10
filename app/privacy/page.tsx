import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Giving the Distance",
  description:
    "Learn how Giving the Distance collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <p className="text-gray-600 mb-6">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-700 leading-relaxed">
              At Giving the Distance, we are committed to protecting your
              privacy and ensuring the security of your personal information.
              This Privacy Policy explains how we collect, use, and safeguard
              your data when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Information We Collect
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Account Information
                </h3>
                <p>
                  When you sign up for Giving the Distance, we collect your
                  name, email address, and profile information from your Google
                  account.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Strava Data
                </h3>
                <p>
                  When you connect your Strava account, we access your athletic
                  activities, profile information, and activity statistics. We
                  only collect data necessary to provide our sponsorship
                  services.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Usage Information
                </h3>
                <p>
                  We collect information about how you use our platform,
                  including pages visited, features used, and interactions with
                  our services.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
              <li>To provide and maintain our sponsorship services</li>
              <li>
                To track your athletic activities for sponsorship purposes
              </li>
              <li>
                To process donations and connect sponsors with your achievements
              </li>
              <li>To communicate with you about your account and activities</li>
              <li>To improve and optimize our platform</li>
              <li>To ensure the security and integrity of our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data Sharing and Third Parties
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We integrate with third-party services to provide our platform:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Google:</strong> For authentication and account
                  management
                </li>
                <li>
                  <strong>Strava:</strong> For accessing your athletic activity
                  data
                </li>
                <li>
                  <strong>Stripe:</strong> For processing payments and donations
                  (when implemented)
                </li>
                <li>
                  <strong>Vercel:</strong> For hosting and infrastructure
                </li>
              </ul>
              <p className="mt-4">
                We do not sell your personal information to third parties. We
                only share data necessary to provide our services and comply
                with legal obligations.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your
              personal information, including encryption, secure data storage,
              and regular security assessments. However, no method of
              transmission over the internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your Rights and Choices
            </h2>
            <div className="space-y-2 text-gray-700 leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your account and associated data</li>
                <li>Disconnect your Strava account at any time</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data Retention
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as your account is
              active or as needed to provide our services. If you delete your
              account, we will remove your personal information within 30 days,
              except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Giving the Distance is not intended for children under 13 years of
              age. We do not knowingly collect personal information from
              children under 13. If you believe we have collected information
              from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new Privacy
              Policy on this page and updating the &quot;Last Updated&quot;
              date. Your continued use of our services after any changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions or concerns about this Privacy Policy or
              our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900 font-medium">Giving the Distance</p>
              <p className="text-gray-600">
                Email: privacy@givingthedistance.org
              </p>
            </div>
          </section>

          <section className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              By using Giving the Distance, you acknowledge that you have read
              and understood this Privacy Policy and agree to its terms.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

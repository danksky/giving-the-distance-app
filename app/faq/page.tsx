import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FAQ - Giving the Distance",
  description:
    "Frequently asked questions about Giving the Distance, currently focused on the New York City community, and connecting your Strava account.",
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <Navbar />

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="card bg-base-100">
          <div className="card-body prose max-w-none">
            <h1 className="card-title text-3xl">Frequently Asked Questions</h1>

            <div className="space-y-8">
              {/* About Giving the Distance */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  What is Giving the Distance?
                </h2>
                <p className="leading-relaxed">
                  Giving the Distance is a charitable platform that connects
                  your athletic activities with meaningful donations to verified
                  charities. When you complete activities on Strava, supporters
                  can make donations inspired by your achievements. We help you
                  turn every mile, kilometer, and workout into an opportunity to
                  support causes you care about. Right now, the initiative is
                  focused on the New York City community as we continue to grow.
                </p>
              </section>

              {/* Connecting Strava */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Connecting Your Strava Account
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      How do I connect my Strava account?
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 ml-4 leading-relaxed">
                      <li>
                        Sign in to Giving the Distance with your Google account
                      </li>
                      <li>
                        Go to your{" "}
                        <Link
                          href="/settings/strava"
                          className="link link-primary"
                        >
                          Strava Settings
                        </Link>
                      </li>
                      <li>Click &quot;Connect to Strava&quot;</li>
                      <li>
                        You&apos;ll be redirected to Strava to authorize the
                        connection
                      </li>
                      <li>
                        Click &quot;Authorize&quot; to grant the required
                        permissions
                      </li>
                      <li>
                        You&apos;ll be redirected back and your account will be
                        connected!
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      What happens after I connect?
                    </h3>
                    <p className="leading-relaxed">
                      Once connected, Giving the Distance will automatically
                      track your new activities from Strava. When supporters
                      make donations inspired by your activities, we&apos;ll add
                      a donation message to your activity description so you can
                      see the impact you&apos;re making.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      How do I disconnect my Strava account?
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 ml-4 leading-relaxed">
                      <li>
                        Go to your{" "}
                        <Link
                          href="/settings/strava"
                          className="link link-primary"
                        >
                          Strava Settings
                        </Link>
                      </li>
                      <li>
                        Scroll to the bottom and click &quot;Disconnect Strava
                        Account&quot;
                      </li>
                      <li>
                        Your Strava account will be disconnected immediately
                      </li>
                      <li>
                        We will stop tracking new activities, but your existing
                        activity history will be preserved
                      </li>
                    </ol>
                  </div>
                </div>
              </section>

              {/* Permissions */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Strava Permissions
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      What permissions does Giving the Distance need?
                    </h3>
                    <p className="leading-relaxed mb-4">
                      We request three specific permissions from Strava:
                    </p>
                    <div className="space-y-4">
                      <div className="bg-base-200 p-4 rounded-lg">
                        <h4 className="font-semibold mb-1">
                          1. Read All Activities
                        </h4>
                        <p className="text-sm leading-relaxed">
                          <strong>Why we need it:</strong> To view and track
                          your workout data so we can connect your athletic
                          achievements with charitable donations. This allows us
                          to show supporters your progress and help you make a
                          greater impact.
                        </p>
                      </div>
                      <div className="bg-base-200 p-4 rounded-lg">
                        <h4 className="font-semibold mb-1">
                          2. Read Profile Information
                        </h4>
                        <p className="text-sm leading-relaxed">
                          <strong>Why we need it:</strong> To display your
                          athlete information and create your Giving the
                          Distance profile. This helps supporters connect with
                          you and learn about the causes you&apos;re supporting.
                        </p>
                      </div>
                      <div className="bg-base-200 p-4 rounded-lg">
                        <h4 className="font-semibold mb-1">
                          3. Update Activities
                        </h4>
                        <p className="text-sm leading-relaxed">
                          <strong>Why we need it:</strong> To add donation
                          messages to your Strava activity descriptions. When
                          someone makes a donation inspired by your activity,
                          we&apos;ll update your activity description to show
                          the charitable impact. You can see exactly how your
                          efforts are helping the causes you care about.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Can I grant only some of these permissions?
                    </h3>
                    <p className="leading-relaxed">
                      No. Strava uses an &quot;all-or-nothing&quot; permission
                      model. When you click &quot;Authorize&quot; on Strava, all
                      requested permissions are granted. If you click
                      &quot;Cancel&quot;, no permissions are granted and the
                      connection will fail. All three permissions are required
                      for Giving the Distance to function properly.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      What if I accidentally denied permissions?
                    </h3>
                    <p className="leading-relaxed">
                      No problem! Simply go to your{" "}
                      <Link
                        href="/settings/strava"
                        className="link link-primary"
                      >
                        Strava Settings
                      </Link>{" "}
                      and click &quot;Connect to Strava&quot; again. Make sure
                      to click &quot;Authorize&quot; when prompted by Strava to
                      grant all requested permissions.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      How is my Strava data used?
                    </h3>
                    <p className="leading-relaxed">
                      Your Strava data is used exclusively to provide our
                      charitable donation services. We track your activities to
                      connect them with donations, display your athletic
                      progress, and add donation messages to your activities. We
                      never sell your data or use it for purposes unrelated to
                      charitable giving. For more details, see our{" "}
                      <Link href="/privacy" className="link link-primary">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </section>

              {/* Account & Settings */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Account &amp; Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      How do I choose which charity to support?
                    </h3>
                    <p className="leading-relaxed">
                      You can select your preferred charity in your{" "}
                      <Link
                        href="/settings/charity"
                        className="link link-primary"
                      >
                        Charity Settings
                      </Link>
                      . All verified charities on our platform are vetted
                      organizations making a real difference. You can change
                      your charity selection at any time.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Do I need to pay anything to use Giving the Distance?
                    </h3>
                    <p className="leading-relaxed">
                      No! Giving the Distance is completely free for athletes.
                      Our platform connects your activities with charitable
                      donations from supporters who are inspired by your
                      athletic achievements.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Can I delete my account?
                    </h3>
                    <p className="leading-relaxed">
                      Yes. You can delete your account at any time from your{" "}
                      <Link href="/settings" className="link link-primary">
                        Settings
                      </Link>{" "}
                      page. For information about what happens to your data,
                      please see our{" "}
                      <Link href="/privacy" className="link link-primary">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </section>

              {/* Technical Issues */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Technical Issues
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      My activities aren&apos;t showing up. What should I do?
                    </h3>
                    <p className="leading-relaxed mb-2">
                      Try these troubleshooting steps:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4 leading-relaxed">
                      <li>
                        Make sure your Strava account is connected in your{" "}
                        <Link
                          href="/settings/strava"
                          className="link link-primary"
                        >
                          Strava Settings
                        </Link>
                      </li>
                      <li>
                        Check that the activity was recorded on Strava (we only
                        sync activities from Strava)
                      </li>
                      <li>
                        Wait a few minutes - new activities may take a moment to
                        sync
                      </li>
                      <li>
                        Try disconnecting and reconnecting your Strava account
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      I&apos;m getting an error when connecting to Strava
                    </h3>
                    <p className="leading-relaxed">
                      If you see an error message when connecting, make sure
                      you&apos;re clicking &quot;Authorize&quot; on the Strava
                      permission screen and granting all requested permissions.
                      If the problem persists, try signing out of both Strava
                      and Giving the Distance, then signing back in and trying
                      again.
                    </p>
                  </div>
                </div>
              </section>

              {/* Privacy */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Privacy &amp; Security
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Is my data secure?
                    </h3>
                    <p className="leading-relaxed">
                      Yes. We implement industry-standard security measures to
                      protect your personal information, including encryption
                      and secure data storage. For complete details about how we
                      protect and use your data, please see our{" "}
                      <Link href="/privacy" className="link link-primary">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Who can see my activities?
                    </h3>
                    <p className="leading-relaxed">
                      Activity visibility on Giving the Distance follows your
                      Strava privacy settings. For more information about
                      privacy controls, please see our{" "}
                      <Link href="/privacy" className="link link-primary">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Do you share my data with third parties?
                    </h3>
                    <p className="leading-relaxed">
                      We do not sell your personal information. We only share
                      data necessary to provide our charitable donation
                      services. For complete details, please see our{" "}
                      <Link href="/privacy" className="link link-primary">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section className="pt-6 border-t border-base-300">
                <h2 className="text-2xl font-semibold mb-4">
                  Still have questions?
                </h2>
                <p className="leading-relaxed mb-4">
                  We&apos;re here to help! If you have additional questions or
                  need support, please contact us:
                </p>
                <div className="bg-base-200 p-4 rounded-lg">
                  <p className="font-medium">Giving the Distance Support</p>
                  <p>Email: support@givingthedistance.org</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

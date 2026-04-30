import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import Navbar from "@/components/Navbar";
import PrivacySettingsForm from "@/components/PrivacySettingsForm";
import { getUserPrivacyDefaultsByEmail } from "@/lib/user-privacy";

export default async function PrivacySettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });

  if (!user) {
    redirect("/");
  }

  const privacyDefaults = await getUserPrivacyDefaultsByEmail(session.user.email!);

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold">Privacy</h1>
          <Link href="/settings" className="btn btn-outline btn-sm w-fit">
            ← Back to Settings
          </Link>
        </div>

        <div className="alert alert-info mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 shrink-0 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <div className="font-semibold">Choose your defaults</div>
            <div className="text-sm">
              This controls how new activity pages are shared. Existing
              activities keep their current setting unless you change them on
              the activity page.
            </div>
          </div>
        </div>

        <PrivacySettingsForm
          initialDefaultActivityIsPublic={privacyDefaults.defaultActivityIsPublic}
          initialDefaultActivityMapIsPublic={
            privacyDefaults.defaultActivityMapIsPublic
          }
        />
      </main>
    </div>
  );
}

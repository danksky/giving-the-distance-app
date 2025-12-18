import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import RotatingText from "@/components/RotatingText";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="text-center px-4 w-full max-w-2xl">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Image
            src="/icon.png"
            alt="Giving the Distance Logo"
            width={64}
            height={64}
            className="w-16 h-16"
          />
          <h1 className="text-5xl font-bold font-[family-name:var(--font-outfit)]">
            Giving the Distance
          </h1>
        </div>

        <RotatingText />

        {session?.user ? (
          <div className="space-y-4 mt-6">
            <div className="bg-base-100 border border-gray-300 rounded py-3 px-6 text-base-content mx-auto">
              <span>
                Welcome back, <strong>{session.user.name}</strong>!
              </span>
            </div>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
              <Link href="/api/auth/signout" className="btn btn-ghost">
                Sign Out
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            <Link href="/signin" className="btn btn-primary btn-lg">
              Get Started
            </Link>
            <p className="text-sm opacity-70">
              Sign in with Google to connect your Strava account
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

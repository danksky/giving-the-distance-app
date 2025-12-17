import { auth } from "@/auth";
import Link from "next/link";
import RotatingText from "@/components/RotatingText";

export default async function Home() {
  const session = await auth();

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold">Giving the Distance</h1>

          <RotatingText />

          {session?.user ? (
            <div className="space-y-4">
              <div className="bg-base-100 border border-gray-300 rounded py-3 px-6 text-base-content">
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
            <div className="space-y-4">
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
    </div>
  );
}

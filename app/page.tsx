import { auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <main className="max-w-2xl w-full px-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Giving the Distance
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          Connect your Strava account and turn every mile into meaningful
          impact.
        </p>

        {session?.user ? (
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              Welcome back,{" "}
              <span className="font-semibold">{session.user.name}</span>!
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/api/auth/signout"
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
              >
                Sign Out
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Link
              href="/signin"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Sign in with Google to connect your Strava account
            </p>
          </div>
        )}
      </main>

      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>
          © {new Date().getFullYear()} Giving the Distance. Building something
          great.
        </p>
      </footer>
    </div>
  );
}

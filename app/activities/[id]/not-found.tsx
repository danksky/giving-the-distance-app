import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl mb-4">Activity Not Found</h2>
        <p className="mb-8 text-base-content/70">
          The activity you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
          <Link href="/" className="btn btn-ghost">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

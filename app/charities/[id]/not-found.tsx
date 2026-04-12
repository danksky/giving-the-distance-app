import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Charity Not Found</h1>
        <p className="mb-8 text-base-content/70">
          The charity profile you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
          <Link href="/settings/charity" className="btn btn-ghost">
            Manage Charities
          </Link>
        </div>
      </div>
    </div>
  );
}

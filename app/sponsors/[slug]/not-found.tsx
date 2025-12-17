import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Sponsor Profile Not Found</h1>
        <p className="text-lg mb-6">
          The sponsor profile you're looking for doesn't exist.
        </p>
        <Link href="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  );
}

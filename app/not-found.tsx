import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <div
        className="flex-1 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/landing-runners-hero.jpg')" }}
      >
        <div className="min-h-screen bg-slate-950/60">
          <Navbar />

          <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 sm:px-6">
            <div className="w-full max-w-3xl rounded-3xl border border-white/15 bg-white/12 p-8 text-center shadow-2xl backdrop-blur-md sm:p-12">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-white/70">
                404 Error
              </p>
              <h1 className="mb-5 text-4xl font-bold sm:text-5xl md:text-6xl">
                That page ran off course
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
                The page you were looking for could not be found. Head back
                home to keep turning miles into impact.
              </p>

              <div className="flex justify-center">
                <Link href="/" className="btn btn-primary btn-lg min-w-44">
                  Go Home
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

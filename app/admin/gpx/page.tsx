"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GPXStatistics {
  total: number;
  withGPX: number;
  withoutGPX: number;
  manual: number;
  coverage: string;
}

interface BackfillResult {
  processed: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ activityId: string; error: string }>;
}

export default function GPXManagementPage() {
  const router = useRouter();
  const [stats, setStats] = useState<GPXStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(
    null
  );
  const [backfillLimit, setBackfillLimit] = useState<string>("10");
  const [dryRun, setDryRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, []);

  async function loadStatistics() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/gpx-backfill");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/signin");
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setStats(data.statistics);
    } catch (err) {
      console.error("Error loading statistics:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load statistics"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBackfill() {
    try {
      setIsBackfilling(true);
      setError(null);
      setBackfillResult(null);

      const response = await fetch("/api/admin/gpx-backfill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: backfillLimit ? parseInt(backfillLimit) : undefined,
          dryRun,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/signin");
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setBackfillResult(data.result);

      // Reload statistics after backfill
      if (!dryRun && data.result.success > 0) {
        await loadStatistics();
      }
    } catch (err) {
      console.error("Error running backfill:", err);
      setError(err instanceof Error ? err.message : "Backfill failed");
    } finally {
      setIsBackfilling(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100 border-b border-base-300">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">
            Giving the Distance
          </Link>
        </div>
      </div>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/admin" className="btn btn-ghost btn-sm">
              ← Back to Admin
            </Link>
          </div>
          <h1 className="text-3xl font-bold">GPX Management</h1>
          <p className="text-base-content/60 mt-2">
            View GPX file statistics and backfill missing route data
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Statistics Card */}
        <div className="card bg-base-100 mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">GPX Statistics</h2>
              <button
                onClick={loadStatistics}
                className="btn btn-sm btn-ghost"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "↻ Refresh"
                )}
              </button>
            </div>

            {isLoading && !stats ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-title text-sm">Total Activities</div>
                  <div className="stat-value text-3xl">{stats.total}</div>
                </div>

                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-title text-sm">With GPX</div>
                  <div className="stat-value text-3xl text-success">
                    {stats.withGPX}
                  </div>
                </div>

                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-title text-sm">Without GPX</div>
                  <div className="stat-value text-3xl text-warning">
                    {stats.withoutGPX}
                  </div>
                </div>

                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-title text-sm">Manual</div>
                  <div className="stat-value text-3xl text-base-content/40">
                    {stats.manual}
                  </div>
                  <div className="stat-desc text-xs">No GPS data</div>
                </div>

                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-title text-sm">Coverage</div>
                  <div className="stat-value text-3xl text-primary">
                    {stats.coverage}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Backfill Card */}
        <div className="card bg-base-100 mb-6">
          <div className="card-body">
            <h2 className="card-title">Run Backfill</h2>
            <p className="text-sm text-base-content/60 mb-4">
              Download and store GPX files for activities that don&apos;t have
              them yet. This will fetch GPS data from Strava and store it in
              Vercel Blob Storage.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Limit (activities)</span>
                </label>
                <input
                  type="number"
                  value={backfillLimit}
                  onChange={(e) => setBackfillLimit(e.target.value)}
                  className="input input-bordered"
                  placeholder="10"
                  min="1"
                  max="1000"
                  disabled={isBackfilling}
                />
                <label className="label">
                  <span className="label-text-alt">
                    Max number of activities to process
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="checkbox"
                    disabled={isBackfilling}
                  />
                  <span className="label-text">Dry Run</span>
                </label>
                <label className="label">
                  <span className="label-text-alt">
                    Preview what would be processed without making changes
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={handleBackfill}
              className="btn btn-primary"
              disabled={isBackfilling || stats?.withoutGPX === 0}
            >
              {isBackfilling ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Running Backfill...
                </>
              ) : (
                <>Run Backfill</>
              )}
            </button>

            {stats?.withoutGPX === 0 && (
              <div className="alert alert-success mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>All activities have GPX files!</span>
              </div>
            )}
          </div>
        </div>

        {/* Backfill Results */}
        {backfillResult && (
          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title">
                {dryRun ? "Dry Run Results" : "Backfill Results"}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Processed</div>
                  <div className="stat-value text-2xl">
                    {backfillResult.processed}
                  </div>
                </div>

                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Success</div>
                  <div className="stat-value text-2xl text-success">
                    {backfillResult.success}
                  </div>
                </div>

                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Skipped</div>
                  <div className="stat-value text-2xl text-warning">
                    {backfillResult.skipped}
                  </div>
                </div>

                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Failed</div>
                  <div className="stat-value text-2xl text-error">
                    {backfillResult.failed}
                  </div>
                </div>
              </div>

              {backfillResult.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Errors:</h3>
                  <div className="max-h-60 overflow-y-auto">
                    {backfillResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-error mb-1 font-mono"
                      >
                        {err.activityId}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dryRun && (
                <div className="alert alert-info mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>
                    This was a dry run. No changes were made to the database.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documentation */}
        <div className="card bg-base-100 mt-6">
          <div className="card-body">
            <h2 className="card-title">Documentation</h2>
            <div className="space-y-2">
              <a
                href="/GPX-STORAGE.md"
                target="_blank"
                className="link link-primary block"
              >
                → GPX Storage Documentation
              </a>
              <a
                href="/GPX-QUICK-START.md"
                target="_blank"
                className="link link-primary block"
              >
                → GPX Quick Start Guide
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

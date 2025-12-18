"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import of Leaflet to avoid SSR issues
const MapComponent = dynamic(() => import("./ActivityMapClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-base-200 rounded-lg flex items-center justify-center">
      <div className="loading loading-spinner loading-lg"></div>
    </div>
  ),
});

interface ActivityMapProps {
  gpxBlobUrl: string;
  activityName: string;
}

/**
 * Activity Map Component (Owner Only)
 *
 * Displays a map with the activity route from GPX data.
 * Only visible to the activity owner.
 */
export default function ActivityMap({
  gpxBlobUrl,
  activityName,
}: ActivityMapProps) {
  const [gpxData, setGpxData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGPX() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(gpxBlobUrl);

        if (!response.ok) {
          throw new Error(`Failed to load GPX: ${response.status}`);
        }

        const gpxText = await response.text();
        setGpxData(gpxText);
      } catch (err) {
        console.error("Error fetching GPX:", err);
        setError(err instanceof Error ? err.message : "Failed to load route");
      } finally {
        setIsLoading(false);
      }
    }

    fetchGPX();
  }, [gpxBlobUrl]);

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-base-200 rounded-lg flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>Unable to load route map: {error}</span>
      </div>
    );
  }

  if (!gpxData) {
    return null;
  }

  return <MapComponent gpxData={gpxData} activityName={activityName} />;
}

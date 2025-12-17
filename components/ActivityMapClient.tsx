"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ActivityMapClientProps {
  gpxData: string;
  activityName: string;
}

/**
 * Client-side map component that renders GPX data
 * Separated from ActivityMap to handle SSR properly
 */
export default function ActivityMapClient({
  gpxData,
  activityName,
}: ActivityMapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Parse GPX data
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(gpxData, "text/xml");
    const trackPoints = gpxDoc.querySelectorAll("trkpt");

    if (trackPoints.length === 0) {
      console.warn("No track points found in GPX");
      return;
    }

    // Extract coordinates from GPX
    const coordinates: [number, number][] = [];
    trackPoints.forEach((point) => {
      const lat = parseFloat(point.getAttribute("lat") || "0");
      const lon = parseFloat(point.getAttribute("lon") || "0");
      if (lat && lon) {
        coordinates.push([lat, lon]);
      }
    });

    if (coordinates.length === 0) {
      console.warn("No valid coordinates found");
      return;
    }

    // Initialize map
    const map = L.map(mapRef.current, {
      attributionControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create polyline for the route
    const polyline = L.polyline(coordinates, {
      color: "#8B4ACC", // Brand purple color
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1,
    }).addTo(map);

    // Add start marker
    const startIcon = L.divIcon({
      className: "custom-div-icon",
      html: `
        <div style="
          background-color: #10b981;
          border: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker(coordinates[0], { icon: startIcon })
      .addTo(map)
      .bindPopup("<b>Start</b>");

    // Add finish marker
    const finishIcon = L.divIcon({
      className: "custom-div-icon",
      html: `
        <div style="
          background-color: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker(coordinates[coordinates.length - 1], { icon: finishIcon })
      .addTo(map)
      .bindPopup("<b>Finish</b>");

    // Fit map to show entire route
    map.fitBounds(polyline.getBounds(), {
      padding: [50, 50],
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gpxData, activityName]);

  return (
    <div
      ref={mapRef}
      className="w-full h-96 rounded-lg overflow-hidden border border-base-300"
      style={{ zIndex: 0 }}
    />
  );
}

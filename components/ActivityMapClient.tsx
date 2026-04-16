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
      scrollWheelZoom: false,
    });

    mapInstanceRef.current = map;

    // Use a cleaner street basemap that feels closer to Google Maps.
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
        subdomains: "abcd",
      }
    ).addTo(map);

    // Add a soft white casing so the route stands out on busier streets.
    L.polyline(coordinates, {
      color: "#ffffff",
      weight: 9,
      opacity: 0.9,
      smoothFactor: 1,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    // Main route line in the product's purple brand color.
    const polyline = L.polyline(coordinates, {
      color: "#8B4ACC",
      weight: 5,
      opacity: 0.95,
      smoothFactor: 1,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    const createMarkerIcon = (fillColor: string) =>
      L.divIcon({
        className: "activity-map-marker",
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 9999px;
            background: ${fillColor};
            border: 3px solid rgba(255, 255, 255, 0.95);
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.22);
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

    // Add start marker
    L.marker(coordinates[0], { icon: createMarkerIcon("#22c55e") })
      .addTo(map)
      .bindPopup("<b>Start</b>");

    // Add finish marker
    L.marker(coordinates[coordinates.length - 1], {
      icon: createMarkerIcon("#f97316"),
    })
      .addTo(map)
      .bindPopup("<b>Finish</b>");

    map.on("popupopen", () => {
      mapRef.current?.focus();
    });

    // Fit map to show entire route
    map.fitBounds(polyline.getBounds(), {
      padding: [36, 36],
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
      className="activity-route-map w-full h-96 overflow-hidden rounded-lg border border-base-300"
      style={{ zIndex: 0 }}
      aria-label={`${activityName} route map`}
      tabIndex={-1}
    />
  );
}

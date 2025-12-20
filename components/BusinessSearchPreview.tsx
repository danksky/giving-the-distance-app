"use client";

import { useState, useRef, useEffect } from "react";
import ActivityPostMock from "./ActivityPostMock";
import { useRouter } from "next/navigation";

interface BusinessSearchPreviewProps {
  apiKey: string;
}

// Track if we've already loaded the API
let isGoogleMapsLoaded = false;
let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is undefined"));
      return;
    }

    if (window.google?.maps) {
      isGoogleMapsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    (window as any).initGoogleMaps = () => {
      isGoogleMapsLoaded = true;
      delete (window as any).initGoogleMaps;
      resolve();
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google Maps script"));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export default function BusinessSearchPreview({
  apiKey,
}: BusinessSearchPreviewProps) {
  const [businessName, setBusinessName] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const initAutocomplete = async () => {
      if (!apiKey || !inputRef.current) return;

      try {
        // Load Google Maps script
        await loadGoogleMapsScript(apiKey);

        if (!inputRef.current || !window.google?.maps?.places) return;

        const autocomplete = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            componentRestrictions: { country: "us" },
            fields: ["name", "formatted_address", "place_id", "geometry"],
            types: ["establishment"],
          }
        );

        // Bias to New York City area
        const nycBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(40.477399, -74.25909),
          new google.maps.LatLng(40.917577, -73.700272)
        );
        autocomplete.setBounds(nycBounds);

        autocomplete.addListener("place_changed", async () => {
          const place = autocomplete.getPlace();

          if (!place.name || !place.formatted_address) {
            return;
          }

          const businessName = place.name;
          const businessLocation = place.formatted_address;
          const placeId = place.place_id || "";

          setBusinessName(businessName);
          setBusinessLocation(businessLocation);
          setPlaceId(placeId);
          setIsButtonEnabled(true);

          // Send notification to Slack about the place selection
          if (placeId) {
            try {
              await fetch("/api/google-place-selection", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  businessName,
                  businessLocation,
                  placeId,
                }),
              });
            } catch (error) {
              // Fail silently - don't break user experience if Slack notification fails
              console.error(
                "Failed to send place selection notification:",
                error
              );
            }
          }
        });
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initAutocomplete();
  }, [apiKey]);

  const handlePreviewClick = () => {
    if (businessName && placeId) {
      // Encode the business data to pass to preview page
      const params = new URLSearchParams({
        name: businessName,
        location: businessLocation,
        placeId: placeId,
      });
      router.push(`/sponsors/preview?${params.toString()}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="card bg-white border border-[#e5e7eb] shadow-lg overflow-hidden">
        <div className="card-body p-8">
          <h2 className="text-3xl font-bold mb-2 text-center">
            See how your business would appear
          </h2>
          <p className="text-center text-[#6b7280] mb-8">
            Search for your business to see a preview
          </p>

          {/* Search Input */}
          <div className="mb-6">
            <label
              htmlFor="business-search"
              className="block text-sm font-semibold text-[#374151] mb-2"
            >
              Search for your business
            </label>
            <input
              ref={inputRef}
              type="text"
              id="business-search"
              placeholder="e.g., Joe's Coffee Shop, Brooklyn"
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#B56DFF] focus:border-transparent outline-none transition-all text-[15px]"
            />
            <p className="text-xs text-[#6b7280] mt-2">
              Start typing to see suggestions
            </p>
          </div>

          {/* Preview Button */}
          <button
            onClick={handlePreviewClick}
            disabled={!isButtonEnabled}
            className={`btn btn-lg w-full mb-8 transition-all ${
              isButtonEnabled
                ? "btn-primary"
                : "bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
            }`}
          >
            {isButtonEnabled
              ? "Preview your sponsor profile →"
              : "Select a business to continue"}
          </button>

          {/* Mock Preview */}
          {businessName && (
            <div className="border-t border-[#e5e7eb] pt-8">
              <p className="text-sm font-semibold text-[#6b7280] mb-4 text-center">
                PREVIEW: How your business appears on athlete activities
              </p>
              <ActivityPostMock
                businessName={businessName}
                businessLocation={businessLocation}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

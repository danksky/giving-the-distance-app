"use client";

import { useState } from "react";
import Link from "next/link";

interface ActivityPrivacyToggleProps {
  activityId: string;
  initialIsPublic: boolean;
  initialIsPublicRouteMap: boolean;
  hasRouteMap: boolean;
}

type VisibilityField = "isPublicProfile" | "isPublicRouteMap";

export default function ActivityPrivacyToggle({
  activityId,
  initialIsPublic,
  initialIsPublicRouteMap,
  hasRouteMap,
}: ActivityPrivacyToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPublicRouteMap, setIsPublicRouteMap] = useState(
    initialIsPublicRouteMap
  );
  const [updatingField, setUpdatingField] = useState<VisibilityField | null>(
    null
  );

  const handleToggle = async (field: VisibilityField, checked: boolean) => {
    setUpdatingField(field);

    try {
      const response = await fetch(`/api/activities/${activityId}/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: checked }),
      });

      if (!response.ok) {
        throw new Error("Failed to update visibility");
      }

      if (field === "isPublicProfile") {
        setIsPublic(checked);
      } else {
        setIsPublicRouteMap(checked);
      }
    } catch (error) {
      console.error("Error updating activity visibility:", error);
      alert("Failed to update visibility setting");
    } finally {
      setUpdatingField(null);
    }
  };

  return (
    <div className="card bg-base-100 mb-6">
      <div className="card-body">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="card-title">Visibility</h3>
            <p className="text-sm text-base-content/60">
              These controls affect this activity only.
            </p>
          </div>
          <Link href="/settings/privacy" className="link link-hover text-sm">
            Manage defaults
          </Link>
        </div>

        <div className="divide-y divide-base-300">
          <label className="flex cursor-pointer items-start justify-between gap-4 py-4">
            <div className="min-w-0 pr-4">
              <div className="font-semibold">Activity page</div>
              <p className="mt-1 text-sm text-base-content/60">
                Controls your name and activity title on this page.
              </p>
              <p className="mt-2 text-xs font-medium text-base-content/50">
                {isPublic ? "Public" : "Private"}
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary mt-1 flex-shrink-0"
              checked={isPublic}
              onChange={(e) =>
                handleToggle("isPublicProfile", e.target.checked)
              }
              disabled={updatingField !== null}
              aria-label="Toggle activity page visibility"
            />
          </label>

          <label
            className={`flex items-start justify-between gap-4 py-4 ${
              hasRouteMap ? "cursor-pointer" : "opacity-60"
            }`}
          >
            <div className="min-w-0 pr-4">
              <div className="font-semibold">Route map</div>
              <p className="mt-1 text-sm text-base-content/60">
                {hasRouteMap
                  ? "Controls whether the route map appears on the public activity page."
                  : "No route map is available for this activity yet."}
              </p>
              {hasRouteMap && (
                <p className="mt-2 text-xs font-medium text-base-content/50">
                  {isPublicRouteMap ? "Shared" : "Only you"}
                </p>
              )}
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary mt-1 flex-shrink-0"
              checked={isPublicRouteMap}
              onChange={(e) =>
                handleToggle("isPublicRouteMap", e.target.checked)
              }
              disabled={!hasRouteMap || updatingField !== null}
              aria-label="Toggle route map visibility"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

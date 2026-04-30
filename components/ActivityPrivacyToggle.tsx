"use client";

import { useState } from "react";
import Link from "next/link";
import { anonymizeName } from "@/lib/activity-privacy";

interface ActivityPrivacyToggleProps {
  activityId: string;
  userName: string | null;
  initialIsPublic: boolean;
}

export default function ActivityPrivacyToggle({
  activityId,
  userName,
  initialIsPublic,
}: ActivityPrivacyToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isUpdating, setIsUpdating] = useState(false);
  const anonymized = anonymizeName(userName);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/activities/${activityId}/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: checked }),
      });

      if (response.ok) {
        setIsPublic(checked);
        // Reload to update the UI
        window.location.reload();
      } else {
        alert("Failed to update privacy setting");
      }
    } catch (error) {
      console.error("Error updating privacy:", error);
      alert("Failed to update privacy setting");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="card bg-base-100 mb-6">
      <div className="card-body">
        <h3 className="card-title mb-2">Privacy Settings</h3>
        <p className="text-sm text-base-content/70 mb-4">
          Control who can see your name, profile picture, and activity title on
          this activity. When private, visitors will see an anonymized name
          (like &quot;{anonymized}&quot;), a generic activity title, and a generic
          avatar. Your account defaults for new activities and route-map
          sharing live in{" "}
          <Link href="/settings/privacy" className="link link-hover">
            Privacy Settings
          </Link>
          .
        </p>
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={isPublic}
              onChange={(e) => handleToggle(e.target.checked)}
              disabled={isUpdating}
            />
            <div>
              <span className="label-text font-semibold">
                Public activity details
              </span>
              <p className="text-xs text-base-content/60 mt-1">
                {isPublic
                  ? "Currently, visitors can see your name and the real activity title."
                  : "Currently, this activity shows an anonymized athlete name and a generalized title."}
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

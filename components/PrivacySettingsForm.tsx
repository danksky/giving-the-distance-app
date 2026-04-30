"use client";

import { useState } from "react";
import Link from "next/link";

interface PrivacySettingsFormProps {
  initialDefaultActivityIsPublic: boolean;
  initialDefaultActivityMapIsPublic: boolean;
}

export default function PrivacySettingsForm({
  initialDefaultActivityIsPublic,
  initialDefaultActivityMapIsPublic,
}: PrivacySettingsFormProps) {
  const [defaultActivityIsPublic, setDefaultActivityIsPublic] = useState(
    initialDefaultActivityIsPublic
  );
  const [defaultActivityMapIsPublic, setDefaultActivityMapIsPublic] = useState(
    initialDefaultActivityMapIsPublic
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/user/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultActivityIsPublic,
          defaultActivityMapIsPublic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update privacy settings");
      }

      setStatusMessage("Privacy defaults updated.");
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      setErrorMessage("Failed to update privacy settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-2xl">Activity Privacy Defaults</h2>
          <p className="text-sm text-base-content/70">
            These defaults apply to newly imported activities. You can still
            override a specific activity on its detail page.
          </p>

          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-base-300 bg-base-50 p-4">
              <input
                type="checkbox"
                className="checkbox checkbox-primary mt-1 flex-shrink-0"
                checked={defaultActivityIsPublic}
                onChange={(e) => setDefaultActivityIsPublic(e.target.checked)}
                disabled={isSaving}
              />
              <div className="min-w-0">
                <div className="font-semibold">
                  Public activity details by default
                </div>
                <p className="mt-1 text-sm text-base-content/60">
                  New activity pages will show your name and the real activity
                  title unless you turn this off.
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-base-300 bg-base-50 p-4">
              <input
                type="checkbox"
                className="checkbox checkbox-primary mt-1 flex-shrink-0"
                checked={defaultActivityMapIsPublic}
                onChange={(e) =>
                  setDefaultActivityMapIsPublic(e.target.checked)
                }
                disabled={isSaving}
              />
              <div className="min-w-0">
                <div className="text-lg font-semibold">
                  Share route maps on public activity pages
                </div>
                <p className="mt-1 text-sm text-base-content/60">
                  When enabled, route maps appear on public activity pages for
                  activities that are also public.
                </p>
              </div>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-base-content/60">
              Per-activity overrides stay available on each activity page.
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/settings" className="btn btn-outline">
                Back to Settings
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Privacy Settings"}
              </button>
            </div>
          </div>

          {statusMessage && (
            <div role="alert" className="alert alert-success mt-4">
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div role="alert" className="alert alert-error mt-4">
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

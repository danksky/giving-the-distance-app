"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CharityLogo from "@/components/CharityLogo";

type CharityRecord = {
  id: string;
  name: string;
  fullName: string;
  description: string;
  category: string;
  logoUrl: string | null;
  website: string;
  charityNavigatorScore: number;
  isDefault: boolean;
};

type CharityFormState = {
  id: string;
  name: string;
  fullName: string;
  description: string;
  category: string;
  logoUrl: string;
  website: string;
  charityNavigatorScore: string;
  isDefault: boolean;
};

function toFormState(charity?: CharityRecord): CharityFormState {
  return {
    id: charity?.id ?? "",
    name: charity?.name ?? "",
    fullName: charity?.fullName ?? "",
    description: charity?.description ?? "",
    category: charity?.category ?? "",
    logoUrl: charity?.logoUrl ?? "",
    website: charity?.website ?? "",
    charityNavigatorScore:
      charity?.charityNavigatorScore?.toString() ?? "0",
    isDefault: charity?.isDefault ?? false,
  };
}

function slugifyId(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function FieldShell({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-base-content/80">
          {label}
        </label>
        {hint ? (
          <p className="text-xs leading-relaxed text-base-content/50">{hint}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function CharityFields({
  form,
  setForm,
  isCreate,
  disabled,
}: {
  form: CharityFormState;
  setForm: Dispatch<SetStateAction<CharityFormState>>;
  isCreate: boolean;
  disabled: boolean;
}) {
  const inputClassName = `input w-full ${
    isCreate
      ? "border-2 border-base-300 bg-base-100 shadow-none focus:border-primary"
      : "input-bordered"
  }`;

  const textareaClassName = `textarea min-h-32 w-full leading-relaxed ${
    isCreate
      ? "border-2 border-base-300 bg-base-100 shadow-none focus:border-primary"
      : "textarea-bordered"
  }`;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <FieldShell
        label="ID"
        hint={
          isCreate
            ? "Stable slug used as the primary key."
            : "IDs stay fixed after creation."
        }
      >
        <div className="join">
          <input
            type="text"
            value={form.id}
            onChange={(e) =>
              setForm((current) => ({ ...current, id: e.target.value }))
            }
            className={`${inputClassName} join-item`}
            placeholder="feeding-america"
            disabled={!isCreate || disabled}
          />
          {isCreate && (
            <button
              type="button"
              className="btn join-item"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  id: slugifyId(current.name || current.fullName),
                }))
              }
              disabled={disabled}
            >
              Auto
            </button>
          )}
        </div>
      </FieldShell>

      <FieldShell label="Display name">
        <input
          type="text"
          value={form.name}
          onChange={(e) =>
            setForm((current) => ({ ...current, name: e.target.value }))
          }
          className={inputClassName}
          placeholder="Feeding America"
          disabled={disabled}
        />
      </FieldShell>

      <FieldShell label="Full legal name" className="md:col-span-2">
        <input
          type="text"
          value={form.fullName}
          onChange={(e) =>
            setForm((current) => ({ ...current, fullName: e.target.value }))
          }
          className={inputClassName}
          placeholder="Feeding America"
          disabled={disabled}
        />
      </FieldShell>

      <FieldShell label="Category">
        <input
          type="text"
          value={form.category}
          onChange={(e) =>
            setForm((current) => ({ ...current, category: e.target.value }))
          }
          className={inputClassName}
          placeholder="Food Banks, Food, and Nutrition Programs"
          disabled={disabled}
        />
      </FieldShell>

      <FieldShell label="Charity Navigator score">
        <input
          type="number"
          min="0"
          max="100"
          value={form.charityNavigatorScore}
          onChange={(e) =>
            setForm((current) => ({
              ...current,
              charityNavigatorScore: e.target.value,
            }))
          }
          className={inputClassName}
          disabled={disabled}
        />
      </FieldShell>

      <FieldShell label="Website" className="md:col-span-2">
        <input
          type="url"
          value={form.website}
          onChange={(e) =>
            setForm((current) => ({ ...current, website: e.target.value }))
          }
          className={inputClassName}
          placeholder="https://www.feedingamerica.org/"
          disabled={disabled}
        />
      </FieldShell>

      <FieldShell
        label="Logo URL"
        hint="Use a local app path or a remote https URL. Remote logos are proxied and cached by the app."
        className="md:col-span-2"
      >
        <input
          type="text"
          value={form.logoUrl}
          onChange={(e) =>
            setForm((current) => ({ ...current, logoUrl: e.target.value }))
          }
          className={inputClassName}
          placeholder="https://cdn.example.org/feeding-america.png"
          disabled={disabled}
        />
      </FieldShell>

      <FieldShell label="Description" className="md:col-span-2">
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((current) => ({ ...current, description: e.target.value }))
          }
          className={textareaClassName}
          placeholder="Short mission description"
          disabled={disabled}
        />
      </FieldShell>

      <label className="flex items-start gap-3 rounded-2xl border border-base-300/70 bg-base-200/50 px-4 py-3 md:col-span-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) =>
            setForm((current) => ({ ...current, isDefault: e.target.checked }))
          }
          className="checkbox"
          disabled={disabled}
        />
        <span className="text-sm leading-relaxed text-base-content/80">
          Make this the default charity for new users
        </span>
      </label>
    </div>
  );
}

export default function CharityCatalogManager({
  charities,
}: {
  charities: CharityRecord[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, CharityFormState>>(
    Object.fromEntries(charities.map((charity) => [charity.id, toFormState(charity)]))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sortedCharities = useMemo(
    () =>
      [...charities].sort((a, b) => {
        if (a.isDefault !== b.isDefault) {
          return a.isDefault ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      }),
    [charities]
  );

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        charities.map((charity) => [charity.id, toFormState(charity)])
      )
    );
  }, [charities]);

  async function handleSave(charityId: string) {
    const payload = drafts[charityId];

    if (!payload) {
      return;
    }

    try {
      setSavingId(charityId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/charities/${charityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update charity");
      }

      setSuccess(`Saved ${payload.name}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update charity");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {(error || success) && (
        <div className={`alert ${error ? "alert-error" : "alert-success"}`}>
          <span>{error || success}</span>
        </div>
      )}

      <div className="space-y-4">
        {sortedCharities.map((charity) => {
          const draft = drafts[charity.id] ?? toFormState(charity);
          const isExpanded = expandedId === charity.id;
          const isSaving = savingId === charity.id;

          return (
            <div key={charity.id} className="card bg-base-100 shadow-sm">
              <div className="card-body gap-6 p-6 sm:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <CharityLogo
                      charityId={charity.id}
                      name={charity.name}
                      logoUrl={draft.logoUrl || null}
                      size="lg"
                    />
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-semibold tracking-tight">
                          {charity.name}
                        </h3>
                        {charity.isDefault && (
                          <span className="badge badge-primary">Default</span>
                        )}
                        {draft.logoUrl ? (
                          <span className="badge badge-outline">Logo set</span>
                        ) : (
                          <span className="badge badge-ghost">No logo URL</span>
                        )}
                      </div>
                      <p className="text-base text-base-content/65">
                        {charity.fullName}
                      </p>
                      <p className="max-w-3xl text-sm leading-relaxed text-base-content/80">
                        {charity.description}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1 text-xs text-base-content/60">
                        <span className="rounded-full bg-base-200 px-3 py-1">
                          ID: {charity.id}
                        </span>
                        <span className="rounded-full bg-base-200 px-3 py-1">
                          {charity.category}
                        </span>
                        <span className="rounded-full bg-base-200 px-3 py-1">
                          Score: {charity.charityNavigatorScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 self-start">
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      Visit Site
                    </a>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() =>
                        setExpandedId((current) =>
                          current === charity.id ? null : charity.id
                        )
                      }
                    >
                      {isExpanded ? "Close" : "Edit"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="rounded-3xl border border-base-300/80 bg-base-200/30 p-5 sm:p-6">
                    <CharityFields
                      form={draft}
                      setForm={(updater) =>
                        setDrafts((current) => ({
                          ...current,
                          [charity.id]:
                            typeof updater === "function"
                              ? updater(current[charity.id] ?? toFormState(charity))
                              : updater,
                        }))
                      }
                      isCreate={false}
                      disabled={isSaving}
                    />

                    <div className="card-actions justify-end mt-6">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() =>
                          setDrafts((current) => ({
                            ...current,
                            [charity.id]: toFormState(charity),
                          }))
                        }
                        disabled={isSaving}
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleSave(charity.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CharityCreateForm() {
  const router = useRouter();
  const [newCharity, setNewCharity] = useState<CharityFormState>(toFormState());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/admin/charities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCharity),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create charity");
      }

      router.push("/admin/charities");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create charity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body gap-6 p-6 sm:p-8">
        {error ? (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-2 max-w-3xl">
          <h2 className="card-title text-3xl">Add a Charity</h2>
          <p className="text-sm leading-relaxed text-base-content/60">
            Create a new charity directly in the database. Use a root-relative
            logo path when you have a local asset.
          </p>
        </div>

        <div className="rounded-3xl border border-base-300/80 bg-base-200/30 p-5 sm:p-6">
          <CharityFields
            form={newCharity}
            setForm={setNewCharity}
            isCreate={true}
            disabled={saving}
          />
        </div>

        <div className="card-actions justify-between pt-1">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.push("/admin/charities")}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? "Creating..." : "Create Charity"}
          </button>
        </div>
      </div>
    </div>
  );
}

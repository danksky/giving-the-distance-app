type NormalizedCharityInput = {
  id?: string;
  name: string;
  fullName: string;
  description: string;
  category: string;
  logoUrl: string | null;
  website: string;
  charityNavigatorScore: number;
  isDefault: boolean;
};

function parseString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseBoolean(value: unknown): boolean {
  return value === true;
}

function parseScore(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : 0;

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error("Charity Navigator score must be a number between 0 and 100.");
  }

  return Math.round(parsed);
}

function parseWebsite(value: unknown): string {
  const website = parseString(value);

  if (!website) {
    throw new Error("Website is required.");
  }

  try {
    const parsed = new URL(website);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Website must use http or https.");
    }

    return parsed.toString();
  } catch {
    throw new Error("Website must be a valid URL.");
  }
}

function parseLogoUrl(value: unknown): string | null {
  const logoUrl = parseString(value);

  if (!logoUrl) {
    return null;
  }

  if (logoUrl.startsWith("/")) {
    return logoUrl;
  }

  try {
    const parsed = new URL(logoUrl);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Logo URL must use http or https.");
    }

    return parsed.toString();
  } catch {
    throw new Error(
      "Logo URL must be a root-relative path or a valid http/https URL."
    );
  }
}

export function normalizeCharityInput(
  input: unknown,
  options: { requireId: boolean }
): NormalizedCharityInput {
  if (!input || typeof input !== "object") {
    throw new Error("Charity payload is required.");
  }

  const data = input as Record<string, unknown>;
  const id = parseString(data.id).toLowerCase();
  const name = parseString(data.name);
  const fullName = parseString(data.fullName);
  const description = parseString(data.description);
  const category = parseString(data.category);

  if (options.requireId && !id) {
    throw new Error("Charity ID is required.");
  }

  if (!name) {
    throw new Error("Display name is required.");
  }

  if (!fullName) {
    throw new Error("Full legal name is required.");
  }

  if (!description) {
    throw new Error("Description is required.");
  }

  if (!category) {
    throw new Error("Category is required.");
  }

  return {
    id: id || undefined,
    name,
    fullName,
    description,
    category,
    logoUrl: parseLogoUrl(data.logoUrl),
    website: parseWebsite(data.website),
    charityNavigatorScore: parseScore(data.charityNavigatorScore),
    isDefault: parseBoolean(data.isDefault),
  };
}

export const STRAVA_DESCRIPTION_UPDATE_SKIPPED_PREFIX = "SKIPPED:";

function getAppBaseUrl(): string {
  const configured =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    (process.env.VERCEL_URL?.trim()
      ? `https://${process.env.VERCEL_URL.trim()}`
      : "");

  const withProtocol = configured.startsWith("http")
    ? configured
    : configured
      ? `https://${configured}`
      : "";

  return withProtocol.replace(/\/+$/, "");
}

function parseBooleanEnv(
  value: string | undefined
): boolean | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

export function shouldUpdateStravaDescriptions(): boolean {
  const explicitOverride = parseBooleanEnv(
    process.env.ENABLE_STRAVA_DESCRIPTION_UPDATES
  );

  if (explicitOverride !== undefined) {
    return explicitOverride;
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  const baseUrl = getAppBaseUrl().toLowerCase();

  if (
    vercelEnv === "production" ||
    baseUrl === "https://givingthedistance.org" ||
    (baseUrl.endsWith(".givingthedistance.org") && !baseUrl.includes("beta."))
  ) {
    return true;
  }

  if (
    vercelEnv === "preview" ||
    vercelEnv === "development" ||
    nodeEnv === "development" ||
    baseUrl.includes("beta.givingthedistance.org") ||
    baseUrl.includes("localhost")
  ) {
    return false;
  }

  return false;
}

export function getStravaDescriptionSkipReason(): string {
  return "Strava description updates are disabled for this environment.";
}

export function formatSkippedDescriptionUpdateMessage(reason: string): string {
  return `${STRAVA_DESCRIPTION_UPDATE_SKIPPED_PREFIX} ${reason}`;
}

export function isSkippedDescriptionUpdateMessage(
  value: string | null | undefined
): boolean {
  return value?.startsWith(`${STRAVA_DESCRIPTION_UPDATE_SKIPPED_PREFIX} `) ?? false;
}

export function getSkippedDescriptionUpdateReason(
  value: string | null | undefined
): string | null {
  if (!isSkippedDescriptionUpdateMessage(value)) {
    return null;
  }

  return value!.slice(`${STRAVA_DESCRIPTION_UPDATE_SKIPPED_PREFIX} `.length);
}

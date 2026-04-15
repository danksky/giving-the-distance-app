export function isRemoteLogoUrl(logoUrl?: string | null): boolean {
  return Boolean(logoUrl && /^https?:\/\//i.test(logoUrl));
}

export function getCharityLogoSrc({
  charityId,
  logoUrl,
}: {
  charityId?: string | null;
  logoUrl?: string | null;
}): string | null {
  if (!logoUrl) {
    return null;
  }

  if (!isRemoteLogoUrl(logoUrl)) {
    return logoUrl;
  }

  if (!charityId) {
    return logoUrl;
  }

  return `/api/charity-logos/${encodeURIComponent(charityId)}`;
}

export function getAbsoluteCharityLogoUrl({
  baseUrl,
  charityId,
  logoUrl,
}: {
  baseUrl: string;
  charityId?: string | null;
  logoUrl?: string | null;
}): string | undefined {
  const src = getCharityLogoSrc({ charityId, logoUrl });

  if (!src) {
    return undefined;
  }

  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  return new URL(src, baseUrl).toString();
}

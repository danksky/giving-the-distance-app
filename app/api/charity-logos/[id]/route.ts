import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isRemoteLogoUrl } from "@/lib/charity-logo";

const LOGO_REVALIDATE_SECONDS = 60 * 60 * 24;
const LOGO_STALE_SECONDS = 60 * 60 * 24 * 7;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const charity = await db.charity.findUnique({
    where: { id },
    select: {
      logoUrl: true,
      name: true,
    },
  });

  if (!charity?.logoUrl) {
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }

  if (!isRemoteLogoUrl(charity.logoUrl)) {
    return NextResponse.json(
      { error: "Logo is already served locally" },
      { status: 400 }
    );
  }

  const upstream = await fetch(charity.logoUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 GivingTheDistance/1.0",
    },
    next: {
      revalidate: LOGO_REVALIDATE_SECONDS,
    },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Failed to fetch logo for ${charity.name}` },
      { status: upstream.status === 404 ? 404 : 502 }
    );
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  const bytes = await upstream.arrayBuffer();

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=0, s-maxage=${LOGO_REVALIDATE_SECONDS}, stale-while-revalidate=${LOGO_STALE_SECONDS}`,
      "CDN-Cache-Control": `public, s-maxage=${LOGO_REVALIDATE_SECONDS}, stale-while-revalidate=${LOGO_STALE_SECONDS}`,
      "Content-Disposition": "inline",
    },
  });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth-helpers";
import { normalizeCharityInput } from "@/lib/charity-admin";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !isAdmin(session.user?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const charity = normalizeCharityInput(await request.json(), {
      requireId: true,
    });

    const [existing, charityCount] = await Promise.all([
      db.charity.findUnique({
        where: { id: charity.id! },
        select: { id: true },
      }),
      db.charity.count(),
    ]);

    if (existing) {
      return NextResponse.json(
        { error: "A charity with that ID already exists." },
        { status: 409 }
      );
    }

    const created = await db.$transaction(async (tx) => {
      const shouldBeDefault = charityCount === 0 ? true : charity.isDefault;

      if (shouldBeDefault) {
        await tx.charity.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.charity.create({
        data: {
          id: charity.id!,
          name: charity.name,
          fullName: charity.fullName,
          description: charity.description,
          category: charity.category,
          logoUrl: charity.logoUrl,
          website: charity.website,
          charityNavigatorScore: charity.charityNavigatorScore,
          isDefault: shouldBeDefault,
        },
      });
    });

    return NextResponse.json({ success: true, charity: created });
  } catch (error) {
    console.error("Error creating charity:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create charity",
      },
      { status: 400 }
    );
  }
}

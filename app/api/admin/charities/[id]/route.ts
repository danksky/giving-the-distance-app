import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth-helpers";
import { normalizeCharityInput } from "@/lib/charity-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session || !isAdmin(session.user?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await db.charity.findUnique({
      where: { id },
      select: { id: true, isDefault: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Charity not found" }, { status: 404 });
    }

    const charity = normalizeCharityInput(await request.json(), {
      requireId: false,
    });

    if (existing.isDefault && !charity.isDefault) {
      return NextResponse.json(
        {
          error:
            "This charity is currently the default. Choose another default charity first.",
        },
        { status: 400 }
      );
    }

    const updated = await db.$transaction(async (tx) => {
      if (charity.isDefault) {
        await tx.charity.updateMany({
          where: {
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      return tx.charity.update({
        where: { id },
        data: {
          name: charity.name,
          fullName: charity.fullName,
          description: charity.description,
          category: charity.category,
          logoUrl: charity.logoUrl,
          website: charity.website,
          charityNavigatorScore: charity.charityNavigatorScore,
          isDefault: charity.isDefault,
        },
      });
    });

    return NextResponse.json({ success: true, charity: updated });
  } catch (error) {
    console.error("Error updating charity:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update charity",
      },
      { status: 400 }
    );
  }
}

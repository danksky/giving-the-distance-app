import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { charityId } = await request.json();

    if (!charityId) {
      return NextResponse.json(
        { error: "Charity ID is required" },
        { status: 400 }
      );
    }

    // Verify charity exists
    const charity = await db.charity.findUnique({
      where: { id: charityId },
    });

    if (!charity) {
      return NextResponse.json(
        { error: "Charity not found" },
        { status: 404 }
      );
    }

    // Update user's selected charity
    const user = await db.user.update({
      where: { email: session.user.email },
      data: { selectedCharityId: charityId },
      include: { selectedCharity: true },
    });

    return NextResponse.json({
      success: true,
      charity: user.selectedCharity,
    });
  } catch (error) {
    console.error("Error updating charity selection:", error);
    return NextResponse.json(
      { error: "Failed to update charity selection" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's selected charity
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { selectedCharity: true },
    });

    return NextResponse.json({
      charity: user?.selectedCharity || null,
    });
  } catch (error) {
    console.error("Error fetching charity selection:", error);
    return NextResponse.json(
      { error: "Failed to fetch charity selection" },
      { status: 500 }
    );
  }
}

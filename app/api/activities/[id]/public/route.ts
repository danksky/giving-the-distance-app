import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/activities/[id]/public
 * Toggle the isPublicProfile setting for an activity
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { isPublic } = body;

    if (typeof isPublic !== "boolean") {
      return NextResponse.json(
        { error: "isPublic must be a boolean" },
        { status: 400 }
      );
    }

    // Get the activity and verify ownership
    const activity = await db.activity.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    if (activity.user.email !== session.user.email) {
      return NextResponse.json(
        { error: "You can only modify your own activities" },
        { status: 403 }
      );
    }

    // Update the activity
    const updatedActivity = await db.activity.update({
      where: { id },
      data: { isPublicProfile: isPublic },
    });

    return NextResponse.json({
      success: true,
      isPublicProfile: updatedActivity.isPublicProfile,
    });
  } catch (error) {
    console.error("Error toggling public profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

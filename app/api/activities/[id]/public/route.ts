import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { NextResponse } from "next/server";

const routeLogger = getLogger("api/activities/[id]/public");

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
    const { id } = await context.params;
    const requestLogger = routeLogger.child({
      activityId: id,
      userEmail: session?.user?.email ?? null,
    });

    if (!session?.user?.email) {
      requestLogger.warn("Unauthorized attempt to change activity visibility");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isPublic } = body;

    if (typeof isPublic !== "boolean") {
      requestLogger.warn("Invalid activity visibility payload", {
        receivedType: typeof isPublic,
      });
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
      requestLogger.warn("Activity visibility change requested for missing activity");
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    if (activity.user.email !== session.user.email) {
      requestLogger.warn("Forbidden activity visibility change attempt", {
        activityOwnerEmail: activity.user.email,
      });
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

    requestLogger.info("Activity visibility updated", {
      newIsPublicProfile: updatedActivity.isPublicProfile,
      previousIsPublicProfile: activity.isPublicProfile,
      stravaActivityId: activity.stravaActivityId,
    });

    return NextResponse.json({
      success: true,
      isPublicProfile: updatedActivity.isPublicProfile,
    });
  } catch (error) {
    routeLogger.error("Unexpected error toggling activity visibility", {
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

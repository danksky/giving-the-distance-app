import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getLogger, scheduleLogFlush } from "@/lib/logger";
import { NextResponse } from "next/server";

const routeLogger = getLogger("api/activities/[id]/visibility");

type ActivityVisibilityRow = {
  isPublicProfile: boolean;
  isPublicRouteMap: boolean;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  scheduleLogFlush(routeLogger);

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
    const updates: {
      isPublicProfile?: boolean;
      isPublicRouteMap?: boolean;
    } = {};

    if ("isPublicProfile" in body) {
      if (typeof body.isPublicProfile !== "boolean") {
        return NextResponse.json(
          { error: "isPublicProfile must be a boolean" },
          { status: 400 }
        );
      }
      updates.isPublicProfile = body.isPublicProfile;
    }

    if ("isPublicRouteMap" in body) {
      if (typeof body.isPublicRouteMap !== "boolean") {
        return NextResponse.json(
          { error: "isPublicRouteMap must be a boolean" },
          { status: 400 }
        );
      }
      updates.isPublicRouteMap = body.isPublicRouteMap;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "At least one visibility field is required" },
        { status: 400 }
      );
    }

    const activity = await db.activity.findUnique({
      where: { id },
      select: {
        id: true,
        user: {
          select: {
            email: true,
          },
        },
      },
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

    let updatedActivity: ActivityVisibilityRow;

    if ("isPublicRouteMap" in updates) {
      try {
        const [row] = await db.$queryRaw<ActivityVisibilityRow[]>`
          UPDATE "activities"
          SET
            "isPublicProfile" = CASE
              WHEN ${"isPublicProfile" in updates} THEN ${updates.isPublicProfile ?? false}
              ELSE "isPublicProfile"
            END,
            "isPublicRouteMap" = ${updates.isPublicRouteMap ?? false}
          WHERE "id" = ${id}
          RETURNING
            "isPublicProfile",
            "isPublicRouteMap"
        `;

        updatedActivity = row;
      } catch (error) {
        requestLogger.error("Route map visibility update failed", {
          updates,
          error,
        });
        return NextResponse.json(
          { error: "Route map visibility is not available right now" },
          { status: 503 }
        );
      }
    } else {
      const row = await db.activity.update({
        where: { id },
        data: {
          isPublicProfile: updates.isPublicProfile ?? false,
        },
        select: {
          isPublicProfile: true,
        },
      });

      updatedActivity = {
        isPublicProfile: row.isPublicProfile,
        isPublicRouteMap: false,
      };
    }

    requestLogger.info("Activity visibility updated", {
      updates,
      visibility: updatedActivity,
    });

    return NextResponse.json({
      success: true,
      visibility: updatedActivity,
    });
  } catch (error) {
    routeLogger.error("Unexpected error updating activity visibility", {
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

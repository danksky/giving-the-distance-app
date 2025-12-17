import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { backfillGPXFiles, getGPXStatistics } from "@/lib/gpx-backfill";

/**
 * Admin API: GPX Backfill
 * 
 * GET  - Get backfill statistics
 * POST - Trigger GPX backfill for activities without GPX files
 */

// Check if user is admin (you'll need to implement this based on your auth setup)
async function isAdmin(session: Awaited<ReturnType<typeof auth>>) {
  if (!session?.user?.email) return false;
  
  // TODO: Implement proper admin check
  // For now, just check if user exists
  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });
  
  return !!user;
}

// GET - Get statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || undefined;

    const stats = await getGPXStatistics(userId);

    return NextResponse.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error("Error getting GPX statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST - Trigger backfill
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, limit, dryRun } = body;

    console.log("🚀 Starting GPX backfill via API...");
    console.log("Options:", { userId, limit, dryRun });

    const result = await backfillGPXFiles({
      userId,
      limit: limit ? parseInt(limit) : undefined,
      dryRun: dryRun === true,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error running GPX backfill:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

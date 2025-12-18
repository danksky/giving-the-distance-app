/**
 * GPX Backfill Script
 * 
 * Downloads and stores GPX files for existing activities that don't have them yet.
 */

import { db } from "@/lib/db";
import { getValidStravaToken } from "@/lib/strava-token-refresh";
import { fetchAndGenerateGPX } from "@/lib/gpx-generator";
import { uploadGPXToBlob, isBlobStorageConfigured } from "@/lib/gpx-storage";

export interface BackfillResult {
  processed: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ activityId: string; error: string }>;
}

export interface BackfillOptions {
  userId?: string; // If provided, only backfill for this user
  limit?: number; // Max number of activities to process
  dryRun?: boolean; // If true, don't actually update the database
}

/**
 * Backfill GPX files for activities that don't have them
 */
export async function backfillGPXFiles(
  options: BackfillOptions = {}
): Promise<BackfillResult> {
  const { userId, limit, dryRun = false } = options;

  const result: BackfillResult = {
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Check if blob storage is configured
  if (!isBlobStorageConfigured()) {
    console.error("❌ Blob storage not configured - cannot backfill GPX files");
    throw new Error("BLOB_READ_WRITE_TOKEN not configured");
  }

  console.log("🎯 Starting GPX backfill...");
  console.log(`📊 Options:`, {
    userId: userId || "all users",
    limit: limit || "no limit",
    dryRun,
  });

  // Find activities without GPX files
  const activities = await db.activity.findMany({
    where: {
      gpxBlobUrl: null,
      deletedAt: null,
      isManual: false, // Skip manual activities (no GPS data)
      ...(userId ? { userId } : {}),
    },
    include: {
      user: {
        include: {
          accounts: {
            where: { provider: "strava" },
          },
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
    take: limit,
  });

  console.log(`📋 Found ${activities.length} activities to process`);

  // Process each activity
  for (const activity of activities) {
    result.processed++;

    try {
      console.log(
        `\n[${result.processed}/${activities.length}] Processing activity ${activity.id} (Strava: ${activity.stravaActivityId})...`
      );

      // Get valid Strava access token
      const accessToken = await getValidStravaToken(activity.userId);

      if (!accessToken) {
        console.warn(
          `⚠️  No valid Strava token for user ${activity.userId} - skipping`
        );
        result.skipped++;
        result.errors.push({
          activityId: activity.id,
          error: "No valid Strava access token",
        });
        continue;
      }

      // Generate GPX
      const gpxContent = await fetchAndGenerateGPX(
        activity.stravaActivityId.toString(),
        accessToken,
        {
          name: activity.name || "Activity",
          startDate: activity.startDate || undefined,
          type: activity.type,
        }
      );

      if (!gpxContent) {
        console.warn(`⚠️  No GPX data available for activity ${activity.id}`);
        result.skipped++;
        continue;
      }

      // Upload to Vercel Blob
      if (dryRun) {
        console.log(
          `[DRY RUN] Would upload GPX (${gpxContent.length} bytes) for activity ${activity.id}`
        );
        result.success++;
        continue;
      }

      const blobUrl = await uploadGPXToBlob(
        gpxContent,
        activity.stravaActivityId.toString(),
        activity.userId
      );

      if (!blobUrl) {
        console.error(`❌ Failed to upload GPX for activity ${activity.id}`);
        result.failed++;
        result.errors.push({
          activityId: activity.id,
          error: "Failed to upload to blob storage",
        });
        continue;
      }

      // Update database
      await db.activity.update({
        where: { id: activity.id },
        data: { gpxBlobUrl: blobUrl },
      });

      console.log(`✅ Successfully backfilled GPX for activity ${activity.id}`);
      result.success++;
    } catch (error) {
      console.error(
        `❌ Error processing activity ${activity.id}:`,
        error
      );
      result.failed++;
      result.errors.push({
        activityId: activity.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Backfill Summary");
  console.log("=".repeat(60));
  console.log(`Processed: ${result.processed}`);
  console.log(`✅ Success: ${result.success}`);
  console.log(`⚠️  Skipped: ${result.skipped}`);
  console.log(`❌ Failed: ${result.failed}`);
  
  if (result.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    result.errors.forEach(({ activityId, error }) => {
      console.log(`  - ${activityId}: ${error}`);
    });
  }

  console.log("=".repeat(60));

  return result;
}

/**
 * Get statistics about activities and GPX coverage
 */
export async function getGPXStatistics(userId?: string) {
  const where = {
    deletedAt: null,
    ...(userId ? { userId } : {}),
  };

  const [total, withGPX, withoutGPX, manual] = await Promise.all([
    db.activity.count({ where }),
    db.activity.count({
      where: {
        ...where,
        gpxBlobUrl: { not: null },
      },
    }),
    db.activity.count({
      where: {
        ...where,
        gpxBlobUrl: null,
        isManual: false,
      },
    }),
    db.activity.count({
      where: {
        ...where,
        isManual: true,
      },
    }),
  ]);

  const coverage = total > 0 ? ((withGPX / total) * 100).toFixed(1) : "0.0";

  return {
    total,
    withGPX,
    withoutGPX,
    manual,
    coverage: `${coverage}%`,
  };
}

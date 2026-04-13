import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";

const GTD_MARKER = "#GTD";
const historyLogger = getLogger("strava-activity-history");

interface RecordStravaActivityHistoryInput {
  activityId?: string | null;
  stravaActivityId: bigint;
  webhookEventId?: string | null;
  source: "strava_webhook" | "app";
  eventType: string;
  aspectType?: string | null;
  name?: string | null;
  type?: string | null;
  isPrivate?: boolean | null;
  visibility?: string | null;
  descriptionText?: string | null;
  updates?: unknown;
  metadata?: unknown;
}

export async function recordStravaActivityHistory(
  input: RecordStravaActivityHistoryInput
) {
  try {
    const historyModel = (
      db as typeof db & {
        stravaActivityHistory?: {
          create: (args: {
            data: Record<string, unknown>;
          }) => Promise<unknown>;
        };
      }
    ).stravaActivityHistory;

    if (!historyModel) {
      return;
    }

    const hasDescriptionSnapshot = input.descriptionText !== undefined;
    const normalizedDescription =
      input.descriptionText === undefined ? null : input.descriptionText ?? "";

    await historyModel.create({
      data: {
        activityId: input.activityId ?? null,
        stravaActivityId: input.stravaActivityId,
        webhookEventId: input.webhookEventId ?? null,
        source: input.source,
        eventType: input.eventType,
        aspectType: input.aspectType ?? null,
        name: input.name ?? null,
        type: input.type ?? null,
        isPrivate: input.isPrivate ?? null,
        visibility: input.visibility ?? null,
        descriptionText: hasDescriptionSnapshot ? normalizedDescription : null,
        descriptionPresent: hasDescriptionSnapshot
          ? normalizedDescription.length > 0
          : null,
        descriptionHasGtdMarker: hasDescriptionSnapshot
          ? normalizedDescription.includes(GTD_MARKER)
          : null,
        descriptionLength: hasDescriptionSnapshot
          ? normalizedDescription.length
          : null,
        updates: input.updates,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    historyLogger.error("Failed to record Strava activity history", {
      activityId: input.activityId,
      error,
      eventType: input.eventType,
      source: input.source,
      stravaActivityId: input.stravaActivityId,
      webhookEventId: input.webhookEventId,
    });
  }
}

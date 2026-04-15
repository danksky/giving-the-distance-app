CREATE TABLE IF NOT EXISTS "strava_activity_history" (
  "id" TEXT NOT NULL,
  "activityId" TEXT,
  "stravaActivityId" BIGINT NOT NULL,
  "webhookEventId" TEXT,
  "source" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "aspectType" TEXT,
  "name" TEXT,
  "type" TEXT,
  "isPrivate" BOOLEAN,
  "visibility" TEXT,
  "descriptionText" TEXT,
  "descriptionPresent" BOOLEAN,
  "descriptionHasGtdMarker" BOOLEAN,
  "descriptionLength" INTEGER,
  "updates" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "strava_activity_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "strava_activity_history_activityId_idx"
  ON "strava_activity_history"("activityId");

CREATE INDEX IF NOT EXISTS "strava_activity_history_stravaActivityId_idx"
  ON "strava_activity_history"("stravaActivityId");

CREATE INDEX IF NOT EXISTS "strava_activity_history_webhookEventId_idx"
  ON "strava_activity_history"("webhookEventId");

CREATE INDEX IF NOT EXISTS "strava_activity_history_createdAt_idx"
  ON "strava_activity_history"("createdAt" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'strava_activity_history_activityId_fkey'
  ) THEN
    ALTER TABLE "strava_activity_history"
      ADD CONSTRAINT "strava_activity_history_activityId_fkey"
      FOREIGN KEY ("activityId") REFERENCES "activities"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'strava_activity_history_webhookEventId_fkey'
  ) THEN
    ALTER TABLE "strava_activity_history"
      ADD CONSTRAINT "strava_activity_history_webhookEventId_fkey"
      FOREIGN KEY ("webhookEventId") REFERENCES "strava_webhook_events"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

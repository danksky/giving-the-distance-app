-- Add gpxBlobUrl field to activities table
-- This stores the URL to the GPX file in Vercel Blob Storage

ALTER TABLE "activities" ADD COLUMN "gpxBlobUrl" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "activities"."gpxBlobUrl" IS 'URL to GPX file in Vercel Blob Storage';

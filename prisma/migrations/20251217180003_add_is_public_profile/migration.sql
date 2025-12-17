-- Add isPublicProfile column to activities table
-- Default to false (private) for all existing and new activities
ALTER TABLE "activities" ADD COLUMN "isPublicProfile" BOOLEAN NOT NULL DEFAULT false;

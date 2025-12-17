-- Rename the PlacementResult enum to SponsorMatchResult
ALTER TYPE "PlacementResult" RENAME TO "SponsorMatchResult";

-- Rename the placement_logs table to sponsor_matches
ALTER TABLE "placement_logs" RENAME TO "sponsor_matches";

-- Update the comment on the unique constraint (cosmetic)
COMMENT ON CONSTRAINT "placement_logs_activityId_key" ON "sponsor_matches" IS 'Idempotency: one sponsor match per activity';

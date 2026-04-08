ALTER TABLE "sponsor_matches"
ADD COLUMN IF NOT EXISTS "matchingVersion" TEXT,
ADD COLUMN IF NOT EXISTS "decisionReason" TEXT,
ADD COLUMN IF NOT EXISTS "decisionContext" JSONB;

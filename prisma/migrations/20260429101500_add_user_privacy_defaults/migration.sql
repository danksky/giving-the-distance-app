ALTER TABLE "users"
ADD COLUMN "defaultActivityIsPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "defaultActivityMapIsPublic" BOOLEAN NOT NULL DEFAULT false;

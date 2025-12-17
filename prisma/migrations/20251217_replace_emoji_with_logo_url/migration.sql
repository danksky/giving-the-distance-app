-- AlterTable
ALTER TABLE "charities" RENAME COLUMN "emoji" TO "logoUrl";

-- Make logoUrl nullable
ALTER TABLE "charities" ALTER COLUMN "logoUrl" DROP NOT NULL;

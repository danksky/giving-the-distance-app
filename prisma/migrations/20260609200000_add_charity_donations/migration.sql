CREATE TABLE "charity_donations" (
  "id" TEXT NOT NULL,
  "charityId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "donatedAt" TIMESTAMP(3) NOT NULL,
  "provider" TEXT NOT NULL,
  "sourceReferenceHash" TEXT NOT NULL,
  "publicReference" TEXT NOT NULL,
  "deliveryStatus" TEXT NOT NULL DEFAULT 'DONATED_TO_INTERMEDIARY',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "charity_donations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "charity_donations_sourceReferenceHash_key"
  ON "charity_donations"("sourceReferenceHash");

CREATE INDEX "charity_donations_charityId_donatedAt_idx"
  ON "charity_donations"("charityId", "donatedAt" DESC);

ALTER TABLE "charity_donations"
  ADD CONSTRAINT "charity_donations_charityId_fkey"
  FOREIGN KEY ("charityId") REFERENCES "charities"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "charity_donations" (
  "id",
  "charityId",
  "amountCents",
  "currency",
  "donatedAt",
  "provider",
  "sourceReferenceHash",
  "publicReference",
  "deliveryStatus",
  "createdAt",
  "updatedAt"
)
SELECT
  donation."id",
  donation."charityId",
  donation."amountCents",
  'USD',
  donation."donatedAt",
  'PayPal Giving Fund',
  donation."sourceReferenceHash",
  donation."publicReference",
  'DONATED_TO_INTERMEDIARY',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  VALUES
    (
      'donation-njr-2026-04-22-300',
      'nice-jewish-runners',
      300,
      TIMESTAMP '2026-04-22 19:21:44',
      '1a409f3fc8ce9f964d44fb91948c4622f8e4fad06985e6efa67c5f2c842f8933',
      '1822N'
    ),
    (
      'donation-njr-2026-06-09-1800',
      'nice-jewish-runners',
      1800,
      TIMESTAMP '2026-06-09 19:42:00',
      '33a8ad2a31988e2447b27a460a1310713e2468fc4efd7dad5170efe63fdf19e8',
      '5491M'
    ),
    (
      'donation-unicef-2026-06-09-1400',
      'unicef',
      1400,
      TIMESTAMP '2026-06-09 23:00:18',
      'df509220dcaa725d80e5866fff905ddaf8b3d4eba72ec81748451a3b957ea030',
      '9024A'
    ),
    (
      'donation-arc-2026-06-09-100',
      'adventure-risk-challenge',
      100,
      TIMESTAMP '2026-06-09 23:01:16',
      '3e310f5e66e2474d09333293ec7306db46e370720dba56f214fe6cf5e48d0221',
      '9513H'
    )
) AS donation(
  "id",
  "charityId",
  "amountCents",
  "donatedAt",
  "sourceReferenceHash",
  "publicReference"
)
JOIN "charities" ON "charities"."id" = donation."charityId"
ON CONFLICT ("sourceReferenceHash") DO NOTHING;

INSERT INTO "charities" (
  "id",
  "name",
  "fullName",
  "description",
  "category",
  "logoUrl",
  "website",
  "charityNavigatorScore",
  "isDefault",
  "createdAt",
  "updatedAt"
)
VALUES (
  'adventure-risk-challenge',
  'Adventure Risk Challenge',
  'Adventure Risk Challenge',
  'Adventure Risk Challenge (ARC) empowers underserved youth through integrated leadership, literacy, and wilderness experiences.',
  'Youth Development',
  '/logos/charities/adventure-risk-challenge.png',
  'https://www.adventureriskchallenge.org/',
  0,
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "fullName" = EXCLUDED."fullName",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "logoUrl" = EXCLUDED."logoUrl",
  "website" = EXCLUDED."website",
  "charityNavigatorScore" = EXCLUDED."charityNavigatorScore",
  "isDefault" = EXCLUDED."isDefault",
  "updatedAt" = NOW();

-- Donation amounts exclude separately covered processing fees. Times were supplied
-- to the nearest minute in Eastern Standard Time and are stored as UTC.
-- The CARE entry is only the first gift, not a projection of future monthly gifts.
ALTER TABLE "charity_donations"
  ADD COLUMN "processingFeeCents" INTEGER NOT NULL DEFAULT 0,
  ALTER COLUMN "publicReference" DROP NOT NULL;

INSERT INTO "charity_donations" (
  "id", "charityId", "amountCents", "processingFeeCents", "currency",
  "donatedAt", "provider", "sourceReferenceHash", "publicReference",
  "deliveryStatus", "createdAt", "updatedAt"
) VALUES
  ('donation-nice-jewish-runners-2026-11-08', 'nice-jewish-runners', 5200, 0, 'USD', TIMESTAMP '2026-11-08 22:10:00', 'PayPal Giving Fund', 'b8e10c88de94bf3665a299e37e937f84aee79609d9787a6378e3a95835e801b2', '5722M', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-unicef-2026-11-08', 'unicef', 2440, 0, 'USD', TIMESTAMP '2026-11-08 22:11:00', 'PayPal Giving Fund', 'ef8ce1a88da4027ac14e605deb7014d2e3502d9ccda8d3dbe8b89e664a0fd450', '1423L', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-nami-2026-11-08', 'nami', 2440, 142, 'USD', TIMESTAMP '2026-11-08 22:13:00', 'NAMI (GoFundMe Pro)', '8cd87be71ae1f144cf8bf67d919b57de6fbdb05fe918b03c3237096899f9cf4b', '53630', 'DONATED_DIRECTLY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-girls-who-code-2026-11-08', 'girls-who-code', 1220, 0, 'USD', TIMESTAMP '2026-11-08 22:14:00', 'PayPal Giving Fund', '1a75c307ca6add4a0702d19734d0fbac949020dffd8d78d08605494707a9182e', '29330', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-khan-academy-2026-11-08', 'khan-academy', 750, 0, 'USD', TIMESTAMP '2026-11-08 22:14:00', 'PayPal Giving Fund', '8671e92ad6240ff709bc9651e9b4728a4a279787c2b4f3cc8ce91e2aa9465233', '99907', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-alzheimers-association-2026-11-08', 'alzheimers-association', 460, 0, 'USD', TIMESTAMP '2026-11-08 22:16:00', 'Direct (Stripe)', '569f2f10c8624f4cf5e38d6343b464e5363ef9ea3cb6c7e36b21b4387f2528cd', 'ttk07', 'DONATED_DIRECTLY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-adventure-risk-challenge-2026-11-08', 'adventure-risk-challenge', 430, 0, 'USD', TIMESTAMP '2026-11-08 22:16:00', 'PayPal Giving Fund', '2de4da98f65df844adb9b5f1b9b7b221fa303e504ffece81ae31a2dfafb6b756', '7812D', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-st-jude-2026-11-08', 'st-jude', 410, 0, 'USD', TIMESTAMP '2026-11-08 22:17:00', 'PayPal Giving Fund', '9910ea5fa2c3dba1cadd434cedd6df427d6b7facec9ada14ffd08c65569f6104', '9804A', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-nature-conservancy-2026-11-08', 'nature-conservancy', 360, 0, 'USD', TIMESTAMP '2026-11-08 22:18:00', 'PayPal Giving Fund', 'cf64b3f2650b553d6d9ca3472ec3c080e1d8856fa2c95ed6c717a2677756656c', '42529', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-world-central-kitchen-2026-11-08', 'world-central-kitchen', 290, 0, 'USD', TIMESTAMP '2026-11-08 22:18:00', 'PayPal Giving Fund', '03304b7f807be4ef2726a720a06760485de4afb9ae0ee85775d9c1067ca58fac', '3281L', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-the-trevor-project-2026-11-08', 'the-trevor-project', 270, 0, 'USD', TIMESTAMP '2026-11-08 22:19:00', 'PayPal Giving Fund', '7993079ecef3ecd2f06aa9ff2ae61c04e01ccf11fb2ae9e6f6bcae8833fcf9d5', '5343K', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-rainforest-trust-2026-11-08', 'rainforest-trust', 130, 0, 'USD', TIMESTAMP '2026-11-08 22:19:00', 'PayPal Giving Fund', '6112b928a6e41b19d332ac88a23415785c11dd6687fcf3f5a4322f01a4f965a4', '2684E', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-care-usa-2026-11-08', 'care-usa', 525, 0, 'USD', TIMESTAMP '2026-11-08 22:22:00', 'Direct (CARE)', 'a9f11a34f354f11249ec072b3a899fe473475a6eda1c5f5ee37451d4384564fd', NULL, 'DONATED_DIRECTLY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('donation-national-park-foundation-2026-11-08', 'national-park-foundation', 100, 0, 'USD', TIMESTAMP '2026-11-08 22:23:00', 'PayPal Giving Fund', '6ab0214814081105529c992a3a1f09ca33077f1116348be4799c5652ed8fd525', '1764D', 'DONATED_TO_INTERMEDIARY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("sourceReferenceHash") DO NOTHING;

# Config Cleanup Plan

This document turns the current environment audit into concrete cleanup work.

Audit date: April 9, 2026

## Verified current state

### Runtime parity

- Local and Preview use the same Google OAuth client.
- Local and Preview use the same Strava app.
- Local and Preview use the same development Neon database host.
- Production uses a different Google OAuth client, a different Strava app, and a different Neon host.

### Vercel environment inventory

Preview and Production currently have the app's core runtime env vars:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_WEBHOOK_VERIFY_TOKEN`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `ADMIN_EMAILS`
- `BLOB_READ_WRITE_TOKEN`
- `SLACK_BOT_TOKEN`
- `SLACK_CHANNEL`

Completed cleanup on April 9, 2026:

- Removed `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` from Vercel environments.
- Removed the reference-only `DEV_POSTGRESQL_*` and `PROD_POSTGRESQL_*` families from Vercel environments.
- Removed Preview Stripe env vars.

Vercel `Development` is ignored for this project and is still incomplete for running the full app. As of April 9, 2026 it does not include:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### Removed Vercel clutter

These were intentionally removed from active Vercel configuration on April 9, 2026:

- `DEV_POSTGRESQL_*`
- `PROD_POSTGRESQL_*`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Preview Stripe vars

### Google Cloud findings

- The active Google Cloud project for this audit is `giving-the-distance`.
- Its project number is `1048034892602`.
- That project number matches the prefix on both Google OAuth client IDs already used by the app.
- `maps.googleapis.com`, `places.googleapis.com`, and `apikeys.googleapis.com` do not appear enabled in this project.
- No API keys were listed in this project via `gcloud alpha services api-keys list`.

Inference:
The current Google OAuth clients are very likely in `giving-the-distance`, but the Google Maps API key is likely owned by a different Google Cloud project.

Decision:
Google Maps and Places support for sponsor preview flows is paused and does not remain in active environment configuration.

## App-used env vars

The app currently reads these env keys in code:

- `ADMIN_EMAILS`
- `BLOB_READ_WRITE_TOKEN`
- `BLOB_STORE_ID`
- `DATABASE_URL`
- `DIRECT_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_VERCEL_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `SLACK_BOT_TOKEN`
- `SLACK_CHANNEL`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_WEBHOOK_VERIFY_TOKEN`
- `VERCEL_ENV`
- `VERCEL_PROJECT_PRODUCTION_URL`
- `VERCEL_URL`

## Target state

### Local

Keep `.env.local` small and intentional:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_WEBHOOK_VERIFY_TOKEN`
- `ADMIN_EMAILS`
- `SLACK_BOT_TOKEN`
- `SLACK_CHANNEL`
- `BLOB_READ_WRITE_TOKEN`
- `BLOB_STORE_ID` when needed

Do not treat `.env.local` as a dump of every remote variable.

### Vercel Preview

Keep only:

- Core auth vars
- `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`
- Optional feature vars actually used by the app

### Vercel Production

Keep only:

- Core auth vars
- `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`
- Optional feature vars actually used by the app

### Vercel Development

This project does not intentionally use Vercel `Development`.

Target stance:

- Do not rely on Vercel `Development` as a local bootstrap source.
- Treat `.env.local` as the only supported local-development source of truth.
- If Vercel `Development` vars remain in the dashboard, treat them as unused platform residue rather than part of the app's environment model.

## Recommended sequence

1. Mark Vercel `Development` as ignored in project documentation and team practice.
2. Keep `.env.local` minimal and intentional.
3. Leave sponsor Google Maps support as a paused TODO rather than an active env requirement.
4. Create a manual provider checklist for Google OAuth and Strava app settings.

## IaC guidance

### Good candidates now

- Repo-level env validation and drift checks
- Vercel env naming conventions and documented contract
- Neon database naming and documented environment ownership

### Possible later

- Vercel env management through automation or Terraform, if you want one tool to push non-secret config structure

### Poor candidates right now

- Strava app configuration
- Generic Google OAuth client configuration and consent-screen details

Reason:
Those are still easier to verify with a manual checklist than to manage reliably through one clean Terraform flow in this setup.

## Practical next move

The highest-value next task is now a provider checklist pass:

- Keep Vercel `Development` ignored
- Maintain the slimmed-down local and Vercel env model
- Leave sponsor Google Maps support paused
- Audit Google OAuth console settings against the canonical contract
- Audit Strava app and webhook settings against the canonical contract

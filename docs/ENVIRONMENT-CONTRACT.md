# Environment Contract

This is the canonical source of truth for authentication, database, and environment configuration in this repo.

For the concrete cleanup sequence based on the April 9, 2026 audit, see [docs/CONFIG-CLEANUP-PLAN.md](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/docs/CONFIG-CLEANUP-PLAN.md).
For the remaining manual console checks, see [docs/PROVIDER-CHECKLIST.md](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/docs/PROVIDER-CHECKLIST.md).

## Canonical environment model

| Runtime | Primary source of vars | Public URL | Google OAuth client | Strava app | Database |
| --- | --- | --- | --- | --- | --- |
| Local development | `.env.local` | `http://localhost:3000` | Development | Development | Development |
| Preview deployment | Vercel Preview env | `https://beta.givingthedistance.org` | Development | Development | Development |
| Production deployment | Vercel Production env | `https://givingthedistance.org` | Production | Production | Production |

`Vercel Development` is not part of the intended workflow for this project. Local development means your Mac with `.env.local`, not a separate Vercel-managed development environment.

## What the app actually reads

Required for normal auth:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`

Required for database-backed auth and Prisma:

- `DATABASE_URL`
- Or one of Vercel's fallback variables: `POSTGRES_PRISMA_URL` or `POSTGRES_URL`

Required for Strava webhook verification:

- `STRAVA_WEBHOOK_VERIFY_TOKEN`

Optional feature flags and integrations:

- `ADMIN_EMAILS`
- `SLACK_BOT_TOKEN`
- `SLACK_CHANNEL`
- `BLOB_READ_WRITE_TOKEN`
- `BLOB_STORE_ID`
- `BETTER_STACK_SOURCE_TOKEN`
- `ENABLE_STRAVA_DESCRIPTION_UPDATES`
- `NEXT_PUBLIC_APP_URL`

Auto-provided platform variables the app can use as fallbacks:

- `POSTGRES_*`
- `VERCEL_*`
- `NEXT_PUBLIC_VERCEL_URL`

## Normalization rules already in the code

- Prisma only points at `DATABASE_URL` in [prisma/schema.prisma](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/prisma/schema.prisma).
- [lib/db.ts](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/lib/db.ts) normalizes `POSTGRES_PRISMA_URL` or `POSTGRES_URL` into `DATABASE_URL`.
- [lib/db.ts](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/lib/db.ts) also derives `DIRECT_URL` from `POSTGRES_URL_NON_POOLING` when that variable exists.
- Local development should still prefer a clean `.env.local` with standard names when possible.

## OAuth redirect matrix

Google OAuth:

- Development Google client:
  `http://localhost:3000/api/auth/callback/google`
  `https://beta.givingthedistance.org/api/auth/callback/google`
- Production Google client:
  `https://givingthedistance.org/api/auth/callback/google`

Google authorized JavaScript origins:

- Development Google client:
  `http://localhost:3000`
  `https://beta.givingthedistance.org`
- Production Google client:
  `https://givingthedistance.org`

Strava OAuth:

- Development Strava app should allow local and preview callbacks.
- Production Strava app should allow the production callback.
- The app currently requests these scopes in [auth.config.ts](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/auth.config.ts): `activity:read_all`, `profile:read_all`, `activity:write`

## Practical workflow

For local work:

1. Pull remote preview vars into `.env.preview` when you want a snapshot of the deployed dev environment.
2. Copy only the keys you actually want to run locally into `.env.local`.
3. Keep `.env.local` pointed at dev auth and dev database unless you are doing a deliberate production maintenance task.
4. Run `npm run config:audit` after env changes.
5. After pulling remote snapshots into `.env.preview` or `.env.production`, run `npm run env:sanitize` to strip Vercel/Turbo metadata noise from those local files.

For preview and production:

1. Treat Vercel as the runtime source of truth.
2. Treat `.env.preview` and `.env.production` as local snapshots for inspection and maintenance, not files the deployed app reads directly.
3. Keep local and preview aligned with each other.
4. Keep production separate for Google, Strava, and database credentials.

## Paused TODOs

- Sponsor Google Maps and Places integration is currently paused.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is intentionally not part of the active environment contract.
- If that feature returns, first identify the correct owning Google Cloud project and then document the restrictions there.

## Outside the repo

These settings are still controlled outside git and should be audited there:

- Google OAuth consent screen configuration
- Google OAuth authorized origins and redirect URIs
- Strava app callback settings
- Strava webhook subscriptions
- Better Stack source-token assignment into Vercel environments
- Vercel environment-variable assignment
- Neon database provisioning

## Current verified repo state

As of this audit:

- `.env.local` and `.env.preview` use the same Google OAuth client.
- `.env.local` and `.env.preview` use the same Strava app.
- `.env.local` and `.env.preview` point at the same Neon host.
- `.env.production` uses a different Google OAuth client, Strava app, and Neon host.

Run `npm run config:audit` to re-check this without exposing secret values.

# Provider Checklist

This is the manual checklist for cloud-console settings that are still outside normal repo and Vercel env management.

Audit baseline date: April 9, 2026

## Verified facts from code and tooling

### Environment model

- Local development means your Mac with `.env.local`.
- Preview means `https://beta.givingthedistance.org`.
- Production means `https://givingthedistance.org`.
- Vercel `Development` is intentionally ignored for this project.

### Google Cloud

- Active audited project: `giving-the-distance`
- Project number: `1048034892602`
- Inference: both Google OAuth clients likely belong to this project because their client IDs use the same project-number prefix.

### Google OAuth behavior in the app

From [auth.config.ts](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/auth.config.ts):

- Provider: Google via NextAuth
- Uses `GOOGLE_CLIENT_ID`
- Uses `GOOGLE_CLIENT_SECRET`
- Requests consent with:
  - `prompt=consent`
  - `access_type=offline`
  - `response_type=code`

### Strava OAuth behavior in the app

From [auth.config.ts](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/auth.config.ts):

- Provider: custom Strava OAuth provider
- Uses `STRAVA_CLIENT_ID`
- Uses `STRAVA_CLIENT_SECRET`
- Requested scopes:
  - `activity:read_all`
  - `profile:read_all`
  - `activity:write`

### Strava webhook behavior in the app

From [app/api/strava/webhook/route.ts](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/app/api/strava/webhook/route.ts) and [app/api/strava/webhook/subscribe/route.ts](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/app/api/strava/webhook/subscribe/route.ts):

- Verification endpoint expects `hub.verify_token` to match `STRAVA_WEBHOOK_VERIFY_TOKEN`
- Webhook callback endpoint:
  - Preview: `https://beta.givingthedistance.org/api/strava/webhook`
  - Production: `https://givingthedistance.org/api/strava/webhook`
- The app handles deauthorization events when Strava sends `updates.authorized === 'false'`
- The app has an internal subscription-management endpoint:
  - `GET /api/strava/webhook/subscribe`
  - `POST /api/strava/webhook/subscribe`
  - `DELETE /api/strava/webhook/subscribe`

### Current Vercel runtime env shape

Verified via Vercel CLI on April 9, 2026:

Preview has:

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

Production has the same shape, with production-specific auth and database values.

## Google OAuth checklist

Run this in Google Cloud Console for project `giving-the-distance`.

### OAuth consent screen

- [ ] App name is correct for the current project
- [ ] Support email is correct
- [ ] Authorized domain list is correct for:
  - `givingthedistance.org`
- [ ] Homepage URL is correct:
  - `https://givingthedistance.org`
- [ ] Privacy Policy URL is correct:
  - `https://givingthedistance.org/privacy`
- [ ] Terms of Service URL is correct:
  - `https://givingthedistance.org/terms`
- [ ] Publishing status is what you expect
- [ ] Test users are configured if the app is still in testing mode

### OAuth client: development

- [ ] Client exists for local plus preview use
- [ ] Authorized JavaScript origins include:
  - `http://localhost:3000`
  - `https://beta.givingthedistance.org`
- [ ] Authorized redirect URIs include:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://beta.givingthedistance.org/api/auth/callback/google`
- [ ] Client ID matches the value in local `.env.local`
- [ ] Client ID matches the value in Vercel Preview

### OAuth client: production

- [ ] Separate client exists for production
- [ ] Authorized JavaScript origins include:
  - `https://givingthedistance.org`
- [ ] Authorized redirect URIs include:
  - `https://givingthedistance.org/api/auth/callback/google`
- [ ] Client ID matches the value in Vercel Production

### Quick smoke checks

- [ ] Local sign-in starts at `http://localhost:3000`
- [ ] Preview sign-in starts at `https://beta.givingthedistance.org`
- [ ] Production sign-in starts at `https://givingthedistance.org`
- [ ] No redirect mismatch errors appear in any of those environments

## Strava checklist

Run this in the Strava app settings for both the development and production apps.

### Development Strava app

- [ ] This is the app wired to local and preview
- [ ] Callback configuration includes local:
  - `http://localhost:3000/api/auth/callback/strava`
- [ ] Callback configuration includes preview:
  - `https://beta.givingthedistance.org/api/auth/callback/strava`
- [ ] Client ID matches local `.env.local`
- [ ] Client ID matches Vercel Preview

### Production Strava app

- [ ] This is a separate app from development
- [ ] Callback configuration includes:
  - `https://givingthedistance.org/api/auth/callback/strava`
- [ ] Client ID matches Vercel Production

### Scopes and auth flow

- [ ] The app is approved for the scopes the code requests:
  - `activity:read_all`
  - `profile:read_all`
  - `activity:write`
- [ ] The permission screen still shows the expected scopes
- [ ] A successful Strava connect returns the user to `/dashboard`
- [ ] A denied or incomplete permission grant produces the expected error flow

### Webhook subscription

- [ ] Preview subscription is either intentionally absent or points to:
  - `https://beta.givingthedistance.org/api/strava/webhook`
- [ ] Production subscription is either intentionally absent or points to:
  - `https://givingthedistance.org/api/strava/webhook`
- [ ] Verify token in Strava matches `STRAVA_WEBHOOK_VERIFY_TOKEN` for the corresponding environment
- [ ] The current Strava subscription list matches what the app thinks is active

Helpful inspection path:

- [ ] Check `GET /api/strava/webhook/subscribe` in Preview when you want to compare Strava-side and DB-side subscriptions
- [ ] Check `GET /api/strava/webhook/subscribe` in Production when you want to compare Strava-side and DB-side subscriptions

### Webhook behavior

- [ ] New activity events are received
- [ ] Delete events are received
- [ ] Deauthorization events are received
- [ ] Deauthorization updates mark the athlete as unauthorized as expected

## Paused items

- Sponsor Google Maps and Places integration is paused.
- The Maps API key is intentionally not part of the active environment contract.
- Do not add it back to Vercel until you decide to revive that feature and know which Google Cloud project should own it.

## Suggested recurring audit

When auth or domain settings change, repeat this checklist in this order:

1. Confirm Vercel Preview and Production env values still follow the contract.
2. Confirm Google OAuth redirect URIs and origins.
3. Confirm Strava callback settings and scopes.
4. Confirm Strava webhook subscription targets and verify tokens.

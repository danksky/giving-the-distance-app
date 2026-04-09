# Environment Setup

Start with [docs/ENVIRONMENT-CONTRACT.md](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/docs/ENVIRONMENT-CONTRACT.md). That document is the canonical source of truth for which environment uses which auth client, Strava app, and database.

## Quick rules

- Use `.env.local` for local development.
- Treat `.env.preview` and `.env.production` as pulled snapshots of remote environments, not as files Next.js auto-loads locally.
- Keep local and preview aligned with the development Google client, development Strava app, and development database.
- Keep production on separate Google, Strava, and database credentials.

## Minimum local setup

Create `.env.local` from [.env.example](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/.env.example), then fill in:

- `DATABASE_URL`
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_WEBHOOK_VERIFY_TOKEN`

## Useful commands

```bash
openssl rand -base64 32
openssl rand -hex 32
npm run config:audit
```

## Remote environment workflow

1. Pull Preview vars into `.env.preview` when you want to inspect the deployed dev environment.
2. Pull Production vars into `.env.production` for maintenance tasks like migrations.
3. Copy only the values you need for local development into `.env.local`.
4. Re-run `npm run config:audit` after changes.

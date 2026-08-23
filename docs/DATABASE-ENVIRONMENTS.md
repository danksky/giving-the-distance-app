# Database Environments

This repo intentionally keeps development and production on separate Postgres databases.

The canonical environment matrix now lives in [docs/ENVIRONMENT-CONTRACT.md](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/docs/ENVIRONMENT-CONTRACT.md). This page only captures the database split.

## Current model

- Local development uses the development database.
- Preview deployments use the development database.
- Production deployments use the production database.

## Why this split matters

- The same email can exist in both databases as separate user records.
- Local testing and preview testing should never mutate production data.
- Production migrations should be deliberate and handled separately from day-to-day feature work.

## How the app resolves database variables

- Prisma reads `DATABASE_URL`.
- [lib/db.ts](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/lib/db.ts) maps Vercel `POSTGRES_*` variables to `DATABASE_URL` at runtime when needed.
- For local clarity, prefer putting a standard `DATABASE_URL` in `.env.local`.

## Maintenance guidance

- Keep `.env.local` pointed at the development database.
- Use `.env.production` only for production inspection and maintenance tasks.
- After changing env files, run `npm run config:audit`.

## Security note

Tracked documentation should never contain live connection strings or client secrets. If you need the actual values, use the gitignored `.env.*` files or the Vercel dashboard.

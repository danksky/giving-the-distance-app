# Backups

This project backs up the production and preview Neon Postgres databases with nightly GitHub Actions workflows and stores the dumps in a private Backblaze B2 bucket.

## What gets backed up

- Production Postgres database
- Preview Postgres database

## What does not get backed up by these workflows

- Vercel Blob GPX files
- Vercel environment variables
- Third-party provider settings

## Files

- Workflow: [.github/workflows/production-db-backup.yml](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/.github/workflows/production-db-backup.yml)
- Workflow: [.github/workflows/preview-db-backup.yml](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/.github/workflows/preview-db-backup.yml)
- Script: [scripts/backup-production-db.sh](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/scripts/backup-production-db.sh)

## GitHub Actions schedule

- Production runs daily at `06:17 UTC`
- Preview runs daily at `06:47 UTC`
- Both can also be run manually from the Actions tab via `workflow_dispatch`
- Scheduled runs only fire when the workflow file exists on the default GitHub branch, which is currently `main`

## Required GitHub Actions secrets

Add these in GitHub at `Settings > Secrets and variables > Actions`:

- `BACKUP_DATABASE_URL`
  Use the production direct connection string. For this repo that should come from `POSTGRES_URL_NON_POOLING` in `.env.production`, not the pooled connection.
- `PREVIEW_BACKUP_DATABASE_URL`
  Use the preview direct connection string. For this repo that should come from `POSTGRES_URL_NON_POOLING` in `.env.preview`, not the pooled connection.
- `B2_APPLICATION_KEY`
  The Backblaze application key secret

## Recommended GitHub Actions variables

Add these in the same GitHub area under `Variables`:

- `B2_BUCKET`
  Example: `giving-the-distance-backups`
- `B2_KEY_ID`
  The Backblaze application key ID
- `B2_ENDPOINT`
  Your Backblaze S3 endpoint, for example `https://s3.us-east-005.backblazeb2.com`

Optional variables:

- `B2_REGION`
  Defaults to `us-east-005`
- `BACKUP_RETENTION_DAYS`
  Defaults to `30`
- `BACKUP_PREFIX`
  Defaults to `postgres/production`

## Backblaze bucket recommendations

- Bucket visibility: `Private`
- Default encryption: `Enable`
- Object lock: `Disable` for now

## Manual test

After adding the secrets, run the workflow once manually from GitHub Actions to confirm:

1. The dump succeeds.
2. The dump uploads to Backblaze B2.
3. A `.sha256` checksum file is uploaded next to the dump.
4. Production files land under `postgres/production/`.
5. Preview files land under `postgres/preview/`.

## Restore

Download the desired `.dump` file from Backblaze B2, then restore it into a scratch Postgres database first.

Example:

```bash
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$RESTORE_DATABASE_URL" gtd-production-2026-04-15T061700Z.dump
```

If you want a brand new database created as part of restore, use a workflow based on `pg_restore -C` against an administrative database instead.

## Notes

- Dumps are created with `pg_dump --format=custom`.
- The workflow keeps backups for `30` days by default.
- Dump filenames are namespaced by environment, for example `gtd-production-...` and `gtd-preview-...`.
- The workflow does not currently back up Vercel Blob GPX files.

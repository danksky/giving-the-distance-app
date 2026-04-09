# Secrets Management

Secrets belong in gitignored `.env.*` files locally and in Vercel environment variables remotely.

Use [docs/ENVIRONMENT-CONTRACT.md](/Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app/docs/ENVIRONMENT-CONTRACT.md) for the canonical environment split. This page focuses on handling secrets safely.

## Files and responsibilities

- `.env.example` is a commit-safe template.
- `.env.local` is the file Next.js auto-loads for local development.
- `.env.preview` is a pulled snapshot of Preview values for inspection.
- `.env.production` is a pulled snapshot of Production values for maintenance tasks.

## Rules

- Never commit real secrets to git.
- Never paste real connection strings, OAuth client secrets, API keys, or webhook tokens into markdown docs.
- Keep local and preview on development credentials.
- Keep production on separate Google, Strava, and database credentials.
- Rotate any secret that has already been committed or shared in plaintext.

## Useful commands

```bash
openssl rand -base64 32
openssl rand -hex 32
vercel env pull .env.preview --environment preview
vercel env pull .env.production --environment production
npm run config:audit
```

## Recommended storage pattern

- Google OAuth client secrets: Vercel env vars and local `.env.local`
- Strava client secrets: Vercel env vars and local `.env.local`
- Database URLs: Vercel env vars and local `.env.local`
- Webhook verify tokens: Vercel env vars and local `.env.local`
- Slack tokens: Vercel env vars and local `.env.local`

## Follow-up

If a secret was previously committed to tracked docs, treat it as exposed and rotate it in the provider dashboard.

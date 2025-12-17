# Environment Variables Setup

## Local Development (.env.local)

Create a `.env.local` file in the project root with these variables:

```bash
# Database (Get from Vercel Postgres after setup)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Optional (local convenience)
# If you already have a standard `DATABASE_URL`, the app will use it as a fallback
# for `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` during development.
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=  # Generate: openssl rand -base64 32

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Strava OAuth - Development App
# See .env.local for actual values
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=  # Generate: openssl rand -hex 32
```

---

## Vercel Preview Environment

Environment variables for `beta.givingthedistance.org`:

```bash
# NextAuth
NEXTAUTH_URL=https://beta.givingthedistance.org
NEXTAUTH_SECRET=  # Same as local or generate new

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Strava OAuth - Development App
# See .env.local for actual values
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=  # Same as local
```

---

## Vercel Production Environment

Environment variables for `givingthedistance.org`:

```bash
# NextAuth
NEXTAUTH_URL=https://givingthedistance.org
NEXTAUTH_SECRET=  # Generate new for production

# Google OAuth
GOOGLE_CLIENT_ID=  # Production credentials
GOOGLE_CLIENT_SECRET=

# Strava OAuth - Production App (production.givingthedistance@gmail.com)
STRAVA_CLIENT_ID=  # Get from production Strava app
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=  # Generate new
```

---

## Getting Credentials

### 1. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### 2. Generate STRAVA_WEBHOOK_VERIFY_TOKEN

```bash
openssl rand -hex 32
```

### 3. Google OAuth (Google Cloud Console)

1. Go to: https://console.cloud.google.com/
2. Create/select project: "Giving the Distance"
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://beta.givingthedistance.org/api/auth/callback/google`
   - `https://givingthedistance.org/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret

### 4. Strava App Settings

**Development App** (development.givingthedistance@gmail.com):

- Already have credentials (see above)
- Update callback URLs at: https://www.strava.com/settings/api
  - Add: `http://localhost:3000/api/auth/callback/strava`
  - Add: `https://beta.givingthedistance.org/api/auth/callback/strava`

**Production App** (production.givingthedistance@gmail.com):

- Get credentials from: https://www.strava.com/settings/api
- Add callback: `https://givingthedistance.org/api/auth/callback/strava`

### 5. Vercel Postgres

Database URLs are auto-configured when you:

1. Create Vercel Postgres database
2. Link to your project
3. Vercel automatically injects `POSTGRES_*` env vars

---

## Setting Variables in Vercel

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add each variable
3. Select which environments (Production, Preview, Development)
4. Deploy to apply changes

---

## Notes

- Never commit `.env.local` to git
- Keep production and preview credentials separate
- Rotate secrets if exposed
- Use different Google OAuth credentials for dev/prod (recommended)

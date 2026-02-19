# Secrets Management

## ⚠️ IMPORTANT: Actual secrets are stored in `.env.*` files (gitignored)

All secrets are stored in environment files that are:
- ✅ Gitignored (never committed to VCS)
- ✅ Visible in Cursor (via `.cursorignore`)
- ✅ Organized by environment

---

## Environment Files

### `.env.local` - Local Development
- Database connection strings (from Vercel)
- Google OAuth credentials (development)
- Strava development app credentials
- NextAuth secret

**Owner Accounts:**
- Google: Your personal account
- Strava: `development.givingthedistance@gmail.com`

### `.env.production` - Production Deployment
- Database connection strings (from Vercel)
- Google OAuth credentials (production)
- Strava production app credentials
- NextAuth secret (separate from dev)

**Owner Accounts:**
- Google: Production account
- Strava: `production.givingthedistance@gmail.com`

### `.env.example` - Template Only
- NO actual secrets
- Shows what variables are needed
- Safe to commit to git

---

## Setup Instructions

### 1. Google OAuth

**For Development:**
1. Go to: https://console.cloud.google.com/
2. Create project: "Giving the Distance Dev"
3. Enable Google+ API
4. Create OAuth Client:
   - Type: Web application
   - Authorized origins: `http://localhost:3000`, `https://beta.givingthedistance.org`
   - Authorized redirect: 
     - `http://localhost:3000/api/auth/callback/google`
     - `https://beta.givingthedistance.org/api/auth/callback/google`
5. Copy Client ID and Secret to `.env.local`

**For Production:**
- Create separate OAuth client
- Authorized origins: `https://givingthedistance.org`
- Authorized redirect: `https://givingthedistance.org/api/auth/callback/google`
- Copy credentials to `.env.production`

### 2. Vercel Postgres

```bash
# After creating database in Vercel:
vercel env pull .env.local
```

This auto-populates database connection strings.

### 3. Generate Secrets

```bash
# NextAuth secret (for .env.local and .env.production)
openssl rand -base64 32

# Strava webhook token (for .env.production)
openssl rand -hex 32
```

---

## Strava App Configuration

### Development App
- **Owner**: development.givingthedistance@gmail.com
- **Credentials**: See `.env.local`
- **Callback URLs**: 
  - `http://localhost:3000/api/auth/callback/strava`
  - `https://beta.givingthedistance.org/api/auth/callback/strava`

### Production App
- **Owner**: production.givingthedistance@gmail.com
- **Credentials**: See `.env.production`
- **Callback URL**: `https://givingthedistance.org/api/auth/callback/strava`

---

## Vercel Environment Variables

Copy values from local `.env` files to Vercel Dashboard:

**Project Settings → Environment Variables**

### For Preview Environment
- Copy from `.env.local`
- Set environment: `Preview`
- Update `NEXTAUTH_URL=https://beta.givingthedistance.org`

### For Production Environment
- Copy from `.env.production`
- Set environment: `Production`
- Generate new `NEXTAUTH_SECRET` for production

---

## Security Checklist

- ✅ All `.env.*` files are in `.gitignore`
- ✅ `.env.example` contains NO actual secrets
- ✅ `.cursorignore` allows viewing `.env.*` in Cursor
- ✅ Separate credentials for dev/preview/prod
- ✅ Markdown docs contain NO secrets
- ⚠️ Never commit `.env.local` or `.env.production`
- ⚠️ Rotate secrets immediately if exposed

---

## Quick Reference

```bash
# View local secrets
cat .env.local

# View production secrets
cat .env.production

# Generate new secrets
openssl rand -base64 32  # NextAuth
openssl rand -hex 32     # Strava webhook

# Pull Vercel environment
vercel env pull .env.local
```


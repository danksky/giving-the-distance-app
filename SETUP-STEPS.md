# Setup Steps - Quick Start Guide

Follow these steps to get the app running locally and deployed to Vercel.

---

## ✅ Step 1: Project Created

- [x] Next.js app created
- [x] Dependencies installed (NextAuth.js, Prisma)
- [x] Prisma schema defined
- [x] Database client created

---

## 🔲 Step 2: Set Up Vercel Postgres

### 2.1 Create Database in Vercel

1. Go to: https://vercel.com/dashboard
2. Click "Storage" → "Create Database"
3. Select "Postgres"
4. Name it: `giving-the-distance-dev` (for preview) or `giving-the-distance-prod`
5. Select region: `US East (iad1)` (or closest to you)
6. Click "Create"

### 2.2 Link Database to Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
cd /Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app
vercel link

# Pull environment variables (includes POSTGRES_* vars)
vercel env pull .env.local
```

This will create `.env.local` with database connection strings.

---

## 🔲 Step 3: Configure Google OAuth

### 3.1 Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Create new project: "Giving the Distance"
3. Enable **Google+ API**

### 3.2 Create OAuth Credentials

1. Go to: **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: "Giving the Distance - Development"

5. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://beta.givingthedistance.org`

6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://beta.givingthedistance.org/api/auth/callback/google`

7. Click **Create**
8. Copy **Client ID** and **Client Secret**

### 3.3 Add to .env.local

```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

---

## 🔲 Step 4: Configure Strava OAuth

### 4.1 Update Strava App Callback URLs

1. Login to Strava with: `development.givingthedistance@gmail.com`
2. Go to: https://www.strava.com/settings/api
3. Update **Authorization Callback Domain**:
   - Add: `localhost`
   - Add: `beta.givingthedistance.org`

### 4.2 Generate Webhook Token

```bash
openssl rand -hex 32
```

### 4.3 Add to .env.local

Already have Client ID and Secret. Add:

```bash
STRAVA_WEBHOOK_VERIFY_TOKEN=your-generated-token-here
```

---

## 🔲 Step 5: Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Add to `.env.local`:

```bash
NEXTAUTH_SECRET=your-generated-secret-here
```

---

## 🔲 Step 6: Push Database Schema

```bash
npm run db:push
```

This creates all tables in Vercel Postgres.

---

## 🔲 Step 7: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🔲 Step 8: Deploy to Vercel

### 8.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 8.2 Import to Vercel

1. Go to: https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`

### 8.3 Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

Add all variables from `.env.local` for:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 🔲 Step 9: Configure Custom Domains

### 9.1 Add Domains in Vercel

1. Go to: Project Settings → Domains
2. Add domains:
   - Production: `givingthedistance.org`
   - Preview: `beta.givingthedistance.org`

### 9.2 Update DNS Records

In your domain registrar (Squarespace):

**For givingthedistance.org**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**For beta.givingthedistance.org**:
```
Type: CNAME
Name: beta
Value: cname.vercel-dns.com
```

### 9.3 Update Environment Variables

Update `NEXTAUTH_URL` for each environment:
- Preview: `https://beta.givingthedistance.org`
- Production: `https://givingthedistance.org`

---

## 🔲 Step 10: Test OAuth Flow

1. Visit your deployed app
2. Click "Sign in with Google"
3. Authorize
4. Click "Connect Strava"
5. Authorize Strava
6. Verify activity sync works

---

## Troubleshooting

### Database Connection Issues
```bash
# Check if env vars are loaded
npm run db:studio
```

### OAuth Redirect Mismatch
- Verify callback URLs in Google Console match exactly
- Check `NEXTAUTH_URL` in environment variables

### Strava Webhook Not Working
- Webhooks require HTTPS
- Use ngrok for local testing: `ngrok http 3000`

---

## Next Steps After Setup

1. Build landing page
2. Build sign-in page
3. Build dashboard with activity feed
4. Set up Strava webhook subscription
5. Add activity sync
6. (Future) Add sponsorship features

---

## Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:push          # Push schema changes to database

# Deployment
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
vercel env pull          # Pull environment variables
```


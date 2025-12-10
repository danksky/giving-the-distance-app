# Giving the Distance - Migration Guide

## Overview
Migrating from **React + Express + AWS** to **Next.js + Vercel Postgres**

---

## Architecture Comparison

### OLD Stack (React + Express)
- **Frontend**: React (CRA) on AWS S3/CloudFront
- **Backend**: Express on AWS EC2
- **Auth**: AWS Cognito
- **Database**: AWS DynamoDB
- **Domain**: beta.api.givingthedistance.org (API) + beta.givingthedistance.org (Frontend)

### NEW Stack (Next.js Unified)
- **Frontend + Backend**: Next.js on Vercel
- **Auth**: NextAuth.js (Google OAuth + Strava connection)
- **Database**: Vercel Postgres
- **Domain**: givingthedistance.org (unified) + beta.givingthedistance.org (preview)

---

## Migration Steps

### ✅ Step 1: Project Setup
- [x] Create Next.js app with TypeScript + Tailwind
- [ ] Install core dependencies
- [ ] Create migration documentation

### 🔲 Step 2: Database Setup
- [ ] Set up Vercel Postgres
- [ ] Design schema (migrate from DynamoDB model)
- [ ] Set up Prisma ORM
- [ ] Create migrations

### 🔲 Step 3: Authentication Setup
- [ ] Install NextAuth.js
- [ ] Configure Google OAuth provider
- [ ] Configure Strava as connected account
- [ ] Create auth callback routes
- [ ] Set up session management

### 🔲 Step 4: Core API Routes
- [ ] `/api/auth/*` - Authentication endpoints
- [ ] `/api/user` - User management
- [ ] `/api/strava/*` - Strava integration
- [ ] `/api/sponsorship/*` - Sponsorship management
- [ ] `/api/stripe/*` - Payment processing

### 🔲 Step 5: Frontend Pages
- [ ] Landing page (/)
- [ ] Sign in page (/signin)
- [ ] Dashboard (/dashboard)
- [ ] Profile page (/profile)
- [ ] Sponsorships page (/sponsorships)

### 🔲 Step 6: Integrations
- [ ] Strava OAuth + Webhook
- [ ] Stripe payment processing
- [ ] Stripe webhooks

### 🔲 Step 7: Deployment Setup
- [ ] Configure Vercel project
- [ ] Set up environment variables
- [ ] Configure custom domains
- [ ] Set up preview environment

### 🔲 Step 8: DNS Configuration
- [ ] Point givingthedistance.org to Vercel (production)
- [ ] Point beta.givingthedistance.org to Vercel (preview)
- [ ] Remove old Route53 records (if any)

### 🔲 Step 9: Testing & Migration
- [ ] Test OAuth flows
- [ ] Test payment processing
- [ ] Migrate existing user data (if any)
- [ ] Test webhooks

### 🔲 Step 10: Go Live
- [ ] Deploy to production
- [ ] Monitor errors
- [ ] Decommission old infrastructure

---

## Domain Setup

### Production Environment
```
Domain: givingthedistance.org
Branch: main
Environment: production

Frontend: https://givingthedistance.org/*
API: https://givingthedistance.org/api/*
```

### Preview Environment
```
Domain: beta.givingthedistance.org
Branch: develop (or any non-main branch)
Environment: preview

Frontend: https://beta.givingthedistance.org/*
API: https://beta.givingthedistance.org/api/*
```

### DNS Configuration (at Domain Registrar)
```
Type    Name    Value
A       @       76.76.21.21 (Vercel)
CNAME   beta    cname.vercel-dns.com
```

---

## Environment Variables Needed

### Google OAuth
```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Strava Integration
```bash
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=
```

### Stripe
```bash
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

### NextAuth
```bash
NEXTAUTH_SECRET=  # Generate: openssl rand -base64 32
NEXTAUTH_URL=https://givingthedistance.org
```

### Database
```bash
POSTGRES_URL=  # Auto-configured by Vercel
POSTGRES_PRISMA_URL=  # Auto-configured by Vercel
```

---

## Key Differences from Old App

### Authentication Flow
**OLD**: AWS Cognito → JWT tokens → Manual verification
**NEW**: NextAuth.js → Session cookies → Automatic middleware

### Database Queries
**OLD**: DynamoDB DocumentClient → NoSQL queries
**NEW**: Prisma → SQL queries with TypeScript types

### API Structure
**OLD**: Express routes in separate files
**NEW**: Next.js API routes in `app/api/*/route.ts`

### OAuth Callbacks
**OLD**: Separate domain (beta.api.givingthedistance.org)
**NEW**: Same domain (givingthedistance.org/api/auth/callback/strava)

---

## Data Model Migration

### User Table (DynamoDB → Postgres)

**OLD (DynamoDB)**:
```javascript
{
  ID: "uuid",
  CREATED_ON: "timestamp",
  EMAIL: "email",
  STRAVA_ATHLETE_ID: "number"
}
```

**NEW (Postgres)**:
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  name VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR,  -- 'google' or 'strava'
  provider_account_id VARCHAR,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT
)
```

---

## Next Steps

1. ✅ **COMPLETED**: Created Next.js app
2. **CURRENT**: Review this migration guide
3. **NEXT**: Install dependencies and set up database schema

---

## Notes

- Old Express routes in: `giving-the-distance-express/routes/`
- Old React screens in: `giving-the-distance-react/src/screens/`
- Old DynamoDB utilities in: `giving-the-distance-express/util/dynamodb/`
- Reference these for business logic when building new app

---

## Questions & Decisions

- [x] Use single domain vs separate API subdomain? → **Single domain**
- [x] AWS vs Vercel services? → **Vercel Postgres**
- [x] Google OAuth for primary login? → **Yes**
- [ ] Migrate existing users or start fresh?
- [ ] Keep Cognito user pool temporarily for data export?


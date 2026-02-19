# Vercel Deployment Notes

## Important: Database Schema Updates

When deploying schema changes to Vercel, follow these steps:

### For Preview Environment (beta.givingthedistance.org)

The preview database schema has already been updated via `prisma db push`. The deployment will work automatically because:

1. ✅ Database schema is already in sync (ran `prisma db push` locally)
2. ✅ `postinstall` script generates Prisma Client during build
3. ✅ Build will succeed on Vercel

**Simply push to the `preview` branch:**

```bash
git add .
git commit -m "Add Strava webhook integration"
git push origin preview
```

### For Production Environment (givingthedistance.org)

When you're ready to deploy to production, you need to update the production database schema first:

**Option 1: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Pull production environment variables
vercel env pull .env.production.local

# Push schema to production database
npx prisma db push
```

**Option 2: Via Database Migration**

```bash
# Create a migration
npx prisma migrate dev --name add_webhook_subscription

# Deploy migration to production
npx prisma migrate deploy
```

**Option 3: Manual via Prisma Studio**
Connect to production database and run the schema update manually.

## Build Process on Vercel

When Vercel builds your app:

1. **Install dependencies**: `npm install`
2. **Postinstall hook**: `prisma generate` (generates client with latest schema)
3. **Build**: `next build` (compiles TypeScript with generated client)
4. **Deploy**: Deploys the built application

## Troubleshooting

### Error: Property 'stravaWebhookSubscription' does not exist

**Cause**: Prisma Client not generated with latest schema

**Solution**:

- Make sure `postinstall` script exists in package.json
- Clear Vercel build cache and redeploy
- Verify database schema is up to date

### Database Connection Issues

**Cause**: Environment variables not set correctly

**Solution**:

- Check all env vars are set in Vercel dashboard
- Verify database URLs are correct for each environment
- Test connection with `npx prisma db pull`

## Environment-Specific Deployments

### Preview Branch → Preview Environment

- Branch: `preview`
- Domain: `beta.givingthedistance.org`
- Database: Preview/Development database
- Auto-deploy: Yes

### Production Branch → Production Environment

- Branch: `production`
- Domain: `givingthedistance.org`
- Database: Production database
- Auto-deploy: Yes

## Post-Deployment Steps

After deploying webhook changes:

1. **Verify deployment succeeded**
2. **Create webhook subscription**:
   ```bash
   curl -X POST https://beta.givingthedistance.org/api/strava/webhook/subscribe \
     -H "Content-Type: application/json" \
     -d '{"callbackUrl": "https://beta.givingthedistance.org/api/strava/webhook"}'
   ```
3. **Test webhook** by completing an activity on Strava
4. **Monitor logs** in Vercel dashboard

## Useful Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Redeploy (with cache cleared)
vercel --force

# Pull environment variables
vercel env pull
```

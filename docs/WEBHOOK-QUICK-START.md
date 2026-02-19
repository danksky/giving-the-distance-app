# Strava Webhooks - Quick Start

## What Was Added

### 1. Database Schema

- **New Model**: `StravaWebhookSubscription` - tracks webhook subscriptions
- **Existing Model**: `Activity` - already exists, now populated automatically

### 2. API Endpoints

#### Webhook Receiver

- **Path**: `/api/strava/webhook`
- Handles verification (GET) and events (POST)
- Automatically fetches and stores activity details

#### Subscription Manager

- **Path**: `/api/strava/webhook/subscribe`
- GET: View subscriptions
- POST: Create subscription
- DELETE: Remove subscription

### 3. Dashboard Updates

- Displays recent activities in a table
- Shows distance (km/mi), time, elevation, type
- Auto-refreshes when new activities come in

## Setup Instructions

### Step 1: Run Database Migration

```bash
# In the app directory
cd /Users/danielkawalsky/Documents/Code/GivingTheDistance/giving-the-distance-app

# Run migration (requires .env.local with database credentials)
npx prisma migrate dev --name add_webhook_subscription

# Or generate client only (if migration already exists in production)
npx prisma generate
```

### Step 2: Deploy to Vercel

Push your changes to the `preview` branch to deploy to beta:

```bash
git add .
git commit -m "Add Strava webhook integration for activity tracking"
git push origin preview
```

### Step 3: Create Webhook Subscription

Once deployed, create the webhook subscription:

**Option A: Using curl**

```bash
curl -X POST https://beta.givingthedistance.org/api/strava/webhook/subscribe \
  -H "Content-Type: application/json" \
  -d '{"callbackUrl": "https://beta.givingthedistance.org/api/strava/webhook"}'
```

**Option B: Using browser console**

```javascript
fetch("https://beta.givingthedistance.org/api/strava/webhook/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    callbackUrl: "https://beta.givingthedistance.org/api/strava/webhook",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

### Step 4: Test It!

1. Go to https://beta.givingthedistance.org
2. Sign in and connect Strava
3. Complete an activity on Strava (or edit an existing one)
4. Check your dashboard - activity should appear!

## Verify Setup

Check if subscription is active:

```bash
curl https://beta.givingthedistance.org/api/strava/webhook/subscribe
```

Expected response:

```json
{
  "strava": [
    {
      "id": 12345,
      "callback_url": "https://beta.givingthedistance.org/api/strava/webhook",
      "created_at": "2024-12-10T...",
      "updated_at": "2024-12-10T..."
    }
  ],
  "database": [...]
}
```

## For Production

When ready to deploy to production:

1. Deploy to `production` branch
2. Create webhook subscription for production domain:
   ```bash
   curl -X POST https://givingthedistance.org/api/strava/webhook/subscribe \
     -H "Content-Type: application/json" \
     -d '{"callbackUrl": "https://givingthedistance.org/api/strava/webhook"}'
   ```

## Monitoring

- Check Vercel logs to see webhook events being received
- Look for console logs like:
  - `📨 Received Strava webhook event`
  - `🏃 Activity create event for activity...`
  - `✅ Activity saved successfully`

## Troubleshooting

**Problem**: Webhook verification fails

- **Solution**: Check `STRAVA_WEBHOOK_VERIFY_TOKEN` is set correctly in Vercel

**Problem**: Activities not appearing

- **Solution**: Check that user has granted `activity:read_all` permission

**Problem**: "No user found for Strava athlete"

- **Solution**: Make sure user has connected their Strava account in the dashboard

## Next Steps

- ✅ Webhooks working
- ✅ Activities displayed in dashboard
- 🔄 Add activity filtering/sorting in dashboard
- 🔄 Add webhook management UI in dashboard
- 🔄 Add activity sync button (manual refresh)
- 🔄 Add webhook event logs table

# Strava App Configuration

## Overview
Two separate Strava OAuth apps for development and production environments.

---

## Development App

**Owner Account**: `development.givingthedistance@gmail.com`

**App Name**: Giving the Distance (Development)

**Environment**: Preview/Beta
- Domain: `beta.givingthedistance.org`
- Vercel Environment: `preview`
- Git Branch: `develop` (or any non-main branch)

**OAuth Callback URLs**:
```
https://beta.givingthedistance.org/api/auth/callback/strava
http://localhost:3000/api/auth/callback/strava  (for local testing)
```

**Webhook Subscription URL**:
```
https://beta.givingthedistance.org/api/strava/webhook
```

**Required Secrets**:
```bash
# Get these from Strava App settings at:
# https://www.strava.com/settings/api

STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=  (create a random string)
```

---

## Production App

**Owner Account**: `production.givingthedistance@gmail.com`

**App Name**: Giving the Distance

**Environment**: Production
- Domain: `givingthedistance.org`
- Vercel Environment: `production`
- Git Branch: `main`

**OAuth Callback URLs**:
```
https://givingthedistance.org/api/auth/callback/strava
```

**Webhook Subscription URL**:
```
https://givingthedistance.org/api/strava/webhook
```

**Required Secrets**:
```bash
# Get these from Strava App settings at:
# https://www.strava.com/settings/api

STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=  (create a random string)
```

---

## Strava API Scopes

The app requests the following permissions from users:

- `activity:read` - Read user's activities
- `activity:read_all` - Read all activities (including private)
- `profile:read_all` - Read profile information

---

## Webhook Events

The app subscribes to:
- `create` - New activity created
- `update` - Activity updated
- `delete` - Activity deleted

---

## Setup Instructions

### 1. Access Strava API Settings
- Development: Log in to `development.givingthedistance@gmail.com`
- Production: Log in to `production.givingthedistance@gmail.com`
- Go to: https://www.strava.com/settings/api

### 2. Get Client Credentials
- Copy `Client ID`
- Copy `Client Secret`

### 3. Configure OAuth Callback URLs
Add the appropriate callback URL for your environment

### 4. Create Webhook Verify Token
```bash
# Generate a random token
openssl rand -hex 32
```

### 5. Set Environment Variables in Vercel
- Go to Vercel Project Settings → Environment Variables
- Add variables for the appropriate environment

---

## Testing Locally

When testing locally, make sure to:
1. Use development Strava app credentials
2. Update Strava callback URLs to include `http://localhost:3000`
3. Use ngrok for webhook testing (webhooks require HTTPS)

```bash
# Install ngrok
npm install -g ngrok

# Forward local server
ngrok http 3000

# Use ngrok URL for webhook subscription:
# https://YOUR-NGROK-URL.ngrok.io/api/strava/webhook
```

---

## Notes

- Keep credentials separate for dev/prod environments
- Never commit secrets to git
- Rotate secrets if compromised
- Monitor webhook delivery in Strava API settings


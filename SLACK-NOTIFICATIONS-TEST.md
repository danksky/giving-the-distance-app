# Testing Slack Notifications

This document provides instructions for testing the newly implemented Slack notifications.

## Prerequisites

Ensure your `.env.local` file has the following Slack configuration:

```bash
SLACK_BOT_TOKEN="xoxb-..."
SLACK_CHANNEL="#gtd-engineering-hub"
```

## Test Scenarios

### 1. Test New User Registration

**Steps:**

1. Sign out if you're currently logged in
2. Navigate to the homepage
3. Click "Sign in with Google"
4. Complete the Google OAuth flow with a new account

**Expected Slack Notification:**

```
👋 New User Joined
Name: [User Name]
Email: [User Email]
Joined: [Timestamp]
```

**Code Location:** `auth.ts` - `createUser` event handler

---

### 2. Test Strava Authorization Success

**Steps:**

1. Log in to your account
2. Navigate to Settings → Strava
3. Click "Connect Strava"
4. Grant ALL requested permissions:
   - View data about your private activities
   - View data about your activities
   - Update your activities

**Expected Slack Notification:**

```
✅ Strava Authorization Successful
User: [User Name]
Email: [User Email]
Strava Athlete ID: [Athlete ID]
Granted Scopes: activity:read_all, profile:read_all, activity:write
Authorized: [Timestamp]
```

**Code Location:** `auth.ts` - `linkAccount` event handler for Strava provider

---

### 3. Test Strava Authorization Failure

**Steps:**

1. Log in to your account
2. Navigate to Settings → Strava
3. Click "Connect Strava"
4. When the Strava authorization page appears, **deny** one or more permissions
5. Click "Authorize"

**Expected Slack Notification:**

```
❌ Strava Authorization Failed
User: [User Name]
Email: [User Email]
Error: Missing required permissions: [list of missing permissions]
Missing Scopes: [list]
Failed: [Timestamp]
```

**Code Location:** `auth.ts` - `signIn` callback with permission validation

---

### 4. Test New Activity Created

**Steps:**

1. Ensure Strava is connected with all permissions
2. Create a new activity on Strava:
   - Open the Strava mobile app
   - Record a new activity (or manually create one)
   - Save the activity
3. Wait for the webhook to fire (usually within seconds)

**Expected Slack Notification:**

```
🎉 New Activity Created
Activity: [Activity Name]
Type: [Run/Ride/etc.]
Distance: [X.XX] km ([X.XX] mi)
Strava ID: [Activity ID]
User: [User Name]
Email: [User Email]
Created: [Timestamp]
```

**Code Location:** `app/api/strava/webhook/route.ts` - `create` event handler

**Troubleshooting:**

- Check console logs for webhook receipt: `📨 Received Strava webhook event`
- Verify webhook is subscribed: Visit `/api/strava/webhook/subscribe`
- Check Strava webhook settings in your Strava app configuration

---

### 5. Test Activity Deleted

**Steps:**

1. Ensure you have at least one activity synced from Strava
2. Go to Strava (web or mobile)
3. Delete one of your activities
4. Wait for the webhook to fire

**Expected Slack Notification:**

```
🗑️ Activity Deleted
Activity: [Activity Name]
Type: [Run/Ride/etc.]
Strava ID: [Activity ID]
User: [User Name]
Email: [User Email]
Deleted: [Timestamp]
```

**Code Location:** `app/api/strava/webhook/route.ts` - `delete` event handler

---

## Checking Slack Channel

After each test:

1. Go to your Slack workspace
2. Navigate to the configured channel (default: `#gtd-engineering-hub`)
3. Verify the notification appeared with correct formatting and data

## Debugging

If notifications don't appear:

1. **Check environment variables:**

   ```bash
   echo $SLACK_BOT_TOKEN
   echo $SLACK_CHANNEL
   ```

2. **Check console logs:**

   - Look for "✅ Slack notification sent successfully"
   - Or "Error sending Slack notification:" with error details

3. **Verify Slack bot permissions:**

   - Bot must have `chat:write` scope
   - Bot must be added to the target channel

4. **Check Slack API directly:**
   Use curl to test the Slack API:

   ```bash
   curl -X POST https://slack.com/api/chat.postMessage \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
     -d '{
       "channel": "#gtd-engineering-hub",
       "text": "Test message"
     }'
   ```

5. **Review webhook logs:**
   - Check `/admin/webhooks` page for webhook event processing status
   - Look for `processingError` fields in the database

## Error Handling

All Slack notifications are wrapped in try-catch blocks:

- If Slack is unavailable, the notification fails silently
- The main operation (activity creation, user signup, etc.) always succeeds
- Errors are logged but don't break the user experience

## Integration Test Checklist

- [ ] New user registration notification works
- [ ] Strava authorization success notification works
- [ ] Strava authorization failure notification works
- [ ] New activity created notification works
- [ ] Activity deleted notification works
- [ ] Notifications have correct formatting
- [ ] Notifications include all required fields
- [ ] Timestamps are properly formatted
- [ ] User information is accurate
- [ ] Error handling works (test with invalid Slack token)

## Notes

- Slack notifications are **non-blocking** - they never prevent the main operation from succeeding
- If `SLACK_BOT_TOKEN` or `SLACK_CHANNEL` is not configured, notifications are skipped gracefully
- All notifications use Slack's Block Kit for rich formatting
- Timestamps use Slack's date formatting for automatic timezone conversion

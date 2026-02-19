# Slack Notifications

This document describes the Slack notification system implemented in the application.

## Overview

The application sends real-time notifications to a configured Slack channel for key events. This helps the team monitor user activity, system events, and potential issues.

## Configuration

Slack notifications are configured via environment variables:

```bash
SLACK_BOT_TOKEN="xoxb-..."
SLACK_CHANNEL="#gtd-engineering-hub"
```

If these environment variables are not set, notifications will be skipped gracefully (logged to console only).

## Notification Events

### 1. New Activity Created 🎉

**Triggered when:** A user creates a new activity on Strava, and it's synced via the webhook.

**Location:** `app/api/strava/webhook/route.ts` (create event handler)

**Information included:**

- Activity name
- Activity type (Run, Ride, etc.)
- Distance (in km and miles)
- Strava Activity ID
- User name and email
- Timestamp

**Example notification:**

```
🎉 New Activity Created
Activity: Morning Run
Type: Run
Distance: 5.2 km (3.23 mi)
Strava ID: 12345678
User: John Doe
Email: john@example.com
Created: Dec 18, 2025 at 10:30 AM
```

### 2. Activity Deleted 🗑️

**Triggered when:** A user deletes an activity on Strava, and the deletion is synced via the webhook.

**Location:** `app/api/strava/webhook/route.ts` (delete event handler)

**Information included:**

- Activity name
- Activity type
- Strava Activity ID
- User name and email
- Timestamp

**Example notification:**

```
🗑️ Activity Deleted
Activity: Morning Run
Type: Run
Strava ID: 12345678
User: John Doe
Email: john@example.com
Deleted: Dec 18, 2025 at 11:45 AM
```

### 3. New User Joined 👋

**Triggered when:** A new user creates an account (via Google or Strava OAuth).

**Location:** `auth.ts` (createUser event)

**Information included:**

- User name
- User email
- Timestamp

**Example notification:**

```
👋 New User Joined
Name: Jane Smith
Email: jane@example.com
Joined: Dec 18, 2025 at 9:15 AM
```

### 4. Strava Authorization Success ✅

**Triggered when:** A user successfully connects their Strava account with all required permissions.

**Location:** `auth.ts` (linkAccount event for Strava)

**Information included:**

- User name and email
- Strava Athlete ID
- Granted permissions (scopes)
- Timestamp

**Example notification:**

```
✅ Strava Authorization Successful
User: John Doe
Email: john@example.com
Strava Athlete ID: 12345678
Granted Scopes: activity:read_all, profile:read_all, activity:write
Authorized: Dec 18, 2025 at 9:20 AM
```

### 5. Strava Authorization Failed ❌

**Triggered when:** A user attempts to connect Strava but doesn't grant all required permissions, or the authorization fails.

**Location:** `auth.ts` (signIn callback for Strava)

**Information included:**

- User name and email (if available)
- Error message
- Missing permissions (if applicable)
- Timestamp

**Example notification:**

```
❌ Strava Authorization Failed
User: John Doe
Email: john@example.com
Error: Missing required permissions: activity:write. Please reconnect and grant ALL requested permissions.
Missing Scopes: activity:write
Failed: Dec 18, 2025 at 9:18 AM
```

### 6. Strava De-authorization 🔓

**Triggered when:** A user revokes access to the app from their Strava settings.

**Location:** `app/api/strava/webhook/route.ts` (athlete update event handler)

**Information included:**

- User name and email
- Strava Athlete ID
- Timestamp

**Example notification:**

```
🔓 Strava De-authorization
User: John Doe
Email: john@example.com
Strava Athlete ID: 12345678
De-authorized: Dec 18, 2025 at 4:30 PM
```

### 7. Google Place Selection 🏢

**Triggered when:** A potential sponsor selects their business from the Google Places autocomplete on the sponsor landing page.

**Location:** `components/BusinessSearchPreview.tsx` → `app/api/google-place-selection/route.ts`

**Information included:**

- Business name
- Business location (formatted address)
- Google Place ID
- Link to view on Google Maps
- Timestamp

**Example notification:**

```
🏢 Google Place Selected
Business Name: Joe's Coffee Shop
Location: 123 Main St, Brooklyn, NY 11201, USA
Place ID: ChIJd8BlQ2BZwokRjMKZFEDZFeo
Google Maps: View on Maps
Selected: Dec 18, 2025 at 2:15 PM
```

## Implementation Details

### Slack Notification Helper

All Slack notifications are handled by functions in `lib/slack-notifications.ts`:

- `notifyNewActivity()` - New activity created
- `notifyActivityDeleted()` - Activity deleted
- `notifyNewUser()` - New user joined
- `notifyStravaAuthSuccess()` - Strava authorization succeeded
- `notifyStravaAuthFailure()` - Strava authorization failed
- `notifyStravaDeauthorization()` - Strava de-authorization
- `notifyGooglePlaceSelection()` - Google place selected by potential sponsor

Each function:

1. Checks if Slack is configured (SLACK_BOT_TOKEN and SLACK_CHANNEL)
2. Formats a rich message using Slack's Block Kit
3. Sends the message via the Slack API
4. Logs errors but doesn't fail the main operation if Slack is down

### Error Handling

All Slack notifications are wrapped in try-catch blocks to ensure they never break the main application flow. If a notification fails to send:

1. The error is logged to the console
2. The main operation continues successfully
3. The user experience is not affected

### Message Format

All notifications use Slack's Block Kit for rich formatting with:

- Header section with emoji and title
- Field sections for key-value data
- Context section with formatted timestamp

## Testing

To test Slack notifications:

1. Ensure your `.env.local` has valid Slack credentials
2. Create a test activity on Strava
3. Delete an activity on Strava
4. Sign up a new user
5. Connect/disconnect Strava
6. Check the configured Slack channel for notifications

## Future Enhancements

Potential additions:

- Sponsor match notifications (when an activity matches with a sponsor)
- Campaign creation/update notifications
- Sponsor contact form submission notifications (when a potential sponsor submits their contact info)
- Error/warning notifications for system issues
- Weekly/monthly summary reports
- Charity selection notifications
- Additional Google Place details (rating, hours, phone number, website)

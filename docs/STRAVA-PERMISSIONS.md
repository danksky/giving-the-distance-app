# Strava Permission Validation

## Overview

This app requires specific Strava permissions to function properly. We validate that users grant all required permissions during the OAuth flow.

## Required Permissions

1. **`activity:read_all`** - Read all activities (public and private)

   - Needed to fetch user's workout data
   - Used for sponsorship tracking

2. **`profile:read_all`** - Read detailed profile information

   - Needed to display athlete information
   - Used for user identification

3. **`activity:write`** - Create and update activities
   - Needed to add donation messages to user activities
   - Used to track which activities inspired donations

## How It Works

### 1. Authorization Request

When users click "Connect Strava", they're redirected to Strava with:

```typescript
scope: "activity:read_all,profile:read_all,activity:write";
approval_prompt: "force"; // Always show permission screen
```

### 2. Permission Validation

After successful OAuth, we validate the granted scopes:

```typescript
// In auth.ts - signIn callback
const requiredScopes = [
  "activity:read_all",
  "profile:read_all",
  "activity:write",
];
const grantedScopes = (account.scope || "").split(",").map((s) => s.trim());

const missingScopes = requiredScopes.filter(
  (scope) => !grantedScopes.includes(scope)
);

if (missingScopes.length > 0) {
  throw new Error(
    `Missing required permissions: ${missingScopes.join(", ")}. ` +
      "Please reconnect and grant all requested permissions."
  );
}
```

### 3. Error Handling

If permissions are missing:

- The connection is rejected
- User is redirected to `/dashboard?error=...`
- Error message displays on dashboard
- User can try connecting again

### 4. UI Indicators

The dashboard shows:

- Required permissions before connection
- Error messages if connection fails
- Clear instructions to grant all permissions

## Strava's Permission Model

**Important:** Strava uses an "all-or-nothing" permission model. Users cannot selectively grant permissions - they must approve all requested scopes or deny the connection entirely.

When a user clicks "Authorize" on Strava:

- ✅ All requested scopes are granted
- ❌ If they click "Cancel", no scopes are granted

## Testing Permission Validation

To test the validation:

1. **Normal Flow:**

   - Go to `/dashboard`
   - Click "Connect Strava"
   - Click "Authorize" on Strava
   - Should successfully connect

2. **Denied Flow:**
   - Go to `/dashboard`
   - Click "Connect Strava"
   - Click "Cancel" on Strava
   - Should redirect back with error

## Stored Permissions

The granted permissions are stored in the database:

```typescript
stravaAthlete.permissionsGranted =
  "read,activity:read_all,profile:read_all,activity:write";
```

This allows us to:

- Audit what permissions each user has granted
- Check if we need to request re-authorization
- Track permission changes over time

## Adding New Permissions

If you need additional permissions in the future:

1. Update `auth.config.ts` - add new scope to the authorization params
2. Update validation in `auth.ts` - add new scope to `requiredScopes` array
3. Update error page - add description for new permission
4. **Important:** Existing users will need to disconnect and reconnect to grant new permissions

## Strava Permission Reference

Common Strava scopes:

- `read` - Basic read access (always included)
- `read_all` - Read all data including private
- `profile:read_all` - Read all profile data
- `activity:read` - Read public activities
- `activity:read_all` - Read all activities (public + private)
- `activity:write` - Create/update activities

See: https://developers.strava.com/docs/authentication/

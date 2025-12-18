# Activity Privacy System

## Overview

All activity profiles are **private by default**. Users can choose to make individual activities public, which shows their real name and profile picture. When private, visitors see anonymized information.

## Privacy Rules

### Default Behavior (Private)

- Visitor sees: `D•••••` (first initial + 5 bullets)
- Avatar: Generic gradient placeholder (`/avatar-placeholder.png`)
- Activity details (distance, time, etc.) are still visible
- Charity and donation information is still visible

### Public Profile (User Opt-In)

- Visitor sees: Real name and profile picture
- Owner can toggle this per-activity

### Owner View

- Owners ALWAYS see their own real information
- Owners have a "Privacy Settings" toggle on their activity pages

## Database Schema

```prisma
model Activity {
  // ...
  isPublicProfile Boolean @default(false) // User can make their profile public on this activity
  // ...
}
```

## Implementation Files

### Core Privacy Logic

- `lib/activity-privacy.ts` - Helper functions:
  - `anonymizeName()` - Converts "Daniel" to "D•••••"
  - `canViewRealProfile()` - Checks if viewer can see real details
  - `getDisplayName()` - Returns real or anonymized name
  - `getDisplayAvatar()` - Returns real or placeholder avatar

### API Endpoint

- `app/api/activities/[id]/public/route.ts` - Toggle public profile setting
  - POST with `{ isPublic: boolean }`
  - Only activity owner can update

### UI Components

- `components/ActivityPrivacyToggle.tsx` - Client component for owners to toggle privacy
- `app/activities/[id]/page.tsx` - Updated to use privacy system

### Assets

- `public/avatar-placeholder.png` - Generic gradient placeholder for private profiles

## Sponsor Page Integration

Sponsor pages will link to individual activities, showing anonymized athlete information:

```typescript
// Athlete name is always anonymized on sponsor pages
<Link href={`/activities/${activity.id}`}>
  D••••• // First initial + bullets
</Link>
```

When clicked:

- If activity is **private** → Visitor sees anonymized profile
- If activity is **public** → Visitor sees real name and photo
- If viewer is **owner** → Always sees real information

## Deleted Activities

Deleted activities (soft delete with `deletedAt`) work seamlessly with privacy:

1. Activity page returns 404 for deleted activities
2. Dashboard shows "[Deleted Activity]" for owner
3. Sponsor pages show commitment data (since it's already anonymized)
4. No special handling needed - privacy system handles everything

## Migration

Migration created: `20251217180003_add_is_public_profile`

```sql
ALTER TABLE "activities" ADD COLUMN "isPublicProfile" BOOLEAN NOT NULL DEFAULT false;
```

All existing and new activities default to private.

## Usage Example

```typescript
import { getDisplayName, getDisplayAvatar } from "@/lib/activity-privacy";

// Get viewer's user ID
const viewerUserId = await getCurrentUserId();

// Get display values based on privacy
const displayName = getDisplayName(
  activity.user.name,
  activity.userId,
  activity.isPublicProfile,
  viewerUserId
);

const displayAvatar = getDisplayAvatar(
  activity.user.image,
  activity.userId,
  activity.isPublicProfile,
  viewerUserId
);
```

## Design Decisions

1. **Per-Activity Privacy** - Users can choose privacy per activity, not account-wide
2. **No Refunds on Deletion** - Deleted activities keep their commitments and sponsor budget is not refunded
3. **Anonymization Format** - `D•••••` (6 characters total: first initial + 5 bullets)
4. **Default Private** - Privacy by default protects users, they can opt-in to public
5. **Sponsor Page Always Anonymized** - Even if activity is public, sponsor pages show anonymized names for consistency and aggregate privacy

## Testing Checklist

- [ ] Create a new activity (should be private by default)
- [ ] View activity as owner (should see real name and toggle)
- [ ] View activity as visitor when private (should see D•••••)
- [ ] Toggle activity to public
- [ ] View activity as visitor when public (should see real name)
- [ ] View activity as anonymous user (should respect privacy)
- [ ] Check sponsor page links to activities
- [ ] Delete an activity and verify it doesn't break sponsor page

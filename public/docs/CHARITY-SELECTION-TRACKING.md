# Charity Selection Tracking

This document explains how charity selections are tracked over time.

## Overview

When a user selects a charity, we now create a `CharitySelection` record to track when that choice was made. This allows us to:

1. **Accurate Attribution**: Determine which charity was selected when an activity occurred
2. **Historical Tracking**: View a user's charity selection history
3. **Analytics**: Understand charity selection patterns
4. **Audit Trail**: Know exactly when each charity was chosen

## Database Schema

### CharitySelection Model

```prisma
model CharitySelection {
  id         String   @id @default(cuid())
  userId     String
  charityId  String
  selectedAt DateTime @default(now())
  isActive   Boolean  @default(true)

  user    User    @relation(...)
  charity Charity @relation(...)
}
```

**Fields:**

- `id`: Unique identifier for this selection record
- `userId`: The user who made the selection
- `charityId`: The charity that was selected
- `selectedAt`: When this charity was selected (timestamp)
- `isActive`: Whether this is the user's current selection (true) or historical (false)

**Indexes:**

- `userId` - Fast lookups by user
- `charityId` - Fast lookups by charity
- `selectedAt` - Fast time-based queries
- `[userId, isActive]` - Fast queries for current selection

## How It Works

### When a User Selects a Charity

1. **Deactivate Previous Selections**: All previous `CharitySelection` records for this user are marked as `isActive: false`
2. **Create New Record**: A new `CharitySelection` record is created with `isActive: true`
3. **Update User**: The user's `selectedCharityId` is updated for quick access

This is done in a transaction to ensure data consistency.

### Determining Which Charity to Use

**For Activities:**

- Uses `getCharityAtTime(userId, activityTimestamp)` helper
- Finds the most recent charity selection before or at the activity timestamp
- Falls back to default charity (UNICEF) if no selection exists

**For Current Selection:**

- Uses `getCurrentCharity(userId)` helper
- Finds the active charity selection
- Falls back to default charity if none exists

## Helper Functions

Located in `/lib/charity-helpers.ts`:

### `getCharityAtTime(userId, timestamp)`

Returns the charity that was selected at a specific point in time. Perfect for activities.

```typescript
const charity = await getCharityAtTime(
  activity.userId,
  activity.startDateLocal
);
```

### `getCurrentCharity(userId)`

Returns the user's current active charity selection.

```typescript
const charity = await getCurrentCharity(user.id);
```

### `getCharityHistory(userId)`

Returns the full history of a user's charity selections, ordered by most recent first.

```typescript
const history = await getCharityHistory(user.id);
// Returns: [{ id, userId, charityId, selectedAt, isActive, charity: {...} }, ...]
```

## Example Use Cases

### 1. Activity Display

When showing an activity, display the charity that was selected when the activity occurred:

```typescript
const activity = await db.activity.findUnique({ where: { id } });
const charity = await getCharityAtTime(
  activity.userId,
  activity.startDateLocal
);
```

### 2. User's Selection History

Show a timeline of when a user changed their charity selection:

```typescript
const history = await getCharityHistory(userId);
// Shows all selections with timestamps
```

### 3. Charity Analytics

Find all users who currently have a specific charity selected:

```typescript
const selections = await db.charitySelection.findMany({
  where: {
    charityId: "unicef",
    isActive: true,
  },
  include: { user: true },
});
```

### 4. Attribution Report

For a given time period, determine which charity was active:

```typescript
const startOfMonth = new Date("2024-01-01");
const charity = await getCharityAtTime(userId, startOfMonth);
```

## Migration Notes

- **Existing Users**: Users without a `CharitySelection` record will get one when they first select a charity
- **Default Behavior**: If no selection exists, the system defaults to UNICEF
- **Backwards Compatible**: The `User.selectedCharityId` field still exists for quick access

## Data Integrity

- All operations use database transactions to ensure consistency
- Only one `isActive: true` record per user at any time
- Historical records are never deleted, only deactivated
- Cascading deletes ensure cleanup when users or charities are deleted

## Future Enhancements

Potential features to build on this foundation:

1. **Selection Analytics Dashboard**: Show trends in charity preferences
2. **Notification System**: Remind users to review their charity selection periodically
3. **Impact Reports**: Show total donations per charity over time
4. **Multiple Active Charities**: Allow users to split donations across multiple charities
5. **Scheduled Changes**: Let users schedule future charity changes

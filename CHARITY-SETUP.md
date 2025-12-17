# Charity Selection Setup

This document explains how to set up the charity selection feature in development and staging environments.

## Database Changes

We've added:
- **Charity model**: Stores all available charities
- **User.selectedCharityId**: Links users to their chosen charity

## Setup Steps

### 1. Install tsx (if not already installed)

```bash
npm install --save-dev tsx
```

### 2. Create Migration

```bash
npx prisma migrate dev --name add_charity_selection
```

This will:
- Create the `charities` table
- Add `selectedCharityId` column to `users` table
- Create the foreign key relationship

### 3. Seed the Database

```bash
npm run db:seed
```

This will populate the `charities` table with 10 highly-rated organizations:
- UNICEF (default)
- Doctors Without Borders
- American Red Cross
- St. Jude Children's Research Hospital
- Nature Conservancy
- Natural Resources Defense Council
- World Wildlife Fund
- Save the Children
- DAV (Disabled American Veterans)
- ASPCA

### 4. Verify in Prisma Studio

```bash
npm run db:studio
```

Check that:
- The `charities` table has 10 records
- UNICEF has `isDefault: true`
- Users can be linked to charities via `selectedCharityId`

## How It Works

1. **User visits `/settings/charity`**
   - Page loads all charities from database
   - Shows user's current selection (or UNICEF as default)
   - Provides search and filter functionality

2. **User selects a charity**
   - Client component calls `POST /api/user/charity`
   - API updates user's `selectedCharityId`
   - Page refreshes to show new selection

3. **Activities use selected charity**
   - Activity pages can query user's `selectedCharity`
   - Falls back to UNICEF if no selection made

## Production Considerations

For production, you'll want to:
- Run migrations through your deployment pipeline
- Seed charities as part of deployment
- Consider adding an admin interface to manage charities
- Add charity impact tracking and reporting
- Implement charity verification and approval workflow

## Updating Charities

To add/update charities:
1. Edit `data/charities.json`
2. Run `npm run db:seed` (uses upsert, safe to run multiple times)

## Rollback

If you need to rollback:
```bash
npx prisma migrate reset
```

This will reset the database and re-run all migrations.

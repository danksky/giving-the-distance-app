# Sponsor Pages with Real Data

## ✅ Implementation Complete

Sponsor pages now use **real CharityCommitment data** from the database instead of fake JSON data, while maintaining business information from JSON files.

## Architecture

### Hybrid Data Approach

**Business Info (Static)** - From JSON files:

- Business name, address, location
- Photos (cover, logo, staff, products)
- Blurb and links (website, Instagram)
- Map embed URL

**Impact Data (Real-time)** - From Database:

- Total donated amount
- Activities sponsored count
- Athletes supported count
- Charities supported list
- Recent sponsored activities (with anonymization)

## Data Flow

```typescript
// 1. Load business info from JSON
const businessInfo = await getSponsorBusinessInfo(slug);
// Returns: name, address, images, links, etc.

// 2. Query real commitments from database
const impact = await getSponsorImpact(businessInfo.id);
// Queries: CharityCommitment table
// Calculates: totals, counts, unique athletes/charities
// Returns: impact stats + recent activities
```

## Key Features

### 🔒 Privacy Built-In

All athlete names are **automatically anonymized** using the `anonymizeName()` function:

- "Daniel Kawalsky" → "D•••••"
- Works for all activities (deleted or active)
- No special handling needed

### 📊 Real Statistics

- **Total Donated**: Sum of all `charityCommitments.amountCents`
- **Activities Sponsored**: Count of all commitments (includes deleted activities)
- **Athletes Supported**: Count of unique `userId`s
- **Charities**: Unique charities with real logos from database

### 🎯 Recent Activities

Shows last 10 sponsored activities with:

- Anonymized athlete name ("D•••••")
- Activity type (Run, Ride, Walk, etc.)
- Distance in km
- Donation amount
- Charity name
- Date
- **Clickable links** to individual activity pages

### 💰 Deleted Activities

- Still counted in totals (money was committed)
- Still shown in recent activities list
- Look identical to active activities (already anonymized)
- Links work (will 404 if clicked, but that's expected)

## Database Query

```typescript
const commitments = await db.charityCommitment.findMany({
  where: {
    campaign: {
      sponsorId: sponsorId, // e.g., "balkan-grind-brooklyn-nyc"
    },
  },
  include: {
    activity: {
      include: { user: true },
    },
    charity: true,
    campaign: true,
  },
  orderBy: {
    createdAt: "desc",
  },
});
```

## Empty State Handling

If sponsor has no commitments yet:

```
┌─────────────────────────────────────┐
│ Impact Summary                      │
│                                     │
│ No activities sponsored yet         │
│ This sponsor will appear here once  │
│ they start supporting athletes.     │
└─────────────────────────────────────┘
```

## Files Modified

### Updated

- `app/sponsors/[slug]/page.tsx`
  - Split `SponsorProfile` into `SponsorBusinessInfo` + `SponsorImpact`
  - Added `getSponsorImpact()` function to query real data
  - Renamed `getSponsorProfile()` to `getSponsorBusinessInfo()`
  - Updated all UI to use hybrid data sources
  - Added empty state for sponsors without commitments
  - Integrated `CharityLogo` component for real logos

### Imports Added

- `@/lib/db` - Database client
- `@/lib/activity-privacy` - `anonymizeName()` function
- `@/components/CharityLogo` - Display charity logos

## Testing Checklist

- [ ] Visit sponsor page with active campaigns (e.g., Balkan Grind)
- [ ] Verify impact stats are real numbers
- [ ] Verify athlete names are anonymized as "D•••••"
- [ ] Click on athlete name to visit activity page
- [ ] Verify charity logos display correctly
- [ ] Test sponsor with no commitments (shows empty state)
- [ ] Verify deleted activities still count in totals
- [ ] Check that charities list is unique (no duplicates)

## Example Output

### Sponsor with Data

```
Impact Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Donated: $123.45
Activities Sponsored: 42
Athletes Supported: 15

Charities Supported:
[ASPCA Logo] ASPCA
[UNICEF Logo] UNICEF

Recent Sponsored Activities
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
D••••• • Run                    $10.00
  12.5 km • ASPCA • Dec 15, 2024

M••••• • Ride                   $15.50
  45.2 km • UNICEF • Dec 14, 2024
```

## Benefits

✅ **Accurate**: Shows real commitment data
✅ **Private**: Athlete names automatically anonymized
✅ **Fast**: Single optimized query with includes
✅ **Robust**: Handles empty state, deleted activities
✅ **Maintainable**: Business info still easy to update via JSON
✅ **Scalable**: Works with any number of commitments

## Future Enhancements

Possible improvements:

- Cache impact stats (Redis, ISR)
- Add date range filters
- Show trends over time
- Add pagination for many activities
- Export impact reports
- Show campaign-specific breakdowns

## Notes

- Business JSON files remain in `data/sponsors/[slug]/profile.json`
- All fake `impact` and `recentActivities` data in JSON is now ignored
- Database is the single source of truth for financial data
- Privacy is enforced at the query level (anonymization)

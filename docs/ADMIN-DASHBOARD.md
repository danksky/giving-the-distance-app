# Admin Dashboard Documentation

## Overview

The admin dashboard provides comprehensive tools for managing and monitoring the sponsor matching system. Access is restricted to admin users only.

## Access

### Admin URLs

- Main Admin Hub: `/admin`
- Campaign Management: `/admin/campaigns`
- Webhook Events: `/admin/webhooks`

### Admin Access Control

Admin access is controlled by the `isAdmin()` function in `lib/auth-helpers.ts`. Only users with admin privileges can access these pages.

### Navigation

For admin users:

- **Navbar**: "⚙️ Admin" link appears in the main navigation
- **User Dropdown**: "⚙️ Admin Dashboard" option in the profile menu

## Pages

### 1. Admin Hub (`/admin`)

The main landing page for admin functions.

**Features:**

- Quick access cards to all admin sections
- System information display
- Quick action commands
- Documentation links

**Sections:**

- 💰 **Campaign Management** - View and manage sponsor campaigns
- 📡 **Webhook Events** - Monitor Strava webhooks
- 🗄️ **Prisma Studio** - Direct database access (opens external link)
- 📊 **System Information** - Current system status and configuration

### 2. Campaign Management (`/admin/campaigns`)

Comprehensive view of all sponsor campaigns, budgets, and sponsor matches.

#### Overall Statistics

Displays at the top of the page:

- **Total Budget Allocated**: Sum of all campaign top-ups
- **Remaining Budget**: Total unspent budget across all campaigns
- **Budget Spent**: Total amount spent on activity matches
- **Activities Matched**: Total number of successful matches

#### Placement Results Breakdown

Shows distribution of recent placements (last 20):

- ✅ **Matched**: Successfully matched and description updated
- 💸 **No Budget**: Campaign has insufficient budget
- 🚫 **No Campaign**: No active campaign available
- 🔁 **Already Sponsored**: Activity already has placement
- ⚠️ **Update Failed**: Failed to update Strava description

#### Campaign Cards

Each campaign displays:

**Header:**

- Sponsor business name
- Campaign name
- Website link (if available)
- Active/Inactive status badge

**Budget Stats:**

- Budget Remaining (with activities left calculation)
- Total Allocated
- Amount Spent
- Activities Matched count

**Progress Bar:**

- Visual representation of budget usage
- Color-coded (green < 70%, yellow 70-90%, red > 90%)

**Budget Top-ups:**

- History of all budget additions
- Date, amount, and notes for each top-up

**Recent Placements:**

- Last 10 placement attempts for this campaign
- Result status, activity ID, timestamp
- Amount deducted (if successful)

#### Recent Sponsor Matches Table

Complete list of recent placements across all campaigns showing:

- Timestamp
- Campaign and sponsor
- Activity ID (linked to activity page)
- Athlete name
- Result status (color-coded badge)
- Amount deducted
- Notes/error messages

### 3. Webhook Events (`/admin/webhooks`)

Monitor all incoming Strava webhook events.

**Features:**

- Event statistics and breakdown
- Detailed event logs
- Processing status tracking
- Description update monitoring

(This page already existed; see existing documentation)

## Key Metrics

### Campaign Performance

- **Budget Remaining**: How much budget is left per campaign
- **Activities Matched**: Number of activities successfully matched
- **Budget Utilization**: Percentage of allocated budget spent
- **Activities Left**: Remaining matches possible with current budget

### System Health

- **Placement Success Rate**: Percentage of activities successfully matched
- **Failed Updates**: Activities where description update failed
- **Budget Exhaustion**: Campaigns running low on budget
- **Processing Errors**: Failed webhook events

### Charity Impact

- **Total Commitments**: Sum of all charity donations generated
- **Commitments Per Campaign**: Breakdown by sponsor
- **Commitments Per Charity**: Distribution across charities

## Budget Management

### Monitoring Budget Levels

- Check the **Budget Remaining** stat on each campaign card
- Watch the progress bar color:
  - 🟢 Green (< 70% used): Healthy
  - 🟡 Yellow (70-90% used): Monitor
  - 🔴 Red (> 90% used): Action needed

### Adding Budget to Campaigns

To add budget to a campaign, create a new `CampaignTopUp` record:

```typescript
// Via Prisma Studio or seed script
await db.campaignTopUp.create({
  data: {
    campaignId: "campaign-id",
    amountCents: 10000, // $100.00
    notes: "Monthly budget top-up",
  },
});

// Also increment the campaign budget
await db.campaign.update({
  where: { id: "campaign-id" },
  data: {
    budgetRemainingCents: {
      increment: 10000,
    },
  },
});
```

### Budget Calculations

- **Commitment Amount**: $0.10 (10 cents) per activity
- **Activities per $100**: 1,000 activities
- **Budget Spent**: Total Allocated - Budget Remaining

## Common Admin Tasks

### 1. Check Campaign Status

1. Go to `/admin/campaigns`
2. Review overall stats at the top
3. Check each campaign's progress bar
4. Review recent placements for any errors

### 2. Monitor Placement Success Rate

1. Go to `/admin/campaigns`
2. Check "Placement Results" breakdown
3. Investigate any high failure rates
4. Review error messages in sponsor match records

### 3. Add New Sponsors/Campaigns

1. Add sponsor profile JSON to `data/sponsors/[slug]/profile.json`
2. Run seed script: `npm run db:seed`
3. Or manually create via Prisma Studio
4. Verify campaign appears in admin dashboard

### 3a. Manage Charities

1. Go to `/admin/charities`
2. Create or edit charities directly in the database-backed catalog
3. Store logo files in `public/logos/charities/` and point `logoUrl` at the local asset path

### 4. Investigate Failed Matches

1. Go to `/admin/campaigns`
2. Scroll to "Recent Sponsor Matches"
3. Look for badges with error states
4. Check "Notes" column for error details
5. Cross-reference with webhook events at `/admin/webhooks`

### 5. Pause/Activate Campaigns

Use Prisma Studio to toggle `isActive` on campaigns:

- `isActive: true` - Campaign will match activities
- `isActive: false` - Campaign will be skipped

### 6. View Charity Commitments

Use Prisma Studio:

1. Open `charity_commitments` table
2. Filter by campaign, user, or charity
3. Review commitment amounts and timestamps

## Responsive Design

The admin dashboard is fully responsive:

- **Desktop**: Full stats cards and tables
- **Tablet**: Stats stack vertically, tables scroll horizontally
- **Mobile**: Compact view with essential information

## Security

### Access Control

- All admin pages check authentication first
- Then verify admin status via `isAdmin()`
- Non-admin users see access denied page
- Unauthenticated users redirected to sign-in

### Admin Users

Admin status is determined in `lib/auth-helpers.ts`. By default, check the implementation for how admins are defined.

## Tips & Best Practices

### Monitoring

- Check admin dashboard daily to monitor campaign health
- Watch for budget levels dropping below 20%
- Investigate any spike in failed placements

### Budget Management

- Plan budget top-ups in advance
- Keep at least 2 weeks of buffer budget
- Document top-ups with clear notes

### Data Analysis

- Export sponsor match records via Prisma Studio for deeper analysis
- Track success rates over time
- Correlate failures with specific campaigns or time periods

### Performance

- Pages use `dynamic = "force-dynamic"` to show real-time data
- Data is fetched server-side for security
- Use Prisma Studio for bulk operations

## Troubleshooting

### Campaign Not Showing Up

- Verify campaign exists in database (Prisma Studio)
- Check `isActive` status
- Ensure sponsor record exists

### Activities Not Being Matched

1. Check `/admin/campaigns` for placement results
2. Look for "No Budget" or "No Campaign" results
3. Verify campaign has sufficient budget
4. Check webhook events for processing errors

### Budget Not Decreasing

- Verify activities are being created (check webhooks)
- Check sponsor match records for match failures
- Ensure campaign is active
- Review error messages in sponsor match records

## Related Documentation

- [SPONSOR-MATCHING.md](./SPONSOR-MATCHING.md) - Technical details of the matching system
- [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - Overall implementation summary
- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - Database structure
- [STRAVA-WEBHOOK-SETUP.md](./STRAVA-WEBHOOK-SETUP.md) - Webhook configuration

## Support

For issues or questions:

1. Check sponsor match records for error messages
2. Review webhook events for processing failures
3. Use Prisma Studio to inspect database state
4. Check application logs for detailed errors

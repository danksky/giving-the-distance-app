# Privacy System Examples

## Visual Examples of Privacy in Action

### Example 1: Private Activity (Default)

**Sponsor Page:**

```
Recent Sponsored Activities
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
D•••••  • Run                    $10.00
   12.5 km • ASPCA • Dec 15, 2024    donated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ↓ (click name)

Activity Page (Visitor View):
┌─────────────────────────────────────┐
│ [Gradient Avatar]  D•••••'s Run     │
│                    Dec 15, 2024     │
│                    [Private Profile]│
├─────────────────────────────────────┤
│ Distance: 12.5 km                   │
│ Time: 1:23:45                       │
│ Pace: 6:42 min/km                   │
└─────────────────────────────────────┘
```

### Example 2: Public Activity (Owner Opted In)

**Sponsor Page:**

```
Recent Sponsored Activities
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
D•••••  • Run                    $10.00
   12.5 km • ASPCA • Dec 15, 2024    donated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ↓ (click name)

Activity Page (Visitor View):
┌─────────────────────────────────────┐
│ [Daniel's Photo]  Daniel's Run      │
│                   Dec 15, 2024      │
├─────────────────────────────────────┤
│ Distance: 12.5 km                   │
│ Time: 1:23:45                       │
│ Pace: 6:42 min/km                   │
└─────────────────────────────────────┘
```

### Example 3: Owner View (Always See Real Info)

**Activity Page (Owner View):**

```
┌─────────────────────────────────────┐
│ [Daniel's Photo]  Daniel's Run      │
│                   Dec 15, 2024      │
├─────────────────────────────────────┤
│ Distance: 12.5 km                   │
│ Time: 1:23:45                       │
│ Pace: 6:42 min/km                   │
├─────────────────────────────────────┤
│ Privacy Settings                    │
│                                     │
│ Control who can see your name and   │
│ profile picture. When private,      │
│ visitors see "D•••••"               │
│                                     │
│ [✓] Make Profile Public             │
│     Everyone can see your name      │
└─────────────────────────────────────┘
```

## Anonymization Rules

### Name Format

```
Input           → Output
────────────────────────
"Daniel"        → "D•••••"
"Sarah Jones"   → "S•••••"
"Mike"          → "M•••••"
"X Æ A-12"      → "X•••••"
null            → "A•••••"
""              → "A•••••"
```

### Avatar Logic

```
Condition                    → Avatar Shown
─────────────────────────────────────────
Owner viewing own activity   → Real photo
Public + has photo          → Real photo
Public + no photo           → Placeholder
Private (any visitor)       → Placeholder
```

## Privacy Matrix

| Scenario | Viewer    | Activity Status | Name Shown | Avatar Shown |
| -------- | --------- | --------------- | ---------- | ------------ |
| 1        | Owner     | Private         | Daniel     | Real Photo   |
| 2        | Owner     | Public          | Daniel     | Real Photo   |
| 3        | Visitor   | Private         | D•••••     | Placeholder  |
| 4        | Visitor   | Public          | Daniel     | Real Photo   |
| 5        | Anonymous | Private         | D•••••     | Placeholder  |
| 6        | Anonymous | Public          | Daniel     | Real Photo   |

## Sponsor Page Behavior

**Key Point:** Sponsor pages ALWAYS show anonymized names, regardless of activity privacy setting.

**Reasoning:**

1. **Aggregate Privacy** - Prevents profiling individual athletes
2. **Consistency** - All athletes treated equally on sponsor view
3. **Simplicity** - No need to check privacy for each entry

**Example:**

```
Sponsor Page → ALWAYS "D•••••"
   ↓ (click)
Activity Page → Respects privacy setting
```

## Deleted Activity Behavior

When an activity is deleted (soft delete):

**User Dashboard:**

```
┌─────────────────────────────────────┐
│ [Deleted Activity]                  │
│ Type: —    Distance: —              │
│ (greyed out, no link)               │
└─────────────────────────────────────┘
```

**Activity Page:**

```
→ Returns 404 Not Found
```

**Sponsor Page:**

```
┌─────────────────────────────────────┐
│ D•••••  • Run              $10.00   │
│ 12.5 km • ASPCA • Dec 15, 2024      │
└─────────────────────────────────────┘
   ↓ (click)
→ Returns 404 Not Found

Note: Activity details still shown because:
- Already anonymized
- Commitment persists
- Budget was already decremented
```

## Real Data Implementation Preview

When sponsor pages use real data:

```typescript
// Query commitments
const commitments = await db.charityCommitment.findMany({
  where: { campaign: { sponsorId } },
  include: {
    activity: { include: { user: true } },
    charity: true,
  },
  orderBy: { createdAt: "desc" },
  take: 20,
});

// Map to display format
const recentActivities = commitments.map((c) => ({
  id: c.activityId, // For linking
  athleteName: anonymizeName(c.activity.user.name), // "D•••••"
  activityType: c.activity.type,
  distance: Number(c.activity.distanceMeters) / 1000,
  donationAmount: c.amountCents / 100,
  charity: c.charity.name,
  date: c.createdAt,
}));

// Render with links
<Link href={`/activities/${activity.id}`}>
  {activity.athleteName} {/* D••••• */}
</Link>;
```

**Result:** Seamless privacy - visitors see anonymized names on sponsor page, then real or anonymized on activity page based on privacy settings.

## Edge Cases Handled

✅ **User has no name** → Shows "A•••••"
✅ **Activity deleted** → 404 on activity page, still shows on sponsor page
✅ **User toggles privacy multiple times** → Updates immediately
✅ **Visitor not logged in** → Treated as non-owner
✅ **Activity from before privacy system** → Defaults to private
✅ **Sponsor page always anonymized** → No privacy leaks in aggregate view

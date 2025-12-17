# GPX Map Display & Backfill Implementation

## ✅ What's Been Implemented

### 1. Map Display (Owner Only)

Activity owners can now see their route rendered on an interactive map!

**Features:**

- ✅ Interactive map using Leaflet
- ✅ Route displayed as a purple polyline
- ✅ Start marker (green) and finish marker (red)
- ✅ Automatic zoom to fit entire route
- ✅ Download GPX button
- ✅ Only visible to activity owner (respects privacy)
- ✅ Works regardless of activity publicity settings

**Location:** `/app/activities/[id]` page

### 2. GPX Backfill System

Automatically fill in missing GPX files for existing activities!

**Features:**

- ✅ Admin dashboard for GPX management
- ✅ Statistics view (total, with GPX, without GPX, manual, coverage %)
- ✅ Configurable backfill (limit, dry run)
- ✅ API endpoint for programmatic access
- ✅ Comprehensive error handling and reporting
- ✅ Non-blocking (won't break if fails)

**Location:** `/admin/gpx` page

## 📁 New Files Created

### Components

- `components/ActivityMap.tsx` - Main map wrapper component
- `components/ActivityMapClient.tsx` - Client-side map rendering (Leaflet)

### Backend

- `lib/gpx-backfill.ts` - Backfill logic and statistics
- `app/api/admin/gpx-backfill/route.ts` - API endpoint for backfill

### Admin UI

- `app/admin/gpx/page.tsx` - GPX management dashboard

### Documentation

- `GPX-MAP-AND-BACKFILL.md` - This file

### Modified Files

- `app/activities/[id]/page.tsx` - Added map display section
- `app/admin/page.tsx` - Added GPX management card
- `app/globals.css` - Added Leaflet CSS import
- `package.json` - Added Leaflet dependencies

## 🗺️ Map Display Usage

### For Activity Owners

When you view your own activity:

1. Navigate to any activity page: `/activities/[id]`
2. Scroll down to see the "Route Map" section (only visible to you)
3. The map shows:
   - Your complete route as a purple line
   - Green marker at the start
   - Red marker at the finish
   - Interactive controls (zoom, pan)
4. Click "Download GPX" to download the raw GPX file

### Privacy

- **Owner Only**: Only you can see the map of your activities
- **All Activities**: Works for both public and private activities
- **Independent**: Showing/hiding your profile doesn't affect map visibility to you

### Technical Details

The map is rendered using:

- **Leaflet**: Open-source JavaScript map library
- **OpenStreetMap**: Free map tiles
- **Dynamic Import**: Map only loads on client-side (no SSR issues)
- **GPX Parsing**: Reads coordinates from GPX XML

## 🔄 Backfill System

### When to Use Backfill

You need to run backfill if:

- You have existing activities before GPX storage was implemented
- Webhook processing failed for some activities
- GPX downloads were skipped due to errors
- You want to ensure all activities have GPX files

### How to Run Backfill

#### Option 1: Admin Dashboard (Recommended)

1. Navigate to `/admin/gpx`
2. View statistics to see how many activities need GPX files
3. Configure options:
   - **Limit**: How many activities to process (start small!)
   - **Dry Run**: Preview what would happen without making changes
4. Click "Run Backfill"
5. View results and check for errors

#### Option 2: API Endpoint

```bash
# Get statistics
curl https://your-app.vercel.app/api/admin/gpx-backfill

# Run backfill (10 activities, dry run)
curl -X POST https://your-app.vercel.app/api/admin/gpx-backfill \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "dryRun": true}'

# Run actual backfill (10 activities)
curl -X POST https://your-app.vercel.app/api/admin/gpx-backfill \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "dryRun": false}'
```

### Backfill Process

For each activity without GPX:

1. ✅ Check if activity has GPS data (skip manual activities)
2. ✅ Get valid Strava access token for user
3. ✅ Fetch activity streams from Strava API
4. ✅ Generate GPX XML from streams
5. ✅ Upload to Vercel Blob Storage
6. ✅ Update database with blob URL

### Best Practices

**Start Small:**

```
First run: limit=1, dryRun=true   (test one activity)
Second run: limit=10, dryRun=false (do 10 for real)
Third run: limit=100, dryRun=false (scale up)
```

**Monitor Progress:**

- Check the admin dashboard statistics after each run
- Review errors and fix issues before continuing
- Watch Strava API rate limits (100 per 15 minutes)

**Handle Errors:**

- Some activities might not have GPS data (normal for manual/indoor)
- Token refresh might fail for some users (they need to reconnect)
- Blob storage might be full (upgrade plan or cleanup)

## 📊 Statistics & Monitoring

### GPX Coverage Statistics

```typescript
{
  total: 150,        // Total activities
  withGPX: 120,      // Activities with GPX files
  withoutGPX: 20,    // Activities missing GPX (need backfill)
  manual: 10,        // Manual activities (no GPS data)
  coverage: "80.0%"  // Percentage with GPX
}
```

### Activity Queries

```sql
-- Find activities without GPX
SELECT id, name, type, "startDate"
FROM activities
WHERE "gpxBlobUrl" IS NULL
  AND "deletedAt" IS NULL
  AND "isManual" = false
ORDER BY "startDate" DESC;

-- Check GPX coverage by user
SELECT
  u.email,
  COUNT(*) as total,
  SUM(CASE WHEN a."gpxBlobUrl" IS NOT NULL THEN 1 ELSE 0 END) as with_gpx
FROM activities a
JOIN users u ON a."userId" = u.id
WHERE a."deletedAt" IS NULL
GROUP BY u.email;
```

## 🎨 Map Customization

### Change Map Colors

Edit `components/ActivityMapClient.tsx`:

```typescript
// Route color
const polyline = L.polyline(coordinates, {
  color: "#8B4ACC", // Change to your brand color
  weight: 4,
  opacity: 0.8,
});

// Start marker color
background-color: #10b981; // Green

// Finish marker color
background-color: #ef4444; // Red
```

### Change Map Tiles

```typescript
// Switch to different tile provider
L.tileLayer("https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png", {
  attribution: "...",
  maxZoom: 19,
}).addTo(map);

// Or use satellite imagery
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "...",
    maxZoom: 19,
  }
).addTo(map);
```

## 🔍 Troubleshooting

### Map Not Showing

**Issue:** Map doesn't appear on activity page

**Check:**

1. Is `gpxBlobUrl` set in database?
   ```sql
   SELECT id, name, "gpxBlobUrl" FROM activities WHERE id = 'YOUR_ID';
   ```
2. Are you the activity owner?
3. Is Leaflet CSS loaded? (Check browser console for errors)
4. Does the GPX file exist? (Try downloading it directly)

**Fix:**

- Run backfill to generate GPX
- Check browser console for JavaScript errors
- Verify Leaflet CSS is imported in `globals.css`

### Backfill Fails

**Issue:** Backfill completes but no GPX files created

**Check:**

1. Is `BLOB_READ_WRITE_TOKEN` set?
2. Do users have valid Strava tokens?
3. Are there Strava API rate limits?

**Fix:**

```bash
# Check environment variable
echo $BLOB_READ_WRITE_TOKEN

# Test Strava connection
# Users may need to reconnect Strava

# Wait for rate limit reset (15 minutes)
```

### Map Shows Wrong Route

**Issue:** Map displays incorrect or jumbled route

**Possible Causes:**

- GPX file is corrupted
- Activity has GPS errors (common in urban areas)
- Multiple track segments

**Fix:**

- Re-download GPX from Strava (delete and backfill)
- Check original activity on Strava.com
- This is usually a Strava data issue, not our bug

## 💡 Advanced Usage

### Programmatic Access

```typescript
// Import backfill functions
import { backfillGPXFiles, getGPXStatistics } from "@/lib/gpx-backfill";

// Get statistics
const stats = await getGPXStatistics();
console.log(`Coverage: ${stats.coverage}`);

// Run backfill for specific user
await backfillGPXFiles({
  userId: "clx1234...",
  limit: 50,
  dryRun: false,
});
```

### Bulk Operations

```bash
# Backfill all activities (no limit)
curl -X POST https://your-app.vercel.app/api/admin/gpx-backfill \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'

# Backfill for specific user
curl -X POST https://your-app.vercel.app/api/admin/gpx-backfill \
  -H "Content-Type: application/json" \
  -d '{"userId": "clx1234...", "dryRun": false}'
```

## 📚 Related Documentation

- **GPX Storage**: `GPX-STORAGE.md` - How GPX files are stored
- **Quick Start**: `GPX-QUICK-START.md` - Setup guide
- **Implementation**: `IMPLEMENTATION-GPX-STORAGE.md` - Technical details

## ✨ Future Enhancements

Possible improvements:

- [ ] Add map to public activity pages (with privacy controls)
- [ ] Show elevation profile below map
- [ ] Add heatmap of all activities
- [ ] Allow users to trigger their own backfill
- [ ] Add progress bar for backfill operations
- [ ] Support multiple map tile providers
- [ ] Add 3D terrain view
- [ ] Show photos on route (if available from Strava)
- [ ] Export routes to other formats (TCX, FIT)
- [ ] Batch download all GPX files as ZIP

## 🎯 Do You Need to Backfill?

**Check if you need backfill:**

1. Go to `/admin/gpx`
2. Look at "Without GPX" stat
3. If > 0, you have activities that need backfilling

**When to run backfill:**

- ✅ **Now**: If you have existing activities before GPX was implemented
- ✅ **After webhook errors**: If some activities failed to process
- ✅ **Periodically**: To catch any missed activities
- ❌ **Not needed**: If all new activities get GPX automatically via webhooks

**Answer:** Yes, you should run backfill at least once if you had any activities before this feature was implemented!

## 📝 Summary

**For Users:**

- Activity owners see their routes on an interactive map
- Privacy is respected - only you see your routes
- Maps work for all activities (public or private)

**For Admins:**

- Run backfill to add GPX files to existing activities
- Monitor coverage statistics
- Handle errors and track progress

**Result:** Complete activity tracking with beautiful route visualization! 🗺️

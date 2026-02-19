# GPX File Storage

## Overview

The app automatically downloads and stores GPX files for all Strava activities that have GPS data. GPX files are fetched when activities arrive via webhooks and stored in Vercel Blob Storage for later download.

## How It Works

### 1. Webhook Processing

When a Strava activity is created or updated:

1. The webhook handler fetches the activity details from Strava
2. Saves the activity to the database
3. **Checks if we already have a GPX file** for this activity
4. If not, fetches activity streams (GPS coordinates, altitude, time) from Strava API
5. Generates a GPX XML file from the streams
6. Uploads to Vercel Blob Storage
7. Stores the blob URL in the database (`Activity.gpxBlobUrl`)

### 2. Storage Organization

GPX files are organized by user and activity:

```
gpx/{userId}/{stravaActivityId}.gpx
```

Example:

```
gpx/clx1234abcd/12345678901.gpx
```

### 3. Database Schema

The `Activity` model has a new field:

```prisma
model Activity {
  // ... other fields
  gpxBlobUrl String? // URL to GPX file in Vercel Blob Storage
  // ... other fields
}
```

## Setup

### Environment Variables

Add these to your `.env` file:

```bash
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

You can get this token from:

1. Go to your Vercel project dashboard
2. Navigate to Storage > Blob
3. Copy the `BLOB_READ_WRITE_TOKEN`

### Vercel Blob Store Information

```
Store Name: giving-the-distance-app-blob
Store ID: store_ccSWg4jdQA1WbxT5
Storage Region: Washington, D.C., USA (IAD1)
Base URL: https://ccswg4jdqa1wbxt5.public.blob.vercel-storage.com
```

### Database Migration

Run the migration to add the `gpxBlobUrl` field:

```bash
npm run db:push
# or
npx prisma migrate dev --name add_gpx_blob_url
```

## Usage

### Automatic Download

GPX files are automatically downloaded when:

- A new activity is created (webhook event)
- An existing activity is updated and doesn't have a GPX file yet

### Skip Conditions

GPX download is skipped when:

- Blob storage is not configured (`BLOB_READ_WRITE_TOKEN` not set)
- The activity already has a GPX file
- The activity has no GPS data (manual activities, indoor workouts)
- The Strava API doesn't return stream data

### Accessing GPX Files

The GPX file URL is stored in `Activity.gpxBlobUrl` and is publicly accessible:

```typescript
const activity = await db.activity.findUnique({
  where: { id: activityId },
});

if (activity.gpxBlobUrl) {
  // Download or redirect to this URL
  console.log(`GPX file: ${activity.gpxBlobUrl}`);
}
```

### Example URLs

```
https://ccswg4jdqa1wbxt5.public.blob.vercel-storage.com/gpx/clx1234abcd/12345678901.gpx
```

## Implementation Details

### Files

1. **`lib/gpx-generator.ts`**

   - Fetches activity streams from Strava API
   - Converts streams to GPX XML format
   - Supports latlng, altitude, time, and distance streams

2. **`lib/gpx-storage.ts`**

   - Handles Vercel Blob uploads
   - Manages GPX file lifecycle (upload, delete, replace)
   - Checks if blob storage is configured

3. **`app/api/strava/webhook/route.ts`**
   - Integrates GPX processing into webhook handler
   - Downloads GPX for new activities
   - Backfills GPX for existing activities on update

### GPX Format

Generated GPX files follow the GPX 1.1 specification:

- Track points with latitude/longitude
- Elevation data (if available)
- Timestamps (if available)
- Activity metadata (name, type, start time)

Example:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Giving the Distance" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Morning Run</name>
    <time>2024-12-17T10:00:00.000Z</time>
  </metadata>
  <trk>
    <name>Morning Run</name>
    <type>Run</type>
    <trkseg>
      <trkpt lat="40.7128" lon="-74.0060">
        <ele>10.5</ele>
        <time>2024-12-17T10:00:00.000Z</time>
      </trkpt>
      <!-- more track points -->
    </trkseg>
  </trk>
</gpx>
```

## API Rate Limits

Strava API rate limits:

- **Short-term**: 100 requests per 15 minutes
- **Daily**: 1,000 requests per day

Each GPX download requires:

- 1 request to fetch activity details (already done by webhook)
- 1 request to fetch activity streams

The webhook handler is designed to be efficient and only download GPX files once.

## Error Handling

GPX processing is **non-critical** and won't fail the webhook:

- If GPX download fails, the activity is still saved
- Errors are logged but don't block sponsor matching or other features
- Failed downloads can be retried on activity updates

## Monitoring

Check webhook events for GPX processing:

```sql
SELECT
  id,
  objectId,
  processed,
  processingError,
  createdAt
FROM strava_webhook_events
WHERE objectType = 'activity'
ORDER BY createdAt DESC;
```

Check activities with/without GPX:

```sql
-- Activities with GPX
SELECT COUNT(*) FROM activities WHERE gpxBlobUrl IS NOT NULL;

-- Activities without GPX
SELECT COUNT(*) FROM activities WHERE gpxBlobUrl IS NULL AND deletedAt IS NULL;
```

## Future Enhancements

Possible improvements:

1. **On-demand download**: Add API endpoint to download GPX for specific activities
2. **Bulk download**: Add admin feature to download all activities
3. **GPX preview**: Show route map on activity page using GPX data
4. **Export formats**: Add support for TCX, FIT, or other formats
5. **Compression**: Store compressed GPX files to save storage space

## Troubleshooting

### GPX files not downloading

1. Check if `BLOB_READ_WRITE_TOKEN` is set:

   ```bash
   echo $BLOB_READ_WRITE_TOKEN
   ```

2. Check webhook logs for errors:

   ```bash
   # In Vercel dashboard: Functions > Logs
   # Look for "GPX" in the logs
   ```

3. Verify Strava permissions include `activity:read_all`

4. Check if activities have GPS data (manual activities won't have streams)

### Storage quota

Monitor your Vercel Blob Storage usage:

- Free tier: 500MB
- Pro tier: Unlimited with pricing per GB

A typical GPX file is 50-500KB depending on activity length and GPS density.

## Security

- GPX files are stored with `public` access for easy download
- Files are organized by user ID to prevent guessing URLs
- Only activities with `isPublicProfile=true` should have GPX links shown to public
- Consider adding signed URLs or access control for private activities


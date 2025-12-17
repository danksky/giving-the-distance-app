/**
 * GPX Storage with Vercel Blob
 * 
 * Uploads GPX files to Vercel Blob Storage and manages storage lifecycle
 */

import { put, del } from '@vercel/blob';

/**
 * Upload GPX content to Vercel Blob Storage
 * 
 * @param gpxContent - The GPX XML content as a string
 * @param activityId - The Strava activity ID (used in filename)
 * @param userId - The user ID (for organization and access control)
 * @returns The public URL of the uploaded blob, or null if upload failed
 */
export async function uploadGPXToBlob(
  gpxContent: string,
  activityId: string,
  userId: string
): Promise<string | null> {
  try {
    console.log(`📤 Uploading GPX for activity ${activityId} to Vercel Blob...`);
    
    // Create filename with user ID and activity ID for organization
    // Format: gpx/{userId}/{activityId}.gpx
    const pathname = `gpx/${userId}/${activityId}.gpx`;
    
    // Upload to Vercel Blob
    const blob = await put(pathname, gpxContent, {
      access: 'public', // Make publicly accessible for download
      contentType: 'application/gpx+xml',
      addRandomSuffix: false, // Keep clean URLs without random suffixes
    });

    console.log(`✅ GPX uploaded successfully: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error(`❌ Error uploading GPX to Vercel Blob:`, error);
    return null;
  }
}

/**
 * Delete a GPX file from Vercel Blob Storage
 * 
 * @param blobUrl - The full URL of the blob to delete
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteGPXFromBlob(blobUrl: string): Promise<boolean> {
  try {
    console.log(`🗑️  Deleting GPX from Vercel Blob: ${blobUrl}`);
    
    await del(blobUrl);
    
    console.log(`✅ GPX deleted successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting GPX from Vercel Blob:`, error);
    return false;
  }
}

/**
 * Replace an existing GPX file (delete old, upload new)
 * 
 * @param oldBlobUrl - The URL of the existing blob to replace (optional)
 * @param gpxContent - The new GPX content
 * @param activityId - The Strava activity ID
 * @param userId - The user ID
 * @returns The public URL of the newly uploaded blob, or null if upload failed
 */
export async function replaceGPXInBlob(
  oldBlobUrl: string | null,
  gpxContent: string,
  activityId: string,
  userId: string
): Promise<string | null> {
  // Delete old GPX if it exists
  if (oldBlobUrl) {
    await deleteGPXFromBlob(oldBlobUrl);
  }

  // Upload new GPX
  return await uploadGPXToBlob(gpxContent, activityId, userId);
}

/**
 * Check if BLOB_READ_WRITE_TOKEN is configured
 */
export function isBlobStorageConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Get the Vercel Blob Store ID from environment
 */
export function getBlobStoreId(): string | undefined {
  return process.env.BLOB_STORE_ID;
}

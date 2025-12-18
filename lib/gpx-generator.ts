/**
 * GPX Generation from Strava Activity Streams
 * 
 * Fetches activity streams (latlng, altitude, time) from Strava API
 * and generates a GPX file in XML format.
 */

interface StravaStream {
  type: string;
  data: unknown[];
  series_type?: string;
  original_size?: number;
  resolution?: string;
}

interface ActivityStreams {
  latlng?: [number, number][]; // [lat, lng] pairs
  altitude?: number[];
  time?: number[]; // seconds from start
  distance?: number[];
}

/**
 * Fetch activity streams from Strava API
 */
export async function fetchActivityStreams(
  activityId: string,
  accessToken: string
): Promise<ActivityStreams | null> {
  try {
    console.log(`📥 Fetching streams for activity ${activityId}...`);
    
    // Request multiple streams in one call
    const keys = ['latlng', 'altitude', 'time', 'distance'].join(',');
    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=${keys}&key_by_type=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`⚠️ No streams found for activity ${activityId} (manual activity or no GPS data)`);
        return null;
      }
      
      const errorText = await response.text();
      console.error(`❌ Failed to fetch streams: HTTP ${response.status} - ${errorText}`);
      return null;
    }

    const streams = await response.json();
    console.log(`✅ Streams fetched successfully for activity ${activityId}`);

    // Parse streams from response
    const result: ActivityStreams = {};
    
    if (streams.latlng?.data) {
      result.latlng = streams.latlng.data as [number, number][];
    }
    
    if (streams.altitude?.data) {
      result.altitude = streams.altitude.data as number[];
    }
    
    if (streams.time?.data) {
      result.time = streams.time.data as number[];
    }
    
    if (streams.distance?.data) {
      result.distance = streams.distance.data as number[];
    }

    // Validate we have the minimum required data
    if (!result.latlng || result.latlng.length === 0) {
      console.warn(`⚠️ No GPS data available for activity ${activityId}`);
      return null;
    }

    return result;
  } catch (error) {
    console.error(`❌ Error fetching activity streams:`, error);
    return null;
  }
}

/**
 * Generate GPX XML from activity streams
 */
export function generateGPX(
  streams: ActivityStreams,
  metadata: {
    name: string;
    activityId: string;
    startDate?: Date;
    type?: string;
  }
): string {
  const { name, activityId, startDate, type } = metadata;
  const { latlng, altitude, time } = streams;

  if (!latlng || latlng.length === 0) {
    throw new Error('No GPS coordinates available');
  }

  // Build GPX XML
  const xmlParts: string[] = [];

  // XML header and GPX root element
  xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
  xmlParts.push('<gpx version="1.1" creator="Giving the Distance" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">');

  // Metadata
  xmlParts.push('  <metadata>');
  xmlParts.push(`    <name>${escapeXml(name)}</name>`);
  if (startDate) {
    xmlParts.push(`    <time>${startDate.toISOString()}</time>`);
  }
  xmlParts.push('  </metadata>');

  // Track
  xmlParts.push('  <trk>');
  xmlParts.push(`    <name>${escapeXml(name)}</name>`);
  if (type) {
    xmlParts.push(`    <type>${escapeXml(type)}</type>`);
  }
  xmlParts.push('    <trkseg>');

  // Track points
  for (let i = 0; i < latlng.length; i++) {
    const [lat, lng] = latlng[i];
    
    xmlParts.push(`      <trkpt lat="${lat}" lon="${lng}">`);
    
    // Add elevation if available
    if (altitude && altitude[i] !== undefined) {
      xmlParts.push(`        <ele>${altitude[i]}</ele>`);
    }
    
    // Add timestamp if available (relative to start time)
    if (startDate && time && time[i] !== undefined) {
      const pointTime = new Date(startDate.getTime() + time[i] * 1000);
      xmlParts.push(`        <time>${pointTime.toISOString()}</time>`);
    }
    
    xmlParts.push('      </trkpt>');
  }

  xmlParts.push('    </trkseg>');
  xmlParts.push('  </trk>');
  xmlParts.push('</gpx>');

  return xmlParts.join('\n');
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Main function to fetch streams and generate GPX
 */
export async function fetchAndGenerateGPX(
  activityId: string,
  accessToken: string,
  metadata: {
    name: string;
    startDate?: Date;
    type?: string;
  }
): Promise<string | null> {
  console.log(`🎯 Generating GPX for activity ${activityId}...`);
  
  // Fetch streams from Strava
  const streams = await fetchActivityStreams(activityId, accessToken);
  
  if (!streams) {
    console.log(`⚠️ Cannot generate GPX - no stream data available`);
    return null;
  }

  try {
    // Generate GPX XML
    const gpxContent = generateGPX(streams, {
      ...metadata,
      activityId,
    });

    console.log(`✅ GPX generated successfully (${gpxContent.length} bytes)`);
    return gpxContent;
  } catch (error) {
    console.error(`❌ Error generating GPX:`, error);
    return null;
  }
}

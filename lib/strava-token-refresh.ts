import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";

const stravaTokenLogger = getLogger("strava-token-refresh");

/**
 * Refresh a Strava access token if it's expired or about to expire
 * Returns the valid access token (either existing or newly refreshed)
 */
export async function getValidStravaToken(userId: string): Promise<string | null> {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: 'strava',
    },
  });

  if (!account?.refresh_token) {
    stravaTokenLogger.error("No Strava account or refresh token found", {
      userId,
    });
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at || 0;
  const isExpired = expiresAt <= now + 300; // Refresh if expires within 5 minutes

  if (!isExpired && account.access_token) {
    stravaTokenLogger.debug("Existing Strava access token is still valid", {
      expiresAt,
      userId,
    });
    return account.access_token;
  }

  stravaTokenLogger.info("Refreshing Strava access token", {
    expiresAt,
    userId,
  });

  // Refresh the token
  try {
    const clientId = process.env.STRAVA_CLIENT_ID?.trim();
    const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim();
    
    // Debug logging (will mask the secret for security)
    stravaTokenLogger.debug("Preparing Strava token refresh request", {
      clientId,
      clientSecretPresent: !!clientSecret,
      clientSecretLength: clientSecret?.length,
      refreshTokenPresent: !!account.refresh_token,
      refreshTokenLength: account.refresh_token?.length,
      userId,
    });

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: account.refresh_token,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      stravaTokenLogger.error("Failed to refresh Strava token", {
        errorText,
        status: response.status,
        userId,
      });
      return null;
    }

    const data = await response.json();

    // Update the account with new tokens
    await db.account.update({
      where: { id: account.id },
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      },
    });

    stravaTokenLogger.info("Strava access token refreshed successfully", {
      expiresAt: data.expires_at,
      userId,
    });
    return data.access_token;
  } catch (error) {
    stravaTokenLogger.error("Unexpected error refreshing Strava token", {
      error,
      userId,
    });
    return null;
  }
}

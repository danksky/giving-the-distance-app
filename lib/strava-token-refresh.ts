import { db } from "@/lib/db";

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
    console.error('❌ No Strava account or refresh token found for user:', userId);
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at || 0;
  const isExpired = expiresAt <= now + 300; // Refresh if expires within 5 minutes

  if (!isExpired && account.access_token) {
    console.log('✅ Access token is still valid');
    return account.access_token;
  }

  console.log('🔄 Access token expired or expiring soon, refreshing...');

  // Refresh the token
  try {
    const clientId = process.env.STRAVA_CLIENT_ID?.trim();
    const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim();
    
    // Debug logging (will mask the secret for security)
    console.log('🔧 Using Strava credentials:', {
      clientId,
      clientSecretPresent: !!clientSecret,
      clientSecretLength: clientSecret?.length,
      refreshTokenPresent: !!account.refresh_token,
      refreshTokenLength: account.refresh_token?.length,
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
      console.error('❌ Failed to refresh Strava token:', response.status, errorText);
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

    console.log('✅ Access token refreshed successfully');
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing Strava token:', error);
    return null;
  }
}

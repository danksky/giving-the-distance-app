/**
 * Slack Notifications Helper
 * 
 * Centralized functions for sending notifications to Slack
 */

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  elements?: Array<{
    type: string;
    text: string;
  }>;
}

interface SlackMessage {
  channel: string;
  text: string;
  blocks: SlackBlock[];
}

/**
 * Send a message to Slack
 */
async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  const slackToken = process.env.SLACK_BOT_TOKEN;
  const slackChannel = process.env.SLACK_CHANNEL;

  if (!slackToken || !slackChannel) {
    console.error("Slack configuration missing - skipping notification");
    return false;
  }

  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${slackToken}`,
      },
      body: JSON.stringify({
        ...message,
        channel: slackChannel,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack API error:", data);
      return false;
    }

    console.log("✅ Slack notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return false;
  }
}

/**
 * Notify when a new activity is created
 */
export async function notifyNewActivity(activity: {
  id: string;
  stravaActivityId: bigint;
  name: string | null;
  type: string | null;
  distanceMeters: number | null;
  userName?: string;
  userEmail?: string;
}) {
  const distanceKm = activity.distanceMeters
    ? (activity.distanceMeters / 1000).toFixed(2)
    : "N/A";
  const distanceMiles = activity.distanceMeters
    ? (activity.distanceMeters / 1609.34).toFixed(2)
    : "N/A";

  const message: SlackMessage = {
    channel: "",
    text: "🎉 New Activity Created!",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎉 New Activity Created",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Activity:*\n${activity.name || "Untitled"}`,
          },
          {
            type: "mrkdwn",
            text: `*Type:*\n${activity.type || "Unknown"}`,
          },
          {
            type: "mrkdwn",
            text: `*Distance:*\n${distanceKm} km (${distanceMiles} mi)`,
          },
          {
            type: "mrkdwn",
            text: `*Strava ID:*\n${activity.stravaActivityId.toString()}`,
          },
        ],
      },
    ],
  };

  // Add user info if available
  if (activity.userName || activity.userEmail) {
    message.blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*User:*\n${activity.userName || "Unknown"}`,
        },
        {
          type: "mrkdwn",
          text: `*Email:*\n${activity.userEmail || "N/A"}`,
        },
      ],
    });
  }

  message.blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Created: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
      },
    ],
  });

  await sendSlackMessage(message);
}

/**
 * Notify when an activity is deleted
 */
export async function notifyActivityDeleted(activity: {
  stravaActivityId: bigint;
  name: string | null;
  type: string | null;
  userName?: string;
  userEmail?: string;
}) {
  const message: SlackMessage = {
    channel: "",
    text: "🗑️ Activity Deleted",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🗑️ Activity Deleted",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Activity:*\n${activity.name || "Untitled"}`,
          },
          {
            type: "mrkdwn",
            text: `*Type:*\n${activity.type || "Unknown"}`,
          },
          {
            type: "mrkdwn",
            text: `*Strava ID:*\n${activity.stravaActivityId.toString()}`,
          },
        ],
      },
    ],
  };

  // Add user info if available
  if (activity.userName || activity.userEmail) {
    message.blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*User:*\n${activity.userName || "Unknown"}`,
        },
        {
          type: "mrkdwn",
          text: `*Email:*\n${activity.userEmail || "N/A"}`,
        },
      ],
    });
  }

  message.blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Deleted: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
      },
    ],
  });

  await sendSlackMessage(message);
}

/**
 * Notify when a new user joins
 */
export async function notifyNewUser(user: {
  name: string | null;
  email: string | null;
  provider?: string;
}) {
  const message: SlackMessage = {
    channel: "",
    text: "👋 New User Joined!",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "👋 New User Joined",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Name:*\n${user.name || "Not provided"}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${user.email || "Not provided"}`,
          },
        ],
      },
    ],
  };

  if (user.provider) {
    message.blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Auth Provider:*\n${user.provider}`,
        },
      ],
    });
  }

  message.blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Joined: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
      },
    ],
  });

  await sendSlackMessage(message);
}

/**
 * Notify when Strava authorization succeeds
 */
export async function notifyStravaAuthSuccess(user: {
  name: string | null;
  email: string | null;
  stravaAthleteId: bigint;
  scopes: string[];
}) {
  const message: SlackMessage = {
    channel: "",
    text: "✅ Strava Authorization Successful",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "✅ Strava Authorization Successful",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*User:*\n${user.name || "Unknown"}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${user.email || "N/A"}`,
          },
          {
            type: "mrkdwn",
            text: `*Strava Athlete ID:*\n${user.stravaAthleteId.toString()}`,
          },
          {
            type: "mrkdwn",
            text: `*Granted Scopes:*\n${user.scopes.join(", ")}`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Authorized: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
          },
        ],
      },
    ],
  };

  await sendSlackMessage(message);
}

/**
 * Notify when Strava authorization fails
 */
export async function notifyStravaAuthFailure(details: {
  userName?: string | null;
  userEmail?: string | null;
  error: string;
  missingScopes?: string[];
}) {
  const message: SlackMessage = {
    channel: "",
    text: "❌ Strava Authorization Failed",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "❌ Strava Authorization Failed",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*User:*\n${details.userName || "Unknown"}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${details.userEmail || "N/A"}`,
          },
        ],
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Error:*\n${details.error}`,
          },
        ],
      },
    ],
  };

  if (details.missingScopes && details.missingScopes.length > 0) {
    message.blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Missing Scopes:*\n${details.missingScopes.join(", ")}`,
        },
      ],
    });
  }

  message.blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Failed: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
      },
    ],
  });

  await sendSlackMessage(message);
}

/**
 * Notify when a user de-authorizes Strava
 */
export async function notifyStravaDeauthorization(user: {
  stravaAthleteId: bigint;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const message: SlackMessage = {
    channel: "",
    text: "🔓 Strava De-authorization",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🔓 Strava De-authorization",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*User:*\n${user.userName || "Unknown"}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${user.userEmail || "N/A"}`,
          },
          {
            type: "mrkdwn",
            text: `*Strava Athlete ID:*\n${user.stravaAthleteId.toString()}`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `De-authorized: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
          },
        ],
      },
    ],
  };

  await sendSlackMessage(message);
}

/**
 * Notify when a potential sponsor selects a Google Place
 */
export async function notifyGooglePlaceSelection(placeData: {
  businessName: string;
  businessLocation: string;
  placeId: string;
  googleMapsUrl?: string;
}) {
  const googleMapsUrl = placeData.googleMapsUrl || 
    `https://www.google.com/maps/place/?q=place_id:${placeData.placeId}`;

  const message: SlackMessage = {
    channel: "",
    text: "🏢 New Business Interest - Google Place Selected",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🏢 Google Place Selected",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Business Name:*\n${placeData.businessName}`,
          },
          {
            type: "mrkdwn",
            text: `*Location:*\n${placeData.businessLocation}`,
          },
        ],
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Place ID:*\n\`${placeData.placeId}\``,
          },
          {
            type: "mrkdwn",
            text: `*Google Maps:*\n<${googleMapsUrl}|View on Maps>`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Selected: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
          },
        ],
      },
    ],
  };

  await sendSlackMessage(message);
}

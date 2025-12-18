import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const slackToken = process.env.SLACK_BOT_TOKEN;
    const slackChannel = process.env.SLACK_CHANNEL;

    if (!slackToken || !slackChannel) {
      console.error("Slack configuration missing");
      return NextResponse.json(
        { error: "Slack integration not configured" },
        { status: 500 }
      );
    }

    // Format the message for Slack
    const message = {
      channel: slackChannel,
      text: "🎯 New Sponsor Interest!",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎯 New Sponsor Interest",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Phone:*\n${phone}`,
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${email || "Not provided"}`,
            },
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Submitted: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
            },
          ],
        },
      ],
    };

    // Send to Slack
    const slackResponse = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${slackToken}`,
      },
      body: JSON.stringify(message),
    });

    const slackData = await slackResponse.json();

    if (!slackData.ok) {
      console.error("Slack API error:", slackData);
      return NextResponse.json(
        { error: "Failed to send to Slack" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing sponsor interest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

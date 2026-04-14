import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { notifyNewActivity } from "@/lib/slack-notifications";

const activityNotificationLogger = getLogger("activity-notifications");

const ACTIVITY_CREATED_SLACK_TYPE = "SLACK_ACTIVITY_CREATED";
const STATUS_PENDING = "PENDING";
const STATUS_SENDING = "SENDING";
const STATUS_SENT = "SENT";
const STATUS_FAILED = "FAILED";

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function claimActivityNotification(
  activityId: string,
  type: string
): Promise<boolean> {
  try {
    await db.activityNotification.create({
      data: {
        activityId,
        type,
        status: STATUS_SENDING,
      },
    });

    return true;
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }

  const existingNotification = await db.activityNotification.findUnique({
    where: {
      activityId_type: {
        activityId,
        type,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existingNotification) {
    return false;
  }

  if (
    existingNotification.status !== STATUS_FAILED &&
    existingNotification.status !== STATUS_PENDING
  ) {
    return false;
  }

  const claimResult = await db.activityNotification.updateMany({
    where: {
      id: existingNotification.id,
      status: {
        in: [STATUS_FAILED, STATUS_PENDING],
      },
    },
    data: {
      status: STATUS_SENDING,
      lastError: null,
    },
  });

  return claimResult.count === 1;
}

async function markActivityNotificationSent(activityId: string, type: string) {
  await db.activityNotification.update({
    where: {
      activityId_type: {
        activityId,
        type,
      },
    },
    data: {
      status: STATUS_SENT,
      sentAt: new Date(),
      lastError: null,
    },
  });
}

async function markActivityNotificationFailed(
  activityId: string,
  type: string,
  error: unknown
) {
  await db.activityNotification.update({
    where: {
      activityId_type: {
        activityId,
        type,
      },
    },
    data: {
      status: STATUS_FAILED,
      lastError: error instanceof Error ? error.message : String(error),
    },
  });
}

export async function sendNewActivitySlackNotificationOnce(input: {
  activityId: string;
  userName?: string;
  userEmail?: string;
}) {
  const claimed = await claimActivityNotification(
    input.activityId,
    ACTIVITY_CREATED_SLACK_TYPE
  );

  if (!claimed) {
    activityNotificationLogger.info("Skipped duplicate activity notification", {
      activityId: input.activityId,
      type: ACTIVITY_CREATED_SLACK_TYPE,
    });
    return false;
  }

  try {
    const activity = await db.activity.findUnique({
      where: { id: input.activityId },
      select: {
        id: true,
        stravaActivityId: true,
        name: true,
        type: true,
        distanceMeters: true,
        charityCommitments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            charity: {
              select: {
                name: true,
              },
            },
            campaign: {
              select: {
                sponsor: {
                  select: {
                    businessName: true,
                  },
                },
              },
            },
          },
        },
        sponsorMatches: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            campaign: {
              select: {
                sponsor: {
                  select: {
                    businessName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!activity) {
      throw new Error(`Activity ${input.activityId} not found for notification`);
    }

    const latestCommitment = activity.charityCommitments[0];
    const latestSponsorMatch = activity.sponsorMatches[0];

    await notifyNewActivity({
      id: activity.id,
      stravaActivityId: activity.stravaActivityId,
      name: activity.name,
      type: activity.type,
      distanceMeters: activity.distanceMeters?.toNumber() ?? null,
      userName: input.userName,
      userEmail: input.userEmail,
      sponsorName:
        latestCommitment?.campaign.sponsor.businessName ??
        latestSponsorMatch?.campaign?.sponsor.businessName ??
        null,
      charityName: latestCommitment?.charity.name ?? null,
    });

    await markActivityNotificationSent(activity.id, ACTIVITY_CREATED_SLACK_TYPE);

    return true;
  } catch (error) {
    await markActivityNotificationFailed(
      input.activityId,
      ACTIVITY_CREATED_SLACK_TYPE,
      error
    );

    activityNotificationLogger.error("Activity notification delivery failed", {
      activityId: input.activityId,
      error,
      type: ACTIVITY_CREATED_SLACK_TYPE,
    });

    throw error;
  }
}

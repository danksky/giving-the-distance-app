import { db } from "./db";

/**
 * Get the charity that was selected by a user at a specific point in time
 * This is useful for determining which charity should be attributed to an activity
 */
export async function getCharityAtTime(
  userId: string,
  timestamp: Date
): Promise<{
  id: string;
  name: string;
  fullName: string;
  emoji: string;
  isDefault: boolean;
} | null> {
  // Find the most recent charity selection before or at the given timestamp
  const selection = await db.charitySelection.findFirst({
    where: {
      userId,
      selectedAt: {
        lte: timestamp,
      },
    },
    orderBy: {
      selectedAt: "desc",
    },
    include: {
      charity: true,
    },
  });

  if (selection) {
    return selection.charity;
  }

  // If no selection found, return the default charity
  const defaultCharity = await db.charity.findFirst({
    where: {
      isDefault: true,
    },
  });

  return defaultCharity;
}

/**
 * Get a user's current active charity selection
 */
export async function getCurrentCharity(userId: string) {
  const selection = await db.charitySelection.findFirst({
    where: {
      userId,
      isActive: true,
    },
    include: {
      charity: true,
    },
  });

  if (selection) {
    return selection.charity;
  }

  // Fall back to default charity if no selection exists
  const defaultCharity = await db.charity.findFirst({
    where: {
      isDefault: true,
    },
  });

  return defaultCharity;
}

/**
 * Get the full history of a user's charity selections
 */
export async function getCharityHistory(userId: string) {
  return db.charitySelection.findMany({
    where: {
      userId,
    },
    include: {
      charity: true,
    },
    orderBy: {
      selectedAt: "desc",
    },
  });
}

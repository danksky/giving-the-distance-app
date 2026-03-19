import { db } from "./db";

export async function getDefaultCharity() {
  return db.charity.findFirst({
    where: {
      isDefault: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Ensure a user has a persisted selected charity.
 * Falls back to the default charity and records an active selection when absent.
 */
export async function ensureUserHasSelectedCharity(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { selectedCharity: true },
  });

  if (!user) {
    return null;
  }

  if (user.selectedCharity) {
    return user.selectedCharity;
  }

  const defaultCharity = await getDefaultCharity();

  if (!defaultCharity) {
    return null;
  }

  const updatedUser = await db.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      include: { selectedCharity: true },
    });

    if (!currentUser) {
      return null;
    }

    if (currentUser.selectedCharity) {
      return currentUser.selectedCharity;
    }

    await tx.charitySelection.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    await tx.charitySelection.create({
      data: {
        userId,
        charityId: defaultCharity.id,
        isActive: true,
      },
    });

    const refreshedUser = await tx.user.update({
      where: { id: userId },
      data: { selectedCharityId: defaultCharity.id },
      include: { selectedCharity: true },
    });

    return refreshedUser.selectedCharity;
  });

  return updatedUser;
}

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
  logoUrl: string | null;
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
  return getDefaultCharity();
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
  return getDefaultCharity();
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

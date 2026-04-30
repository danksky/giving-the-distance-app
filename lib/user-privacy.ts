import { db } from "@/lib/db";

export interface UserPrivacyDefaults {
  defaultActivityIsPublic: boolean;
  defaultActivityMapIsPublic: boolean;
}

const FALLBACK_PRIVACY_DEFAULTS: UserPrivacyDefaults = {
  defaultActivityIsPublic: true,
  defaultActivityMapIsPublic: false,
};

export async function getUserPrivacyDefaultsByEmail(
  email: string
): Promise<UserPrivacyDefaults> {
  try {
    const rows = await db.$queryRaw<UserPrivacyDefaults[]>`
      SELECT
        "defaultActivityIsPublic",
        "defaultActivityMapIsPublic"
      FROM "users"
      WHERE "email" = ${email}
      LIMIT 1
    `;

    return rows[0] ?? FALLBACK_PRIVACY_DEFAULTS;
  } catch (error) {
    console.warn("Falling back to in-app privacy defaults:", error);
    return FALLBACK_PRIVACY_DEFAULTS;
  }
}

export async function updateUserPrivacyDefaultsByEmail(
  email: string,
  input: UserPrivacyDefaults
): Promise<UserPrivacyDefaults> {
  const rows = await db.$queryRaw<UserPrivacyDefaults[]>`
    UPDATE "users"
    SET
      "defaultActivityIsPublic" = ${input.defaultActivityIsPublic},
      "defaultActivityMapIsPublic" = ${input.defaultActivityMapIsPublic},
      "updatedAt" = NOW()
    WHERE "email" = ${email}
    RETURNING
      "defaultActivityIsPublic",
      "defaultActivityMapIsPublic"
  `;

  return rows[0] ?? input;
}

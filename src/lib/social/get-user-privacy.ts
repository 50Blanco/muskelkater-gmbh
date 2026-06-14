import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { userPrivacySettings } from "@/db/schema";

export interface UserPrivacy {
  showTraining: boolean;
  showSteps: boolean;
  showNutrition: boolean;
  showWater: boolean;
  showHabits: boolean;
  showWeeklyCheckinStatus: boolean;
  showInRanking: boolean;
}

export const DEFAULT_PRIVACY: UserPrivacy = {
  showTraining: true,
  showSteps: true,
  showNutrition: true,
  showWater: true,
  showHabits: true,
  showWeeklyCheckinStatus: true,
  showInRanking: true,
};

function rowToPrivacy(row: {
  showTraining: boolean;
  showSteps: boolean;
  showNutrition: boolean;
  showWater: boolean;
  showHabits: boolean;
  showWeeklyCheckinStatus: boolean;
  showInRanking: boolean;
}): UserPrivacy {
  return {
    showTraining: row.showTraining,
    showSteps: row.showSteps,
    showNutrition: row.showNutrition,
    showWater: row.showWater,
    showHabits: row.showHabits,
    showWeeklyCheckinStatus: row.showWeeklyCheckinStatus,
    showInRanking: row.showInRanking,
  };
}

/** Lädt die Privacy-Settings eines einzelnen Nutzers. Fehlt ein Eintrag → Defaults. */
export async function getUserPrivacy(userId: string): Promise<UserPrivacy> {
  const [row] = await db
    .select({
      showTraining: userPrivacySettings.showTraining,
      showSteps: userPrivacySettings.showSteps,
      showNutrition: userPrivacySettings.showNutrition,
      showWater: userPrivacySettings.showWater,
      showHabits: userPrivacySettings.showHabits,
      showWeeklyCheckinStatus: userPrivacySettings.showWeeklyCheckinStatus,
      showInRanking: userPrivacySettings.showInRanking,
    })
    .from(userPrivacySettings)
    .where(eq(userPrivacySettings.userId, userId))
    .limit(1);

  return row ? rowToPrivacy(row) : { ...DEFAULT_PRIVACY };
}

/**
 * Lädt die Privacy-Settings mehrerer Nutzer in einer Query.
 * Nutzer ohne Eintrag erhalten Default-Settings (alles sichtbar).
 */
export async function getManyUserPrivacy(
  userIds: string[],
): Promise<Map<string, UserPrivacy>> {
  const result = new Map<string, UserPrivacy>();
  if (userIds.length === 0) return result;

  for (const uid of userIds) result.set(uid, { ...DEFAULT_PRIVACY });

  const rows = await db
    .select({
      userId: userPrivacySettings.userId,
      showTraining: userPrivacySettings.showTraining,
      showSteps: userPrivacySettings.showSteps,
      showNutrition: userPrivacySettings.showNutrition,
      showWater: userPrivacySettings.showWater,
      showHabits: userPrivacySettings.showHabits,
      showWeeklyCheckinStatus: userPrivacySettings.showWeeklyCheckinStatus,
      showInRanking: userPrivacySettings.showInRanking,
    })
    .from(userPrivacySettings)
    .where(inArray(userPrivacySettings.userId, userIds));

  for (const row of rows) result.set(row.userId, rowToPrivacy(row));

  return result;
}

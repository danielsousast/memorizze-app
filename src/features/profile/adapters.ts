import type { Profile as ProfileObject } from "@/db";
import { limitFromStored, parseTheme } from "@/domain/preferences";
import { DEFAULT_REMINDER_HOUR, isReminderHour } from "@/domain/reminder";

import type { Profile } from "./interfaces";

export function toProfile(obj: ProfileObject): Profile {
  return {
    id: obj._id.toHexString(),
    name: obj.name,
    dailyGoal: obj.dailyGoal,
    createdAt: obj.createdAt,
    studyTutorialSeen: obj.studyTutorialSeen,
    themePreference: parseTheme(obj.themePreference),
    newCardsPerDay: limitFromStored(obj.newCardsPerDay),
    reminderEnabled: obj.reminderEnabled,
    reminderHour: isReminderHour(obj.reminderHour) ? obj.reminderHour : DEFAULT_REMINDER_HOUR,
  };
}

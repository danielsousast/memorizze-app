import { t } from "@/lib/i18n";

export const REMINDER_HOURS: readonly number[] = Array.from({ length: 17 }, (_, index) => 6 + index);

export const DEFAULT_REMINDER_HOUR = 19;

export function reminderTitle(): string {
  return t("reminder.title");
}

export function reminderBody(): string {
  return t("reminder.body");
}

export function reminderChannelName(): string {
  return t("reminder.channelName");
}

export function isReminderHour(value: unknown): value is number {
  return REMINDER_HOURS.some((hour) => hour === value);
}

export function reminderHourOrDefault(value: number): number {
  return isReminderHour(value) ? value : DEFAULT_REMINDER_HOUR;
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

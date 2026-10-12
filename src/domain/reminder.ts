export const REMINDER_HOURS: readonly number[] = Array.from({ length: 17 }, (_, index) => 6 + index);

export const DEFAULT_REMINDER_HOUR = 19;

export const REMINDER_TITLE = "Hora de revisar";
export const REMINDER_BODY = "Seus cartões estão esperando. Leva só alguns minutos.";

export function isReminderHour(value: unknown): value is number {
  return REMINDER_HOURS.some((hour) => hour === value);
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

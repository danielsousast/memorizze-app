import { t } from "@/lib/i18n";

export function endOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

export function isDue(dueDate: Date, now: Date): boolean {
  return dueDate.getTime() <= endOfLocalDay(now).getTime();
}

// Names and templates come from the catalog: same result on Hermes and Jest, no Intl/ICU.
function weekdayName(d: Date): string {
  return t(`date.weekdays.${d.getDay()}`);
}

function monthName(d: Date): string {
  return t(`date.months.${d.getMonth()}`);
}

export function formatLongDate(d: Date): string {
  return t("date.longDate", { weekday: weekdayName(d), day: d.getDate(), month: monthName(d) });
}

export function formatDayMonth(d: Date): string {
  return t("date.dayMonth", { day: d.getDate(), month: monthName(d) });
}

export function formatMonthYear(d: Date): string {
  return t("date.monthYear", { month: monthName(d), year: d.getFullYear() });
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Calendar days via date components, so a DST change never shifts the wall clock.
export function addLocalDays(d: Date, n: number): Date {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + n,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds(),
  );
}

export function formatWeekdayShort(d: Date): string {
  return t(`date.weekdaysShort.${d.getDay()}`);
}

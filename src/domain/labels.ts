import { t } from "@/lib/i18n";

import { addLocalDays, formatWeekdayShort } from "./dates";

// Tomorrow's due count on the empty-session screen (undefined while loading).
export function tomorrowLabel(count: number | undefined): string {
  if (count === undefined) return "";
  return t("labels.tomorrow", { count });
}

// Tomorrow's due count on the session summary (undefined while loading).
export function tomorrowSummaryLabel(count: number | undefined): string {
  if (count === undefined) return "";
  return t("labels.tomorrowSummary", { count });
}

export function signOutMessage(decks: number, cards: number): string {
  return t("labels.signOut", {
    decks: t("plurals.deck", { count: decks }),
    cards: t("plurals.card", { count: cards }),
  });
}

export function studyTimeLabel(minutes: number): string {
  if (minutes === 0) return t("labels.studyTimeUnderMinute");
  return t("labels.studyTime", { minutes });
}

export function reviewedCardsLabel(total: number): string {
  return t("labels.reviewedCards", { count: total });
}

export function streakDaysLabel(streak: number): string {
  return t("labels.streakDays", { count: streak });
}

export function daysLabel(n: number): string {
  return t("plurals.day", { count: n });
}

export function percentLabel(n: number | null): string {
  return n === null ? "—" : `${n}%`;
}

export function reviewsLabel(n: number): string {
  return t("plurals.review", { count: n });
}

export function streakTitle(streak: number): string {
  return t("plurals.streakDay", { count: streak });
}

export function streakSubtitle(streak: number, reviewedToday: boolean): string {
  if (streak === 0) return t("labels.streakStart");
  if (reviewedToday) return t("labels.streakReviewedToday");
  return t("labels.streakStudyToday", { target: streak + 1 });
}

// Weekday labels for the last `length` days ending today, which reads "Today".
export function weekLabels(length: number, now: Date): string[] {
  const last = length - 1;
  return Array.from({ length }, (_, i) =>
    i === last ? t("labels.today") : formatWeekdayShort(addLocalDays(now, i - last)),
  );
}

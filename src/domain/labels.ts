import { addLocalDays, formatWeekdayShort } from "./dates";
import { plural } from "./text";

// Tomorrow's due count on the empty-session screen (undefined while loading).
export function tomorrowLabel(count: number | undefined): string {
  if (count === undefined) return "";
  if (count === 0) return "Amanhã: nenhum cartão";
  return `Amanhã: ${plural(count, "cartão", "cartões")}`;
}

// Tomorrow's due count on the session summary (undefined while loading).
export function tomorrowSummaryLabel(count: number | undefined): string {
  if (count === undefined) return "";
  if (count === 0) return "Amanhã: nenhum cartão para revisar";
  return `Amanhã: ${plural(count, "cartão", "cartões")} para revisar`;
}

export function studyTimeLabel(minutes: number): string {
  if (minutes === 0) return "< 1 min de estudo";
  return `${minutes} min de estudo`;
}

export function reviewedCardsLabel(total: number): string {
  return total === 1 ? "cartão revisto" : "cartões revistos";
}

export function streakDaysLabel(streak: number): string {
  return streak === 1 ? "dia seguido" : "dias seguidos";
}

export function daysLabel(n: number): string {
  return plural(n, "dia", "dias");
}

export function percentLabel(n: number | null): string {
  return n === null ? "—" : `${n}%`;
}

export function reviewsLabel(n: number): string {
  return plural(n, "revisão", "revisões");
}

export function streakTitle(streak: number): string {
  return plural(streak, "dia seguido", "dias seguidos");
}

export function streakSubtitle(streak: number, reviewedToday: boolean): string {
  if (streak === 0) return "Sua sequência começa no primeiro estudo";
  if (reviewedToday) return "Você já estudou hoje";
  return `Estude hoje para chegar a ${streak + 1}`;
}

// Weekday labels for the last `length` days ending today, which reads "Hoje".
export function weekLabels(length: number, now: Date): string[] {
  const last = length - 1;
  return Array.from({ length }, (_, i) =>
    i === last ? "Hoje" : formatWeekdayShort(addLocalDays(now, i - last)),
  );
}

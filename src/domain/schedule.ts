import { t } from "@/lib/i18n";

import { addLocalDays, startOfLocalDay } from "./dates";

export type Grade = 0 | 1 | 2 | 3;

export type SrsState = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
};

// Getters resolve the text at read time, so a locale change shows on the next read.
export const gradeLabel: Record<Grade, string> = {
  get 0() {
    return t("grade.0");
  },
  get 1() {
    return t("grade.1");
  },
  get 2() {
    return t("grade.2");
  },
  get 3() {
    return t("grade.3");
  },
};

const MIN_EASE = 1.3;

function ease(value: number): number {
  return Math.max(MIN_EASE, Math.round(value * 100) / 100);
}

function goodInterval(card: SrsState): number {
  if (card.repetitions === 0) return 1;
  if (card.repetitions === 1) return 3;
  return Math.round(card.intervalDays * card.easeFactor);
}

function nextState(card: SrsState, grade: Grade): SrsState {
  const { easeFactor, intervalDays, repetitions, lapses } = card;
  switch (grade) {
    case 0:
      return { easeFactor: ease(easeFactor - 0.2), intervalDays: 0, repetitions: 0, lapses: lapses + 1 };
    case 1:
      return {
        easeFactor: ease(easeFactor - 0.15),
        intervalDays: Math.max(1, Math.round(intervalDays * 1.2)),
        repetitions: repetitions + 1,
        lapses,
      };
    case 2:
      return { easeFactor: ease(easeFactor), intervalDays: goodInterval(card), repetitions: repetitions + 1, lapses };
    case 3:
      return {
        easeFactor: ease(easeFactor + 0.15),
        intervalDays: Math.round(goodInterval(card) * 1.3),
        repetitions: repetitions + 1,
        lapses,
      };
  }
}

export function schedule(card: SrsState, grade: Grade, now: Date): SrsState & { dueDate: Date } {
  const next = nextState(card, grade);
  return { ...next, dueDate: addLocalDays(startOfLocalDay(now), next.intervalDays) };
}

export function intervalLabel(days: number): string {
  return days === 0 ? t("labels.intervalNow") : t("plurals.day", { count: days });
}

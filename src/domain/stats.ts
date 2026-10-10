import { addLocalDays, startOfLocalDay } from "./dates";
import { cardStage, type CardStage } from "./stage";

// Window of `days` local days ending today: [start of (today - days + 1), now].
function inWindow(d: Date, now: Date, days: number): boolean {
  return (
    d.getTime() >= addLocalDays(startOfLocalDay(now), 1 - days).getTime() &&
    d.getTime() <= now.getTime()
  );
}

// Counts per local day, oldest to today. Future dates are ignored.
export function dailyCounts(dates: Date[], now: Date, days: number): number[] {
  const first = addLocalDays(startOfLocalDay(now), 1 - days);
  const starts = Array.from({ length: days }, (_, i) =>
    addLocalDays(first, i).getTime(),
  );
  const counts = new Array<number>(days).fill(0);
  for (const d of dates) {
    if (!inWindow(d, now, days)) continue;
    let i = days - 1;
    while (starts[i] > d.getTime()) i--;
    counts[i]++;
  }
  return counts;
}

export function accuracy(
  logs: { date: Date; grade: number }[],
  now: Date,
  days: number,
): number | null {
  const inside = logs.filter((l) => inWindow(l.date, now, days));
  if (inside.length === 0) return null;
  return Math.round(
    (100 * inside.filter((l) => l.grade >= 1).length) / inside.length,
  );
}

export function stageCounts(
  cards: { repetitions: number; intervalDays: number }[],
): Record<CardStage, number> {
  const counts: Record<CardStage, number> = { new: 0, learning: 0, mature: 0 };
  for (const c of cards) counts[cardStage(c)]++;
  return counts;
}

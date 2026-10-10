import { addLocalDays, startOfLocalDay } from "./dates";

export function currentStreak(reviewedAt: Date[], now: Date): number {
  const days = new Set(reviewedAt.map((d) => startOfLocalDay(d).getTime()));
  const today = startOfLocalDay(now);
  let cursor = days.has(today.getTime()) ? today : addLocalDays(today, -1);
  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor = addLocalDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(reviewedAt: Date[]): number {
  const days = new Set(reviewedAt.map((d) => startOfLocalDay(d).getTime()));
  let longest = 0;
  for (const time of days) {
    if (days.has(addLocalDays(new Date(time), -1).getTime())) continue;
    let length = 0;
    let cursor = new Date(time);
    while (days.has(cursor.getTime())) {
      length += 1;
      cursor = addLocalDays(cursor, 1);
    }
    longest = Math.max(longest, length);
  }
  return longest;
}

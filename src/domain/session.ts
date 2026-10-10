import type { Grade } from "./schedule";

export type SessionState<T extends { id: string }> = {
  queue: T[];
  total: number;
  completed: number;
  counts: [number, number, number, number];
  startedAt: Date;
  lastAnswerAt?: Date;
};

export function startSession<T extends { id: string }>(cards: T[], now: Date): SessionState<T> {
  return { queue: cards, total: cards.length, completed: 0, counts: [0, 0, 0, 0], startedAt: now };
}

export function answerSession<T extends { id: string }>(
  state: SessionState<T>,
  updated: T,
  grade: Grade,
  now: Date,
): SessionState<T> {
  const counts = [...state.counts] as SessionState<T>["counts"];
  counts[grade] += 1;
  const rest = state.queue.slice(1);
  return {
    ...state,
    queue: grade === 0 ? [...rest, updated] : rest,
    completed: grade === 0 ? state.completed : state.completed + 1,
    counts,
    lastAnswerAt: now,
  };
}

export function skipCurrent<T extends { id: string }>(state: SessionState<T>): SessionState<T> {
  return { ...state, queue: state.queue.slice(1), completed: state.completed + 1 };
}

export function accuracy(counts: SessionState<{ id: string }>["counts"]): number {
  const answers = counts[0] + counts[1] + counts[2] + counts[3];
  if (answers === 0) return 0;
  return Math.round((100 * (answers - counts[0])) / answers);
}

// Under one minute is 0 (the view shows "< 1 min"); otherwise rounded to the nearest minute.
export function studyMinutes(startedAt: Date, lastAnswerAt?: Date): number {
  if (!lastAnswerAt) return 0;
  const ms = lastAnswerAt.getTime() - startedAt.getTime();
  return ms < 60_000 ? 0 : Math.round(ms / 60_000);
}

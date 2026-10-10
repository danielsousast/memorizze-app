import { createRandom } from "@/testing/random";

import type { Grade } from "./schedule";
import { accuracy, answerSession, skipCurrent, startSession, studyMinutes } from "./session";

type Item = { id: string; v: number };

const now = new Date(2026, 9, 10, 10, 0);
const a: Item = { id: "a", v: 0 };
const b: Item = { id: "b", v: 0 };

describe("answerSession", () => {
  it("sends the updated card to the end on Errei (ANS-02)", () => {
    const next = answerSession(startSession([a, b], now), { id: "a", v: 1 }, 0, now);
    expect(next.queue).toEqual([b, { id: "a", v: 1 }]);
    expect(next.completed).toBe(0);
    expect(next.counts).toEqual([1, 0, 0, 0]);
  });

  it.each([1, 2, 3] as Grade[])("removes the card on grade %i (ANS-03)", (grade) => {
    const next = answerSession(startSession([a, b], now), { id: "a", v: 1 }, grade, now);
    expect(next.queue).toEqual([b]);
    expect(next.completed).toBe(1);
    expect(next.total).toBe(2);
    expect(next.counts[grade]).toBe(1);
    expect(next.lastAnswerAt).toEqual(now);
  });
});

describe("accuracy", () => {
  it("rounds the share of grades >= 1 (SUM-03)", () => {
    expect(accuracy([3, 4, 15, 5])).toBe(89);
    expect(accuracy([1, 0, 0, 0])).toBe(0);
    expect(accuracy([0, 0, 1, 0])).toBe(100);
  });

  it("is 0 with no answers", () => {
    expect(accuracy([0, 0, 0, 0])).toBe(0);
  });
});

describe("studyMinutes", () => {
  it("rounds to the nearest minute (SUM-05)", () => {
    const start = new Date(2026, 9, 10, 10, 0, 0);
    expect(studyMinutes(start, new Date(2026, 9, 10, 10, 12, 29))).toBe(12);
    expect(studyMinutes(start, new Date(2026, 9, 10, 10, 12, 30))).toBe(13);
    expect(studyMinutes(start, new Date(2026, 9, 10, 10, 0, 59))).toBe(0);
  });

  it("is 0 without an answer", () => {
    expect(studyMinutes(now, undefined)).toBe(0);
  });
});

describe("skipCurrent", () => {
  it("removes the card without counting an answer", () => {
    const next = skipCurrent(startSession([a, b], now));
    expect(next.queue).toEqual([b]);
    expect(next.completed).toBe(1);
    expect(next.counts).toEqual([0, 0, 0, 0]);
  });
});

describe("session invariant (INV-03)", () => {
  it("keeps 0 <= completed <= total and completed + queue = total", () => {
    const random = createRandom(7);
    for (let run = 0; run < 100; run++) {
      const total = 1 + Math.floor(random.next() * 8);
      const cards = Array.from({ length: total }, (_, i) => ({ id: `c${i}`, v: 0 }));
      let state = startSession(cards, now);
      for (let step = 0; step < 200 && state.queue.length > 0; step++) {
        state =
          random.next() < 0.2
            ? skipCurrent(state)
            : answerSession(state, state.queue[0], random.pick([0, 1, 2, 3] as Grade[]), now);
        expect(state.completed).toBeGreaterThanOrEqual(0);
        expect(state.completed).toBeLessThanOrEqual(state.total);
        expect(state.completed + state.queue.length).toBe(state.total);
      }
    }
  });
});

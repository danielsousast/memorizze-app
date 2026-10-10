import { createRandom } from "@/testing/random";

import { startOfLocalDay } from "./dates";
import { gradeLabel, intervalLabel, schedule, type Grade, type SrsState } from "./schedule";

const now = new Date(2026, 9, 10, 23, 50);
const state = (repetitions: number, intervalDays: number, easeFactor: number, lapses = 0): SrsState => ({
  repetitions,
  intervalDays,
  easeFactor,
  lapses,
});
const run = (card: SrsState, grade: Grade) => {
  const r = schedule(card, grade, now);
  return [r.repetitions, r.intervalDays, r.easeFactor];
};

describe("schedule", () => {
  it.each([
    [0, 0, 2.5, 0, 0, 0, 2.3],
    [0, 0, 2.5, 1, 1, 1, 2.35],
    [0, 0, 2.5, 2, 1, 1, 2.5],
    [0, 0, 2.5, 3, 1, 1, 2.65],
    [1, 1, 2.5, 2, 2, 3, 2.5],
    [1, 1, 2.5, 3, 2, 4, 2.65],
    [2, 3, 2.5, 2, 3, 8, 2.5],
    [2, 3, 2.5, 3, 3, 10, 2.65],
    [3, 10, 2.0, 1, 4, 12, 1.85],
    [4, 20, 1.3, 0, 0, 0, 1.3],
  ] as const)("SRS-08 (%i, %i, %f) grade %i → (%i, %i, %f)", (rep, int, ef, grade, r, i, e) => {
    expect(run(state(rep, int, ef), grade)).toEqual([r, i, e]);
  });

  it("SRS-01 Errei resets and counts a lapse", () => {
    expect(schedule(state(4, 20, 1.3, 2), 0, now)).toMatchObject({
      repetitions: 0,
      intervalDays: 0,
      easeFactor: 1.3,
      lapses: 3,
    });
  });

  it("SRS-05 floors the ease at 1.3 and rounds to 2 places", () => {
    expect(schedule(state(1, 1, 1.4), 0, now).easeFactor).toBe(1.3);
    expect(schedule(state(1, 1, 2.5), 1, now).easeFactor).toBe(2.35);
  });

  it("SRS-06 keeps lapses on Difícil, Bom and Fácil", () => {
    for (const grade of [1, 2, 3] as const) {
      expect(schedule(state(2, 3, 2.5, 5), grade, now).lapses).toBe(5);
    }
  });

  it("SRS-07 due date is local midnight plus the interval", () => {
    expect(schedule(state(0, 0, 2.5), 2, now).dueDate).toEqual(new Date(2026, 9, 11));
    expect(schedule(state(0, 0, 2.5), 0, now).dueDate).toEqual(new Date(2026, 9, 10));
    expect(schedule(state(0, 0, 2.5), 2, new Date(2026, 11, 31, 12)).dueDate).toEqual(
      new Date(2027, 0, 1),
    );
  });

  it("LBL-01 labels intervals", () => {
    expect([0, 1, 2, 142].map(intervalLabel)).toEqual(["agora", "1 dia", "2 dias", "142 dias"]);
    expect(gradeLabel).toEqual({ 0: "Errei", 1: "Difícil", 2: "Bom", 3: "Fácil" });
  });

  it("INV-02 keeps the SM-2 invariants over random sequences", () => {
    const random = createRandom(42);
    for (let run = 0; run < 100; run++) {
      let card: SrsState = state(0, 0, 2.5);
      for (let step = 0; step < 50; step++) {
        const result = schedule(card, random.pick([0, 1, 2, 3] as const), now);
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
        expect(result.intervalDays).toBeGreaterThanOrEqual(0);
        expect(result.repetitions).toBeGreaterThanOrEqual(0);
        expect(result.lapses).toBeGreaterThanOrEqual(card.lapses);
        expect(result.dueDate.getTime()).toBeGreaterThanOrEqual(startOfLocalDay(now).getTime());
        // Beyond ~100 years a Date overflows; the app never reaches it, so restart the card.
        card = result.intervalDays > 36500 ? state(0, 0, 2.5) : result;
      }
    }
  });
});

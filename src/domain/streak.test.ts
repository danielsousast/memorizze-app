import { createRandom } from "@/testing/random";

import { currentStreak, longestStreak } from "./streak";

const now = new Date(2026, 9, 10, 15, 0);
const day = (d: number, h = 12, m = 0) => new Date(2026, 9, d, h, m);

describe("currentStreak", () => {
  it("counts consecutive days ending today or yesterday (STK-02)", () => {
    expect(currentStreak([day(8), day(9), day(10)], now)).toBe(3);
    expect(currentStreak([day(8), day(9)], now)).toBe(2);
    expect(currentStreak([day(7), day(8)], now)).toBe(0);
    expect(currentStreak([day(10)], now)).toBe(1);
    expect(currentStreak([], now)).toBe(0);
  });

  it("counts a review at midnight for its own local day (STK-01)", () => {
    expect(currentStreak([day(9, 0, 0)], now)).toBe(1);
    expect(currentStreak([day(9, 0, 0), day(10)], now)).toBe(2);
    expect(currentStreak([day(8, 23, 59), day(9, 0, 0)], now)).toBe(2);
  });

  it("counts a day once and ignores input order (STK-03)", () => {
    expect(currentStreak([day(10, 8), day(10, 9), day(10, 10)], now)).toBe(1);
    expect(currentStreak([day(9, 23, 59), day(10, 0, 1)], now)).toBe(2);
    expect(currentStreak([day(10), day(8), day(9)], now)).toBe(3);
  });
});

describe("longestStreak", () => {
  it("matches the spec examples (SEQ-03)", () => {
    const cases: [number[], number, number][] = [
      [[], 0, 0],
      [[10], 1, 1],
      [[9], 1, 1],
      [[5, 6, 7, 9, 10], 2, 3],
      [[7, 8], 0, 2],
    ];
    for (const [days, current, longest] of cases) {
      const dates = days.map((d) => day(d));
      expect(currentStreak(dates, now)).toBe(current);
      expect(longestStreak(dates)).toBe(longest);
    }
  });

  it("counts a day once and splits at midnight (SEQ-02)", () => {
    expect(longestStreak([])).toBe(0);
    expect(longestStreak([day(10, 8), day(10, 9)])).toBe(1);
    expect(longestStreak([day(9, 23, 59), day(10, 0, 0)])).toBe(2);
    expect(longestStreak([day(10), day(8), day(9)])).toBe(3);
  });

  it("is never smaller than the current streak (SEQ-04)", () => {
    const random = createRandom(7);
    for (let i = 0; i < 100; i++) {
      const dates = Array.from({ length: Math.floor(random.next() * 15) }, () =>
        day(1 + Math.floor(random.next() * 10), Math.floor(random.next() * 24)),
      );
      expect(longestStreak(dates)).toBeGreaterThanOrEqual(currentStreak(dates, now));
    }
  });
});

import { currentStreak } from "./streak";

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

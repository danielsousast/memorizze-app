import { addLocalDays } from "./dates";
import { accuracy, dailyCounts, stageCounts } from "./stats";

const now = new Date(2026, 9, 9, 12, 0);

describe("dailyCounts", () => {
  it("counts per local day, oldest to today (EDG-01)", () => {
    const dates = [
      new Date(2026, 9, 8, 23, 59),
      new Date(2026, 9, 9, 0, 0),
      new Date(2026, 9, 9, 9, 0),
    ];
    expect(dailyCounts(dates, now, 3)).toEqual([0, 1, 2]);
  });

  it("keeps neighbouring days apart across a DST change (EDG-01)", () => {
    for (const day of [
      new Date(2026, 2, 8),
      new Date(2026, 2, 29),
      new Date(2026, 9, 25),
      new Date(2026, 10, 1),
    ]) {
      const today = addLocalDays(day, 1);
      const dates = [
        new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59),
        new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0),
      ];
      expect(
        dailyCounts(
          dates,
          new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12),
          3,
        ),
      ).toEqual([0, 1, 1]);
    }
  });

  it("ignores future and older-than-window dates (EDG-02)", () => {
    const dates = [
      new Date(2026, 9, 9, 13, 0),
      new Date(2026, 9, 10, 0, 0),
      new Date(2026, 9, 6, 12, 0),
    ];
    expect(dailyCounts(dates, now, 3)).toEqual([0, 0, 0]);
  });
});

describe("accuracy", () => {
  const log = (daysAgo: number, grade: number) => ({
    date: addLocalDays(now, -daysAgo),
    grade,
  });

  it("rounds hits over reviews (ACC-03)", () => {
    const grades = [0, 0, 1, 2, 2, 2, 3, 3, 3, 3];
    expect(
      accuracy(
        grades.map((g) => log(0, g)),
        now,
        7,
      ),
    ).toBe(80);
    expect(accuracy([log(0, 1), log(0, 2), log(0, 0)], now, 7)).toBe(67);
  });

  it("includes 6 days ago but not 7 in the 7-day window (ACC-01)", () => {
    expect(accuracy([log(6, 3)], now, 7)).toBe(100);
    expect(accuracy([log(7, 3)], now, 7)).toBeNull();
  });

  it("includes 29 days ago but not 30 in the 30-day window (ACC-02)", () => {
    expect(accuracy([log(29, 3)], now, 30)).toBe(100);
    expect(accuracy([log(30, 3)], now, 30)).toBeNull();
  });

  it("is null without reviews in the window (ACC-04)", () => {
    expect(accuracy([], now, 7)).toBeNull();
  });

  it("ignores future logs (EDG-02)", () => {
    expect(
      accuracy([{ date: new Date(2026, 9, 9, 13, 0), grade: 3 }], now, 7),
    ).toBeNull();
    expect(
      accuracy(
        [{ date: new Date(2026, 9, 9, 13, 0), grade: 0 }, log(0, 3)],
        now,
        7,
      ),
    ).toBe(100);
  });
});

describe("stageCounts", () => {
  it("buckets cards through cardStage (REGRESSION)", () => {
    expect(
      stageCounts([
        { repetitions: 0, intervalDays: 0 },
        { repetitions: 1, intervalDays: 20 },
        { repetitions: 3, intervalDays: 21 },
        { repetitions: 4, intervalDays: 40 },
      ]),
    ).toEqual({ new: 1, learning: 1, mature: 2 });
  });
});

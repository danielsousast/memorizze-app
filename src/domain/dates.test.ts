import { createRandom } from "@/testing/random";

import { endOfLocalDay, formatLongDate, isDue } from "./dates";

describe("endOfLocalDay", () => {
  it("returns 23:59:59.999 of the local day (DAT-01)", () => {
    const end = new Date(2026, 9, 9, 23, 59, 59, 999);
    expect(endOfLocalDay(new Date(2026, 9, 9, 0, 0))).toEqual(end);
    expect(endOfLocalDay(new Date(2026, 9, 9, 23, 59, 59, 999))).toEqual(end);
  });

  it("stays on the same day on 31/12 (DAT-01)", () => {
    expect(endOfLocalDay(new Date(2026, 11, 31, 12, 0))).toEqual(
      new Date(2026, 11, 31, 23, 59, 59, 999),
    );
  });

  it("does not mutate its argument", () => {
    const now = new Date(2026, 9, 9, 8, 0);
    endOfLocalDay(now);
    expect(now).toEqual(new Date(2026, 9, 9, 8, 0));
  });
});

describe("isDue", () => {
  const now = new Date(2026, 9, 9, 8, 0);

  it("is due at the last millisecond of today (DAT-02)", () => {
    expect(isDue(new Date(2026, 9, 9, 23, 59, 59, 999), now)).toBe(true);
  });

  it("is not due at the start of tomorrow (DAT-02)", () => {
    expect(isDue(new Date(2026, 9, 10, 0, 0), now)).toBe(false);
  });

  it("is due when long overdue (DAT-02)", () => {
    expect(isDue(new Date(2020, 0, 1), now)).toBe(true);
  });

  it("agrees with the local calendar day for random pairs (INV-02)", () => {
    const random = createRandom(42);
    const base = new Date(2026, 9, 9).getTime();
    const day = 24 * 60 * 60 * 1000;
    const at = () => new Date(base + Math.floor((random.next() * 800 - 400) * day));
    const key = (d: Date) => d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();

    for (let i = 0; i < 1000; i++) {
      const due = at();
      const n = at();
      expect(isDue(due, n)).toBe(key(due) <= key(n));
    }
  });
});

describe("formatLongDate", () => {
  it("formats a Friday in pt-BR (HOME-01)", () => {
    expect(formatLongDate(new Date(2026, 9, 9))).toBe("Sexta-feira, 9 de outubro");
  });

  it("formats a Sunday on the 1st of March (HOME-01)", () => {
    expect(formatLongDate(new Date(2026, 2, 1))).toBe("Domingo, 1 de março");
  });
});

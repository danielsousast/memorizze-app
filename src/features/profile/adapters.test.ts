import type { Profile as ProfileObject } from "@/db";

import { toProfile } from "./adapters";

function profileObject(reminderHour: number) {
  return {
    _id: { toHexString: () => "a".repeat(24) },
    name: "Ana",
    dailyGoal: 20,
    createdAt: new Date(2026, 0, 1),
    studyTutorialSeen: false,
    themePreference: "system",
    newCardsPerDay: 10,
    reminderEnabled: true,
    reminderHour,
  } as unknown as ProfileObject;
}

describe("toProfile", () => {
  it("REM-02 keeps a valid reminder hour and the enabled flag", () => {
    expect(toProfile(profileObject(8))).toEqual(
      expect.objectContaining({ reminderEnabled: true, reminderHour: 8 }),
    );
  });

  it("REM-02 falls back to 19 when the stored hour is not a reminder hour", () => {
    expect(toProfile(profileObject(4)).reminderHour).toBe(19);
  });
});

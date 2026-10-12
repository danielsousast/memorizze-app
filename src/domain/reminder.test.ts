import {
  DEFAULT_REMINDER_HOUR,
  REMINDER_BODY,
  REMINDER_HOURS,
  REMINDER_TITLE,
  hourLabel,
  isReminderHour,
} from "./reminder";

describe("reminder hours", () => {
  it("REM-09 lists 6 to 22 in order and labels them HH:00", () => {
    expect(REMINDER_HOURS).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
    expect(hourLabel(6)).toBe("06:00");
    expect(hourLabel(19)).toBe("19:00");
  });

  it("REM-02 defaults to 19 and rejects anything outside the list", () => {
    expect(DEFAULT_REMINDER_HOUR).toBe(19);
    expect(isReminderHour(6)).toBe(true);
    expect(isReminderHour(22)).toBe(true);
    expect(isReminderHour(5)).toBe(false);
    expect(isReminderHour(23)).toBe(false);
    expect(isReminderHour(7.5)).toBe(false);
    expect(isReminderHour("7")).toBe(false);
  });
});

describe("reminder text", () => {
  it("REM-07 uses the fixed title and body", () => {
    expect(REMINDER_TITLE).toBe("Hora de revisar");
    expect(REMINDER_BODY).toBe("Seus cartões estão esperando. Leva só alguns minutos.");
  });
});

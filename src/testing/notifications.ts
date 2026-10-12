import type { ReminderScheduler } from "@/features/reminder/interfaces";

export type FakePermission = "undetermined" | "granted" | "denied" | "blocked";
type Method = keyof ReminderScheduler;

/** In-memory `ReminderScheduler`: `scheduledHour` is what the OS would fire, `null` when nothing is scheduled. */
export function createFakeScheduler(initial: { permission?: FakePermission } = {}) {
  let permission: FakePermission = initial.permission ?? "undetermined";
  let answerToPrompt: "granted" | "denied" = "granted";
  const failures = new Set<Method>();
  const gates = new Map<Method, Promise<void>>();
  const state = { scheduledHour: null as number | null, prompts: 0 };

  function maybeFail(method: Method) {
    if (!failures.delete(method)) return;
    throw new Error(`fake ${method} failed`);
  }

  async function passGate(method: Method) {
    const gate = gates.get(method);
    gates.delete(method);
    await gate;
  }

  const scheduler: ReminderScheduler = {
    async ensurePermission() {
      await passGate("ensurePermission");
      maybeFail("ensurePermission");
      if (permission === "undetermined") {
        state.prompts += 1;
        permission = answerToPrompt === "granted" ? "granted" : "blocked";
      }
      return permission === "granted";
    },
    async hasPermission() {
      await passGate("hasPermission");
      maybeFail("hasPermission");
      return permission === "granted";
    },
    async schedule(hour) {
      await passGate("schedule");
      // Like the real adapter: the old reminder is cancelled before the new one is scheduled.
      state.scheduledHour = null;
      maybeFail("schedule");
      state.scheduledHour = hour;
    },
    async cancel() {
      await passGate("cancel");
      maybeFail("cancel");
      state.scheduledHour = null;
    },
  };

  return {
    scheduler,
    state,
    setPermission(next: FakePermission) {
      permission = next;
    },
    /** What the user taps when the system prompt appears. */
    answerPrompt(answer: "granted" | "denied") {
      answerToPrompt = answer;
    },
    /** Makes the next call to `method` throw once. */
    failNext(method: Method) {
      failures.add(method);
    },
    /** Holds the next call to `method` until the returned function is called. */
    holdNext(method: Method): () => void {
      let release!: () => void;
      gates.set(method, new Promise<void>((resolve) => (release = resolve)));
      return release;
    },
    clearFailures() {
      failures.clear();
    },
  };
}

let current = createFakeScheduler();

/** Starts a fresh fake behind `notificationsModuleMock`; call it in `beforeEach`. */
export function resetFakeScheduler(initial: { permission?: FakePermission } = {}) {
  current = createFakeScheduler(initial);
  return current;
}

/**
 * Stand-in for `@/lib/notifications` in tests that render hooks or screens:
 * `jest.mock("@/lib/notifications", () => jest.requireActual("@/testing/notifications").notificationsModuleMock)`.
 */
export const notificationsModuleMock = {
  notificationsScheduler: {
    ensurePermission: () => current.scheduler.ensurePermission(),
    hasPermission: () => current.scheduler.hasPermission(),
    schedule: (hour: number) => current.scheduler.schedule(hour),
    cancel: () => current.scheduler.cancel(),
  } satisfies ReminderScheduler,
  openSystemSettings: jest.fn(async () => undefined),
  configureNotificationHandler: jest.fn(),
};

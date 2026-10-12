import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createRandom } from "@/testing/random";
import { createFakeScheduler } from "@/testing/notifications";
import { openTestRealm } from "@/testing/realm";

import type { ReminderScheduler } from "./interfaces";
import { createReminderRepository } from "./repository";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

describe("reminder repository", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(models);
    realm.write(() => {
      realm.create(Profile, { name: "Ana", createdAt: new Date(2026, 0, 1) });
    });
  });

  afterEach(() => {
    realm.close();
  });

  const saved = () => {
    const profile = realm.objects(Profile)[0];
    return { enabled: profile.reminderEnabled, hour: profile.reminderHour };
  };

  function setSaved(enabled: boolean, hour = 19) {
    realm.write(() => {
      const profile = realm.objects(Profile)[0];
      profile.reminderEnabled = enabled;
      profile.reminderHour = hour;
    });
  }

  describe("apply", () => {
    it("REM-04 asks for permission once when it is still undecided", async () => {
      const fake = createFakeScheduler({ permission: "undetermined" });
      const repository = createReminderRepository(realm, fake.scheduler);

      await repository.apply({ enabled: true });
      await repository.apply({ enabled: false });
      await repository.apply({ enabled: true });

      expect(fake.state.prompts).toBe(1);
    });

    it("REM-05 schedules 19 and saves enabled when permission is granted", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      const repository = createReminderRepository(realm, fake.scheduler);

      await expect(repository.apply({ enabled: true })).resolves.toBe("saved");

      expect(fake.state.scheduledHour).toBe(19);
      expect(saved()).toEqual({ enabled: true, hour: 19 });
    });

    it("REM-06 cancels and saves disabled", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      const repository = createReminderRepository(realm, fake.scheduler);
      await repository.apply({ enabled: true });

      await expect(repository.apply({ enabled: false })).resolves.toBe("saved");

      expect(fake.state.scheduledHour).toBeNull();
      expect(saved().enabled).toBe(false);
    });

    it("REM-15 returns denied, schedules nothing and keeps disabled when the user refuses", async () => {
      const fake = createFakeScheduler({ permission: "undetermined" });
      fake.answerPrompt("denied");
      const repository = createReminderRepository(realm, fake.scheduler);

      await expect(repository.apply({ enabled: true })).resolves.toBe("denied");

      expect(fake.state.scheduledHour).toBeNull();
      expect(saved().enabled).toBe(false);
    });

    it("REM-16 returns denied without a new prompt after a definitive refusal", async () => {
      const fake = createFakeScheduler({ permission: "blocked" });
      const repository = createReminderRepository(realm, fake.scheduler);

      await expect(repository.apply({ enabled: true })).resolves.toBe("denied");

      expect(fake.state.prompts).toBe(0);
      expect(saved().enabled).toBe(false);
    });

    it("REM-09 saves the new hour and reschedules at it", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      const repository = createReminderRepository(realm, fake.scheduler);
      await repository.apply({ enabled: true });

      await repository.apply({ hour: 8 });

      expect(saved()).toEqual({ enabled: true, hour: 8 });
      expect(fake.state.scheduledHour).toBe(8);
    });

    it("REM-10 replaces the scheduled reminder when turned on twice and the hour changes", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      const repository = createReminderRepository(realm, fake.scheduler);

      await repository.apply({ enabled: true });
      await repository.apply({ enabled: true });
      await repository.apply({ hour: 7 });

      expect(fake.state.scheduledHour).toBe(7);
    });

    it("REM-17 leaves the saved state and the schedule untouched when scheduling throws", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      const repository = createReminderRepository(realm, fake.scheduler);
      fake.failNext("schedule");

      await expect(repository.apply({ enabled: true })).rejects.toThrow("schedule");

      expect(saved().enabled).toBe(false);
      expect(fake.state.scheduledHour).toBeNull();
    });

    it("REM-17 restores the old hour when rescheduling throws", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      const repository = createReminderRepository(realm, fake.scheduler);
      await repository.apply({ enabled: true });
      fake.failNext("schedule");

      await expect(repository.apply({ hour: 8 })).rejects.toThrow();

      expect(saved()).toEqual({ enabled: true, hour: 19 });
      expect(fake.state.scheduledHour).toBe(19);
    });

    it("REM-18 cancels what it scheduled when saving fails", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      const repository = createReminderRepository(realm, fake.scheduler);
      jest.spyOn(realm, "write").mockImplementationOnce(() => {
        throw new Error("write failed");
      });

      await expect(repository.apply({ enabled: true })).rejects.toThrow("write failed");

      expect(saved().enabled).toBe(false);
      expect(fake.state.scheduledHour).toBeNull();
    });

    it("REM-18 schedules again when cancelling throws on turn off", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      const repository = createReminderRepository(realm, fake.scheduler);
      await repository.apply({ enabled: true });
      fake.failNext("cancel");

      await expect(repository.apply({ enabled: false })).rejects.toThrow("cancel");

      expect(saved().enabled).toBe(true);
      expect(fake.state.scheduledHour).toBe(19);
    });

    it("REM-10 INVARIANT scheduled matches saved after any random sequence with injected failures", async () => {
      const random = createRandom(11);
      const fake = createFakeScheduler();
      const repository = createReminderRepository(realm, fake.scheduler);
      const permissions = ["undetermined", "granted", "blocked"] as const;
      const methods = ["ensurePermission", "hasPermission", "schedule", "cancel"] as const;

      for (let step = 0; step < 100; step++) {
        if (random.next() < 0.3) fake.setPermission(random.pick(permissions));
        if (random.next() < 0.4) fake.failNext(random.pick(methods));
        const operation = random.pick(["on", "off", "hour", "sync"] as const);
        const run = {
          on: () => repository.apply({ enabled: true }),
          off: () => repository.apply({ enabled: false }),
          hour: () => repository.apply({ hour: random.pick([6, 12, 22]) }),
          sync: () => repository.sync(),
        }[operation];
        const failed = await run().then(() => false, () => true);
        fake.clearFailures();
        // A failed sync leaves the repair to the next app open (REM-11).
        if (failed && operation === "sync") await repository.sync();

        const { enabled, hour } = saved();
        expect(fake.state.scheduledHour).toBe(enabled ? hour : null);
      }
    });
  });

  describe("sync", () => {
    it("REM-11 schedules again at the saved hour when the OS lost it", async () => {
      setSaved(true, 8);
      const fake = createFakeScheduler({ permission: "granted" });
      const repository = createReminderRepository(realm, fake.scheduler);

      await expect(repository.sync()).resolves.toBe(false);

      expect(fake.state.scheduledHour).toBe(8);
    });

    it("REM-12 saves disabled and cancels when enabled without permission", async () => {
      setSaved(true);
      const fake = createFakeScheduler({ permission: "blocked" });
      await fake.scheduler.schedule(19);
      const repository = createReminderRepository(realm, fake.scheduler);

      await expect(repository.sync()).resolves.toBe(true);

      expect(saved().enabled).toBe(false);
      expect(fake.state.scheduledHour).toBeNull();
      expect(fake.state.prompts).toBe(0);
    });

    it("REM-13 cancels when there is no profile", async () => {
      realm.write(() => realm.delete(realm.objects(Profile)));
      const fake = createFakeScheduler({ permission: "granted" });
      await fake.scheduler.schedule(19);
      const repository = createReminderRepository(realm, fake.scheduler);

      await expect(repository.sync()).resolves.toBe(false);

      expect(fake.state.scheduledHour).toBeNull();
    });

    it("REM-14 cancels when the reminder is disabled", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      await fake.scheduler.schedule(19);
      const repository = createReminderRepository(realm, fake.scheduler);

      await expect(repository.sync()).resolves.toBe(false);

      expect(fake.state.scheduledHour).toBeNull();
    });

    it("propagates a scheduler failure so the hook can ignore it", async () => {
      setSaved(true);
      const fake = createFakeScheduler({ permission: "granted" });
      const repository = createReminderRepository(realm, fake.scheduler);
      fake.failNext("schedule");

      await expect(repository.sync()).rejects.toThrow("schedule");
    });
  });

  describe("serial queue", () => {
    it("REM-19 runs a sync fired during an apply only after the apply finishes", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const calls: string[] = [];
      const slow: ReminderScheduler = {
        ...fake.scheduler,
        async schedule(hour) {
          calls.push("apply:schedule");
          await gate;
          await fake.scheduler.schedule(hour);
        },
        async hasPermission() {
          calls.push("sync:hasPermission");
          return fake.scheduler.hasPermission();
        },
      };
      const repository = createReminderRepository(realm, slow);

      const applying = repository.apply({ enabled: true });
      const syncing = repository.sync();
      await new Promise((resolve) => setImmediate(resolve));
      expect(calls).toEqual(["apply:schedule"]);

      release();
      await Promise.all([applying, syncing]);

      expect(calls).toEqual(["apply:schedule", "sync:hasPermission", "apply:schedule"]);
      expect(saved()).toEqual({ enabled: true, hour: 19 });
      expect(fake.state.scheduledHour).toBe(19);
    });

    it("REM-19 serializes repositories created for the same realm", async () => {
      const fake = createFakeScheduler({ permission: "granted" });
      const first = createReminderRepository(realm, fake.scheduler);
      const second = createReminderRepository(realm, fake.scheduler);

      await Promise.all([first.apply({ enabled: true }), second.apply({ hour: 8 }), first.sync()]);

      expect(saved()).toEqual({ enabled: true, hour: 8 });
      expect(fake.state.scheduledHour).toBe(8);
    });
  });
});

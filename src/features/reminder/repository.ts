import { useRealm } from "@realm/react";
import type Realm from "realm";

import { Profile as ProfileObject } from "@/db";
import { reminderHourOrDefault } from "@/domain/reminder";
import { notificationsScheduler } from "@/lib/notifications";

import type { ReminderRepository, ReminderScheduler } from "./interfaces";

// One queue per realm, shared by every repository instance, so `apply` and `sync`
// never interleave (REM-19) even though each hook builds its own repository.
const queues = new WeakMap<Realm, Promise<unknown>>();

export function createReminderRepository(
  realm: Realm,
  scheduler: ReminderScheduler = notificationsScheduler,
): ReminderRepository {
  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = (queues.get(realm) ?? Promise.resolve()).then(task);
    queues.set(realm, run.catch(() => undefined));
    return run;
  }

  function current() {
    return realm.objects(ProfileObject).sorted("createdAt")[0] ?? null;
  }

  // After a failure, bring the schedule back in line with what is saved (REM-18).
  async function reconcile() {
    const profile = current();
    try {
      if (profile?.reminderEnabled) await scheduler.schedule(reminderHourOrDefault(profile.reminderHour));
      else await scheduler.cancel();
    } catch {
      // The original error is the one to report; the next app open retries through `sync`.
    }
  }

  async function applyNow(input: Parameters<ReminderRepository["apply"]>[0]) {
    const profile = current();
    if (!profile) throw new Error("PROFILE_NOT_FOUND");
    const enabled = input.enabled ?? profile.reminderEnabled;
    const hour = input.hour ?? reminderHourOrDefault(profile.reminderHour);
    if (input.enabled && !(await scheduler.ensurePermission())) return "denied" as const;
    if (enabled) await scheduler.schedule(hour);
    else await scheduler.cancel();
    realm.write(() => {
      profile.reminderEnabled = enabled;
      profile.reminderHour = hour;
    });
    return "saved" as const;
  }

  async function syncNow() {
    const profile = current();
    if (!profile?.reminderEnabled) {
      await scheduler.cancel();
      return false;
    }
    if (await scheduler.hasPermission()) {
      await scheduler.schedule(reminderHourOrDefault(profile.reminderHour));
      return false;
    }
    await scheduler.cancel();
    realm.write(() => {
      profile.reminderEnabled = false;
    });
    return true;
  }

  return {
    apply: (input) =>
      enqueue(() =>
        applyNow(input).catch(async (error: unknown) => {
          await reconcile();
          throw error;
        }),
      ),
    sync: () => enqueue(syncNow),
  };
}

export function useReminderRepository(): ReminderRepository {
  const realm = useRealm();
  return createReminderRepository(realm);
}

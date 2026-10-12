import { act, waitFor } from "@testing-library/react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { useProfile } from "@/features/profile";
import { resetFakeScheduler } from "@/testing/notifications";
import { renderHookWithProviders } from "@/testing/providers";
import { openTestRealm } from "@/testing/realm";

import { useSyncReminder, useUpdateReminder } from "..";

jest.mock("@/lib/notifications", () => jest.requireActual("@/testing/notifications").notificationsModuleMock);

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

describe("reminder hooks", () => {
  let realm: Realm;
  let fake: ReturnType<typeof resetFakeScheduler>;

  beforeEach(() => {
    realm = openTestRealm(models);
    realm.write(() => {
      realm.create(Profile, { name: "Ana", createdAt: new Date(2026, 0, 1) });
    });
    fake = resetFakeScheduler({ permission: "granted" });
  });

  afterEach(() => {
    realm.close();
  });

  function renderReminderHooks() {
    return renderHookWithProviders(
      () => ({ profile: useProfile(), update: useUpdateReminder(), sync: useSyncReminder() }),
      realm,
    );
  }

  it("REM-17 update resolves a plain outcome and invalidates the profile so reads refresh", async () => {
    const { result, unmount } = await renderReminderHooks();
    await waitFor(() => expect(result.current.profile.data?.reminderEnabled).toBe(false));

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.update.mutateAsync({ enabled: true });
    });

    expect(outcome).toBe("saved");
    await waitFor(() => expect(result.current.profile.data?.reminderEnabled).toBe(true));
    expect(fake.state.scheduledHour).toBe(19);
    await unmount();
  });

  it("REM-17 update propagates the scheduler error", async () => {
    const { result, unmount } = await renderReminderHooks();
    fake.failNext("schedule");

    await act(async () => {
      await expect(result.current.update.mutateAsync({ enabled: true })).rejects.toThrow("schedule");
    });

    expect(result.current.update.isError).toBe(true);
    await unmount();
  });

  it("REM-11 sync reschedules without touching the cached profile when nothing changed", async () => {
    realm.write(() => {
      realm.objects(Profile)[0].reminderEnabled = true;
    });
    const { result, queryClient, unmount } = await renderReminderHooks();
    await waitFor(() => expect(result.current.profile.isSuccess).toBe(true));
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");

    await act(async () => {
      await result.current.sync.mutateAsync();
    });

    expect(fake.state.scheduledHour).toBe(19);
    expect(invalidate).not.toHaveBeenCalled();
    await unmount();
  });

  it("REM-12 sync invalidates the profile when it switched the reminder off", async () => {
    fake.setPermission("blocked");
    realm.write(() => {
      realm.objects(Profile)[0].reminderEnabled = true;
    });
    const { result, queryClient, unmount } = await renderReminderHooks();
    await waitFor(() => expect(result.current.profile.data?.reminderEnabled).toBe(true));
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");

    await act(async () => {
      await result.current.sync.mutateAsync();
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["profile"] });
    await waitFor(() => expect(result.current.profile.data?.reminderEnabled).toBe(false));
    await unmount();
  });
});

import { act, waitFor } from "@testing-library/react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import {
  useCreateProfile,
  useProfile,
  useReviewsToday,
  useUpdateProfile,
} from "@/features/profile";
import { renderHookWithProviders } from "@/testing/providers";
import { openTestRealm } from "@/testing/realm";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

describe("profile hooks", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(models);
  });

  afterEach(() => {
    realm.close();
  });

  function renderProfileHooks() {
    return renderHookWithProviders(
      () => ({
        profile: useProfile(),
        today: useReviewsToday(),
        create: useCreateProfile(),
        update: useUpdateProfile(),
      }),
      realm,
    );
  }

  it("CONTRACT useProfile returns a plain object, not a Realm.Object", async () => {
    realm.write(() => {
      realm.create(Profile, { name: "Ana", createdAt: new Date() });
    });
    const { result, unmount } = await renderProfileHooks();
    await waitFor(() => expect(result.current.profile.isSuccess).toBe(true));

    const profile = result.current.profile.data!;
    expect(profile).not.toBeInstanceOf(Realm.Object);
    expect(profile.id).toMatch(/^[0-9a-f]{24}$/);
    expect(profile.name).toBe("Ana");
    await unmount();
  });

  it("CONTRACT mutations invalidate [profile] so mounted reads refresh", async () => {
    const { result, unmount } = await renderProfileHooks();
    await waitFor(() => expect(result.current.profile.data).toBeNull());

    await act(async () => {
      await result.current.create.mutateAsync("Ana");
    });
    await waitFor(() => expect(result.current.profile.data?.name).toBe("Ana"));

    await act(async () => {
      await result.current.update.mutateAsync({ name: "Bia", dailyGoal: 25 });
    });
    await waitFor(() => expect(result.current.profile.data).toMatchObject({ name: "Bia", dailyGoal: 25 }));
    expect(result.current.today.data).toBe(0);
    await unmount();
  });
});

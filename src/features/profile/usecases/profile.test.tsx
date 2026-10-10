import { act, waitFor } from "@testing-library/react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import {
  useCreateProfile,
  useProfile,
  useReviewsToday,
  useStats,
  useUpdateProfile,
} from "@/features/profile";
import { useAnswerCard } from "@/features/study";
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

  it("REGRESSION useStats returns plain data and answer invalidates profileKeys.stats", async () => {
    const cardId = realm.write(() => {
      const card = realm.create(Card, { front: "f", back: "b", dueDate: new Date(), createdAt: new Date() });
      realm.create(Deck, { name: "D", createdAt: new Date(), cards: [card] });
      return card._id.toHexString();
    });
    const { result, unmount } = await renderHookWithProviders(
      () => ({ stats: useStats(), answer: useAnswerCard() }),
      realm,
    );
    await waitFor(() => expect(result.current.stats.isSuccess).toBe(true));
    expect(result.current.stats.data).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      accuracy7: null,
      accuracy30: null,
      week: [0, 0, 0, 0, 0, 0, 0],
      stages: { new: 1, learning: 0, mature: 0 },
    });

    await act(async () => {
      await result.current.answer.mutateAsync({ cardId, grade: 2 });
    });
    await waitFor(() => expect(result.current.stats.data?.currentStreak).toBe(1));
    expect(result.current.stats.data).toMatchObject({ accuracy7: 100, stages: { new: 0, learning: 1, mature: 0 } });
    expect(result.current.stats.data!.week[6]).toBe(1);
    await unmount();
  });
});

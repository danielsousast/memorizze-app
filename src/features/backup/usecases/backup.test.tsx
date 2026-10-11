import { waitFor } from "@testing-library/react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { useBackupCounts, useLastBackup } from "@/features/backup";
import { renderHookWithProviders } from "@/testing/providers";
import { openTestRealm } from "@/testing/realm";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

describe("backup hooks", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(models);
  });

  afterEach(() => {
    realm.close();
  });

  it("CONTRACT useBackupCounts returns plain counts", async () => {
    realm.write(() => {
      realm.create(Deck, { name: "D", createdAt: new Date(), cards: [] });
    });
    const { result, unmount } = await renderHookWithProviders(() => useBackupCounts(), realm);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ decks: 1, cards: 0, reviewLogs: 0 });
    await unmount();
  });

  it("CONTRACT useLastBackup returns the two backup dates as Date or null", async () => {
    const last = new Date("2026-10-02T12:00:00.000Z");
    realm.write(() => {
      realm.create(Profile, { name: "Ana", createdAt: new Date(), lastBackupAt: last });
    });
    const { result, unmount } = await renderHookWithProviders(() => useLastBackup(), realm);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ last, previous: null });
    await unmount();
  });
});

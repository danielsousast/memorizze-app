import { waitFor } from "@testing-library/react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { renderHookWithProviders } from "@/testing/providers";
import { openTestRealm } from "@/testing/realm";

import { useDueTomorrow } from "./use-due-tomorrow";
import { useStudyQueue } from "./use-study-queue";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

describe("study hooks", () => {
  let realm: Realm;
  let deckId: string;

  beforeEach(() => {
    realm = openTestRealm(models);
    deckId = createDeckRepository(realm).create({ name: "Inglês" }).id;
    createCardRepository(realm).create(deckId, { front: "a", back: "b" });
  });

  afterEach(() => {
    realm.close();
  });

  it("QUE-01 reopens with a fresh queue after unmount (gcTime 0)", async () => {
    const first = await renderHookWithProviders(() => useStudyQueue(deckId), realm);
    await waitFor(() => expect(first.result.current.data).toHaveLength(1));
    await first.unmount();

    createCardRepository(realm).create(deckId, { front: "c", back: "d" });

    const second = await renderHookWithProviders(() => useStudyQueue(deckId), realm);
    await waitFor(() => expect(second.result.current.data).toHaveLength(2));
    await second.unmount();
  });

  it("SUM-06 useDueTomorrow returns the count for the scope", async () => {
    const rendered = await renderHookWithProviders(() => useDueTomorrow(deckId), realm);
    await waitFor(() => expect(rendered.result.current.data).toBe(1));
    await rendered.unmount();
  });
});

import { act, waitFor } from "@testing-library/react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { useDecks } from "@/features/decks";
import { renderHookWithProviders } from "@/testing/providers";
import { openTestRealm } from "@/testing/realm";

import { useAnswerCard } from "./use-answer-card";
import { useDueTomorrow } from "./use-due-tomorrow";
import { useStreak } from "./use-streak";
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
  it("ANS-07 answering Bom lowers the deck dueCount", async () => {
    const rendered = await renderHookWithProviders(
      () => ({ decks: useDecks(), answer: useAnswerCard() }),
      realm,
    );
    await waitFor(() => expect(rendered.result.current.decks.data?.[0].dueCount).toBe(1));
    const cardId = realm.objects(Card)[0]._id.toHexString();

    await act(async () => {
      await rendered.result.current.answer.mutateAsync({ cardId, grade: 2 });
    });

    await waitFor(() => expect(rendered.result.current.decks.data?.[0].dueCount).toBe(0));
    await rendered.unmount();
  });

  it("SUM-04 useStreak reads the streak from the logs", async () => {
    const cardId = realm.objects(Card)[0]._id.toHexString();
    const rendered = await renderHookWithProviders(
      () => ({ streak: useStreak(), answer: useAnswerCard() }),
      realm,
    );
    await waitFor(() => expect(rendered.result.current.streak.data).toBe(0));

    await act(async () => {
      await rendered.result.current.answer.mutateAsync({ cardId, grade: 2 });
    });

    await waitFor(() => expect(rendered.result.current.streak.data).toBe(1));
    await rendered.unmount();
  });

  it("REGRESSION answering invalidates profile, cards, decks and study", async () => {
    const cardId = realm.objects(Card)[0]._id.toHexString();
    const rendered = await renderHookWithProviders(() => useAnswerCard(), realm);
    const spy = jest.spyOn(rendered.queryClient, "invalidateQueries");

    await act(async () => {
      await rendered.result.current.mutateAsync({ cardId, grade: 2 });
    });

    const keys = spy.mock.calls.map(([filters]) => filters?.queryKey?.[0]);
    expect(keys).toEqual(expect.arrayContaining(["cards", "decks", "study", "profile"]));
    await rendered.unmount();
  });
});

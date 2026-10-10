import { act, waitFor } from "@testing-library/react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import {
  useCard,
  useCards,
  useCreateCard,
  useDeleteCard,
  useUpdateCard,
} from "@/features/cards";
import { createCardRepository } from "@/features/cards/repository";
import { useDecks, useDeleteDeck } from "@/features/decks";
import { createDeckRepository } from "@/features/decks/repository";
import { renderHookWithProviders } from "@/testing/providers";
import { openTestRealm } from "@/testing/realm";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

describe("card hooks", () => {
  let realm: Realm;
  let deckId: string;
  let cardId: string;

  beforeEach(() => {
    realm = openTestRealm(models);
    deckId = createDeckRepository(realm).create({ name: "Inglês" }).id;
    cardId = createCardRepository(realm).create(deckId, { front: "a", back: "b" }).id;
  });

  afterEach(() => {
    realm.close();
  });

  function renderCardHooks() {
    return renderHookWithProviders(
      () => ({
        decks: useDecks(),
        list: useCards(deckId),
        item: useCard(cardId),
        create: useCreateCard(),
        update: useUpdateCard(),
        remove: useDeleteCard(),
        removeDeck: useDeleteDeck(),
      }),
      realm,
    );
  }

  async function renderReady() {
    const rendered = await renderCardHooks();
    await waitFor(() => {
      const { decks, list, item } = rendered.result.current;
      expect([decks, list, item].every((q) => q.isSuccess)).toBe(true);
    });
    return rendered;
  }

  it("HK-01 reads and writes cards against the realm", async () => {
    const { result, unmount } = await renderReady();
    expect(result.current.list.data?.map((c) => c.id)).toEqual([cardId]);
    expect(result.current.item.data).toMatchObject({ id: cardId, front: "a" });

    let created;
    await act(async () => {
      created = await result.current.create.mutateAsync({
        deckId,
        input: { front: "c", back: "d" },
      });
    });
    expect(created).toMatchObject({ front: "c", back: "d" });

    let updated;
    await act(async () => {
      updated = await result.current.update.mutateAsync({
        id: cardId,
        input: { front: "z" },
      });
    });
    expect(updated).toMatchObject({ id: cardId, front: "z", back: "b" });

    await act(async () => {
      await result.current.remove.mutateAsync(cardId);
    });
    expect(realm.objects(Card).map((c) => c.front)).toEqual(["c"]);
    await unmount();
  });

  it("HK-02 updates the card list and the deck's card count on create and delete", async () => {
    const { result, unmount } = await renderReady();
    expect(result.current.decks.data?.[0].cardCount).toBe(1);

    let createdId = "";
    await act(async () => {
      createdId = (
        await result.current.create.mutateAsync({ deckId, input: { front: "c", back: "d" } })
      ).id;
    });
    await waitFor(() => expect(result.current.decks.data?.[0].cardCount).toBe(2));
    expect(result.current.list.data?.map((c) => c.id)).toEqual([cardId, createdId]);

    await act(async () => {
      await result.current.remove.mutateAsync(createdId);
    });
    await waitFor(() => expect(result.current.decks.data?.[0].cardCount).toBe(1));
    expect(result.current.list.data?.map((c) => c.id)).toEqual([cardId]);
    await unmount();
  });

  it("HK-02 shows an edited card in the list and the item", async () => {
    const { result, unmount } = await renderReady();

    await act(async () => {
      await result.current.update.mutateAsync({ id: cardId, input: { front: "novo" } });
    });

    await waitFor(() => expect(result.current.item.data?.front).toBe("novo"));
    expect(result.current.list.data?.[0].front).toBe("novo");
    await unmount();
  });

  it("HK-02 clears the mounted cards when their deck is deleted", async () => {
    const { result, unmount } = await renderReady();

    await act(async () => {
      await result.current.removeDeck.mutateAsync(deckId);
    });

    await waitFor(() => expect(result.current.item.data).toBeNull());
    expect(result.current.list.data).toEqual([]);
    await unmount();
  });

  it("HK-05 returns plain cards that stay readable after deletion", async () => {
    const { result, unmount } = await renderReady();
    const kept = result.current.item.data!;

    expect(kept).not.toBeInstanceOf(Realm.Object);
    await act(async () => {
      await result.current.remove.mutateAsync(cardId);
    });

    await waitFor(() => expect(result.current.item.data).toBeNull());
    expect(kept.front).toBe("a");
    await unmount();
  });

  it("HK-04 exposes the error code of a rejected card", async () => {
    const { result, unmount } = await renderReady();

    await act(async () => {
      await result.current.create
        .mutateAsync({ deckId, input: { front: "", back: "b" } })
        .catch(() => {});
    });

    await waitFor(() => expect(result.current.create.isError).toBe(true));
    expect(result.current.create.error?.code).toBe("CARD_FRONT_EMPTY");
    await unmount();
  });
});

import { onlineManager } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import {
  useCreateDeck,
  useDeck,
  useDecks,
  useDeleteDeck,
  useUpdateDeck,
} from "@/features/decks";
import { createDeckRepository } from "@/features/decks/repository";
import { renderHookWithProviders } from "@/testing/providers";
import { openTestRealm } from "@/testing/realm";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

describe("deck hooks", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(models);
  });

  afterEach(() => {
    onlineManager.setOnline(true);
    realm.close();
  });

  function renderDeckHooks(id: string) {
    return renderHookWithProviders(
      () => ({
        list: useDecks(),
        item: useDeck(id),
        create: useCreateDeck(),
        update: useUpdateDeck(),
        remove: useDeleteDeck(),
      }),
      realm,
    );
  }

  it("HK-01 reads and writes decks against the realm", async () => {
    const seeded = createDeckRepository(realm).create({ name: "Inglês" });
    const { result, unmount } = await renderDeckHooks(seeded.id);
    await waitFor(() => expect(result.current.item.isSuccess).toBe(true));
    expect(result.current.list.data).toEqual([seeded]);
    expect(result.current.item.data).toEqual(seeded);

    let created;
    await act(async () => {
      created = await result.current.create.mutateAsync({ name: "Física" });
    });
    expect(created).toMatchObject({ name: "Física", cardCount: 0 });

    let updated;
    await act(async () => {
      updated = await result.current.update.mutateAsync({
        id: seeded.id,
        input: { name: "Espanhol" },
      });
    });
    expect(updated).toMatchObject({ id: seeded.id, name: "Espanhol" });

    await act(async () => {
      await result.current.remove.mutateAsync(seeded.id);
    });
    expect(realm.objects(Deck).map((d) => d.name)).toEqual(["Física"]);
    await unmount();
  });

  it("HK-05 returns plain objects that stay readable after deletion", async () => {
    const seeded = createDeckRepository(realm).create({ name: "Inglês" });
    const { result, unmount } = await renderDeckHooks(seeded.id);
    await waitFor(() => expect(result.current.item.isSuccess).toBe(true));
    const kept = result.current.item.data!;

    expect(kept).not.toBeInstanceOf(Realm.Object);
    await act(async () => {
      await result.current.remove.mutateAsync(seeded.id);
    });

    expect(kept.name).toBe("Inglês");
    await unmount();
  });

  it("HK-02 refreshes the mounted list and item after each write", async () => {
    const seeded = createDeckRepository(realm).create({ name: "Inglês" });
    const { result, unmount } = await renderDeckHooks(seeded.id);
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    await act(async () => {
      await result.current.create.mutateAsync({ name: "Física" });
    });
    await waitFor(() =>
      expect(result.current.list.data?.map((d) => d.name)).toEqual(["Inglês", "Física"]),
    );

    await act(async () => {
      await result.current.update.mutateAsync({ id: seeded.id, input: { name: "Arte" } });
    });
    await waitFor(() => expect(result.current.item.data?.name).toBe("Arte"));
    expect(result.current.list.data?.map((d) => d.name)).toEqual(["Arte", "Física"]);

    await act(async () => {
      await result.current.remove.mutateAsync(seeded.id);
    });
    await waitFor(() => expect(result.current.item.data).toBeNull());
    expect(result.current.list.data?.map((d) => d.name)).toEqual(["Física"]);
    await unmount();
  });

  it("HK-03 runs reads and writes while offline", async () => {
    onlineManager.setOnline(false);
    const { result, unmount } = await renderDeckHooks("missing");

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    expect(result.current.list.fetchStatus).not.toBe("paused");
    await act(async () => {
      await result.current.create.mutateAsync({ name: "Inglês" });
    });
    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
    await unmount();
  });

  it("HK-04/HK-06 exposes the error code and keeps the mounted data", async () => {
    createDeckRepository(realm).create({ name: "Inglês" });
    const { result, unmount } = await renderDeckHooks("missing");
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    const before = result.current.list.data;

    await act(async () => {
      await result.current.create.mutateAsync({ name: "" }).catch(() => {});
    });

    await waitFor(() => expect(result.current.create.isError).toBe(true));
    expect(result.current.create.error?.code).toBe("DECK_NAME_EMPTY");
    expect(result.current.list.data).toBe(before);
    await unmount();
  });
});

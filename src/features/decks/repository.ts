import { useRealm } from "@realm/react";
import Realm, { BSON } from "realm";

import { Deck as DeckObject } from "@/db";
import { AppError } from "@/domain/errors";

import { toDeck } from "./adapters";
import type { DeckErrorCode, DeckInput, DeckRepository } from "./interfaces";

export function createDeckRepository(
  realm: Realm,
  now = () => new Date(),
): DeckRepository {
  function find(id: string) {
    if (!BSON.ObjectId.isValid(id)) return null;
    return realm.objectForPrimaryKey(DeckObject, new BSON.ObjectId(id));
  }

  function existing(id: string) {
    const deck = find(id);
    if (!deck) throw new AppError<DeckErrorCode>("DECK_NOT_FOUND");
    return deck;
  }

  function validName(name: string, ownId?: BSON.ObjectId): string {
    const trimmed = name.trim();
    if (!trimmed) throw new AppError<DeckErrorCode>("DECK_NAME_EMPTY");
    const key = trimmed.toLocaleLowerCase();
    const taken = realm
      .objects(DeckObject)
      .some(
        (deck) =>
          !(ownId && deck._id.equals(ownId)) &&
          deck.name.trim().toLocaleLowerCase() === key,
      );
    if (taken) throw new AppError<DeckErrorCode>("DECK_NAME_DUPLICATE");
    return trimmed;
  }

  return {
    list() {
      const at = now();
      return realm
        .objects(DeckObject)
        .sorted("createdAt")
        .map((deck) => toDeck(deck, at));
    },

    getById(id) {
      const deck = find(id);
      return deck ? toDeck(deck, now()) : null;
    },

    create(input: DeckInput) {
      const name = validName(input.name);
      const createdAt = now();
      const deck = realm.write(() =>
        realm.create(DeckObject, {
          name,
          description: input.description,
          createdAt,
          cards: [],
        }),
      );
      return toDeck(deck, createdAt);
    },

    update(id, input) {
      const deck = existing(id);
      const name = validName(input.name, deck._id);
      realm.write(() => {
        deck.name = name;
        // Omitted keeps the current description; "" removes it (A-01).
        if (input.description !== undefined) {
          deck.description = input.description || undefined;
        }
      });
      return toDeck(deck, now());
    },

    remove(id) {
      const deck = existing(id);
      realm.write(() => {
        realm.delete(deck.cards);
        realm.delete(deck);
      });
    },

    // Scheduling only: content and ReviewLog stay (RST-01).
    resetProgress(id) {
      const deck = existing(id);
      const at = now();
      realm.write(() => {
        for (const card of deck.cards) {
          card.easeFactor = 2.5;
          card.intervalDays = 0;
          card.repetitions = 0;
          card.lapses = 0;
          card.dueDate = at;
        }
      });
    },
  };
}

export function useDeckRepository(): DeckRepository {
  const realm = useRealm();
  return createDeckRepository(realm);
}

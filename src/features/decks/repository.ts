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

  function validName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) throw new AppError<DeckErrorCode>("DECK_NAME_EMPTY");
    const key = trimmed.toLocaleLowerCase();
    const taken = realm
      .objects(DeckObject)
      .some((deck) => deck.name.trim().toLocaleLowerCase() === key);
    if (taken) throw new AppError<DeckErrorCode>("DECK_NAME_DUPLICATE");
    return trimmed;
  }

  return {
    list() {
      return realm.objects(DeckObject).sorted("createdAt").map(toDeck);
    },

    getById(id) {
      const deck = find(id);
      return deck ? toDeck(deck) : null;
    },

    create(input: DeckInput) {
      const name = validName(input.name);
      const deck = realm.write(() =>
        realm.create(DeckObject, {
          name,
          description: input.description,
          createdAt: now(),
          cards: [],
        }),
      );
      return toDeck(deck);
    },
  };
}

export function useDeckRepository(): DeckRepository {
  const realm = useRealm();
  return createDeckRepository(realm);
}

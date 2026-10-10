import { useRealm } from "@realm/react";
import Realm, { BSON } from "realm";

import { Card as CardObject, Deck as DeckObject } from "@/db";
import { AppError } from "@/domain/errors";

import { toCard } from "./adapters";
import type { CardErrorCode, CardRepository } from "./interfaces";

export function createCardRepository(
  realm: Realm,
  now = () => new Date(),
): CardRepository {
  function findDeck(id: string) {
    if (!BSON.ObjectId.isValid(id)) return null;
    return realm.objectForPrimaryKey(DeckObject, new BSON.ObjectId(id));
  }

  function findCard(id: string) {
    if (!BSON.ObjectId.isValid(id)) return null;
    return realm.objectForPrimaryKey(CardObject, new BSON.ObjectId(id));
  }

  function existingCard(id: string) {
    const card = findCard(id);
    if (!card) throw new AppError<CardErrorCode>("CARD_NOT_FOUND");
    return card;
  }

  function nonEmpty(text: string, code: CardErrorCode): string {
    const trimmed = text.trim();
    if (!trimmed) throw new AppError(code);
    return trimmed;
  }

  return {
    listByDeck(deckId) {
      return findDeck(deckId)?.cards.map(toCard) ?? [];
    },

    getById(id) {
      const card = findCard(id);
      return card ? toCard(card) : null;
    },

    create(deckId, input) {
      const front = nonEmpty(input.front, "CARD_FRONT_EMPTY");
      const back = nonEmpty(input.back, "CARD_BACK_EMPTY");
      const deck = findDeck(deckId);
      if (!deck) throw new AppError<CardErrorCode>("DECK_NOT_FOUND");
      const t = now();
      const card = realm.write(() => {
        const created = realm.create(CardObject, {
          front,
          back,
          createdAt: t,
          dueDate: t,
        });
        deck.cards.push(created);
        return created;
      });
      return toCard(card);
    },

    update(id, input) {
      const front =
        input.front === undefined ? undefined : nonEmpty(input.front, "CARD_FRONT_EMPTY");
      const back =
        input.back === undefined ? undefined : nonEmpty(input.back, "CARD_BACK_EMPTY");
      const card = existingCard(id);
      realm.write(() => {
        if (front !== undefined) card.front = front;
        if (back !== undefined) card.back = back;
      });
      return toCard(card);
    },

    remove(id) {
      const card = existingCard(id);
      realm.write(() => realm.delete(card));
    },
  };
}

export function useCardRepository(): CardRepository {
  const realm = useRealm();
  return createCardRepository(realm);
}

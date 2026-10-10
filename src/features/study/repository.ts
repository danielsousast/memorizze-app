import { useRealm } from "@realm/react";
import Realm, { BSON } from "realm";

import { Card as CardObject, Deck as DeckObject } from "@/db";
import { addLocalDays, endOfLocalDay } from "@/domain/dates";

import { toStudyCard } from "./adapters";
import type { StudyRepository } from "./interfaces";

export function createStudyRepository(
  realm: Realm,
  now = () => new Date(),
): StudyRepository {
  // null = deck scope requested but the id is invalid or missing.
  function scopedCards(deckId: string | undefined, limit: Date) {
    const due = realm.objects(CardObject).filtered("dueDate <= $0", limit);
    if (deckId === undefined) return due;
    if (!BSON.ObjectId.isValid(deckId)) return null;
    const id = new BSON.ObjectId(deckId);
    if (!realm.objectForPrimaryKey(DeckObject, id)) return null;
    return due.filtered("@links.Deck.cards._id == $0", id);
  }

  return {
    queue(deckId) {
      const cards = scopedCards(deckId, endOfLocalDay(now()));
      if (!cards) return null;
      return cards
        .sorted([
          ["dueDate", false],
          ["createdAt", false],
        ])
        .map((card) => {
          const deck = card.linkingObjects(DeckObject, "cards")[0];
          return toStudyCard(card, deck);
        });
    },

    countDueTomorrow(deckId) {
      const cards = scopedCards(deckId, endOfLocalDay(addLocalDays(now(), 1)));
      return cards?.length ?? 0;
    },
  };
}

export function useStudyRepository(): StudyRepository {
  const realm = useRealm();
  return createStudyRepository(realm);
}

import { useRealm } from "@realm/react";
import Realm, { BSON } from "realm";

import { Card as CardObject, Deck as DeckObject, Profile, ReviewLog } from "@/db";
import { addLocalDays, endOfLocalDay, startOfLocalDay } from "@/domain/dates";
import { AppError } from "@/domain/errors";
import { selectQueue } from "@/domain/new-cards";
import { schedule } from "@/domain/schedule";
import { currentStreak } from "@/domain/streak";

import { toStudyCard } from "./adapters";
import type { StudyErrorCode, StudyRepository } from "./interfaces";

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

  // Cards whose first review ever happened today (NEW-03).
  function introducedToday(at: Date): Set<string> {
    const start = startOfLocalDay(at);
    const end = startOfLocalDay(addLocalDays(at, 1));
    const ids = new Map<string, BSON.ObjectId>();
    for (const log of realm
      .objects(ReviewLog)
      .filtered("reviewedAt >= $0 AND reviewedAt < $1", start, end)) {
      ids.set(log.cardId.toHexString(), log.cardId);
    }
    return new Set(
      [...ids]
        .filter(
          ([, cardId]) =>
            realm
              .objects(ReviewLog)
              .filtered("cardId == $0 AND reviewedAt < $1", cardId, start)
              .length === 0,
        )
        .map(([hex]) => hex),
    );
  }

  return {
    queue(deckId) {
      const at = now();
      const cards = scopedCards(deckId, endOfLocalDay(at));
      if (!cards) return null;
      const queue = cards
        .sorted([
          ["dueDate", false],
          ["createdAt", false],
        ])
        .map((card) => {
          const deck = card.linkingObjects(DeckObject, "cards")[0];
          return toStudyCard(card, deck);
        });
      const profile = realm.objects(Profile).sorted("createdAt")[0];
      if (!profile) return queue;
      const limit =
        profile.newCardsPerDay === 0 ? null : profile.newCardsPerDay;
      return selectQueue(
        queue,
        limit,
        limit === null ? new Set() : introducedToday(at),
      );
    },

    countDueTomorrow(deckId) {
      const cards = scopedCards(deckId, endOfLocalDay(addLocalDays(now(), 1)));
      return cards?.length ?? 0;
    },

    answer(cardId, grade) {
      const card = BSON.ObjectId.isValid(cardId)
        ? realm.objectForPrimaryKey(CardObject, new BSON.ObjectId(cardId))
        : null;
      const deck = card?.linkingObjects(DeckObject, "cards")[0];
      if (!card || !deck) throw new AppError<StudyErrorCode>("CARD_NOT_FOUND");
      const reviewedAt = now();
      realm.write(() => {
        Object.assign(card, schedule(card, grade, reviewedAt));
        realm.create(ReviewLog, {
          cardId: card._id,
          deckId: deck._id,
          grade,
          reviewedAt,
        });
      });
      return toStudyCard(card, deck);
    },

    currentStreak() {
      const dates = realm.objects(ReviewLog).map((log) => log.reviewedAt);
      return currentStreak(dates, now());
    },
  };
}

export function useStudyRepository(): StudyRepository {
  const realm = useRealm();
  return createStudyRepository(realm);
}

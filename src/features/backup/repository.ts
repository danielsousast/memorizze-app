import { useRealm } from "@realm/react";
import Realm, { BSON } from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import type { BackupFile, BackupSnapshot } from "@/domain/backup";
import { AppError } from "@/domain/errors";

import { toBackupCard, toBackupDeck, toBackupProfile, toBackupReviewLog } from "./adapters";
import type { BackupErrorCode, BackupRepository } from "./interfaces";

function fail(code: BackupErrorCode): never {
  throw new AppError<BackupErrorCode>(code);
}

export function createBackupRepository(realm: Realm): BackupRepository {
  // The oldest profile wins when legacy data holds more than one (PRF-06).
  function oldest() {
    return realm.objects(Profile).sorted("createdAt")[0] ?? null;
  }

  return {
    counts() {
      return {
        decks: realm.objects(Deck).length,
        cards: realm.objects(Card).length,
        reviewLogs: realm.objects(ReviewLog).length,
      };
    },

    lastBackup() {
      const profile = oldest();
      return {
        last: profile?.lastBackupAt ?? null,
        previous: profile?.previousBackupAt ?? null,
      };
    },

    snapshot(): BackupSnapshot {
      const profile = oldest();
      if (!profile) return fail("BACKUP_EXPORT_FAILED");
      const decks = realm.objects(Deck).sorted("_id");
      const cards = decks.flatMap((deck) =>
        deck.cards.map((card) => toBackupCard(card, deck._id.toHexString())),
      );
      return {
        profile: toBackupProfile(profile),
        decks: decks.map(toBackupDeck),
        cards: cards.sort((a, b) => (a.id < b.id ? -1 : 1)),
        reviewLogs: realm.objects(ReviewLog).sorted("_id").map(toBackupReviewLog),
      };
    },

    markBackedUp(at: Date) {
      const profile = oldest();
      if (!profile) return;
      realm.write(() => {
        profile.previousBackupAt = profile.lastBackupAt;
        profile.lastBackupAt = at;
      });
    },

    // One transaction: any exception rolls everything back (INV-01, BKP-18). Each model
    // is cleared on its own, so a future model is never erased by accident.
    restore(backup: BackupFile) {
      try {
        realm.write(() => {
          realm.delete(realm.objects(ReviewLog));
          realm.delete(realm.objects(Card));
          realm.delete(realm.objects(Deck));
          realm.delete(realm.objects(Profile));

          const { profile } = backup;
          realm.create(Profile, {
            _id: new BSON.ObjectId(profile.id),
            name: profile.name,
            dailyGoal: profile.dailyGoal,
            createdAt: new Date(profile.createdAt),
            studyTutorialSeen: profile.studyTutorialSeen,
            themePreference: profile.themePreference,
            newCardsPerDay: profile.newCardsPerDay,
          });

          const decks = new Map<string, Deck>();
          for (const deck of backup.decks) {
            decks.set(
              deck.id,
              realm.create(Deck, {
                _id: new BSON.ObjectId(deck.id),
                name: deck.name,
                description: deck.description ?? undefined,
                createdAt: new Date(deck.createdAt),
                cards: [],
              }),
            );
          }
          for (const card of backup.cards) {
            const deck = decks.get(card.deckId);
            if (!deck) throw new Error(`card ${card.id} has no deck`);
            deck.cards.push(
              realm.create(Card, {
                _id: new BSON.ObjectId(card.id),
                front: card.front,
                back: card.back,
                easeFactor: card.easeFactor,
                intervalDays: card.intervalDays,
                repetitions: card.repetitions,
                lapses: card.lapses,
                dueDate: new Date(card.dueDate),
                createdAt: new Date(card.createdAt),
              }),
            );
          }
          for (const log of backup.reviewLogs) {
            realm.create(ReviewLog, {
              _id: new BSON.ObjectId(log.id),
              cardId: new BSON.ObjectId(log.cardId),
              deckId: new BSON.ObjectId(log.deckId),
              grade: log.grade,
              reviewedAt: new Date(log.reviewedAt),
            });
          }
        });
      } catch {
        fail("BACKUP_RESTORE_FAILED");
      }
    },
  };
}

export function useBackupRepository(): BackupRepository {
  const realm = useRealm();
  return createBackupRepository(realm);
}

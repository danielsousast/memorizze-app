import type { Card, Deck, Profile, ReviewLog } from "@/db";
import type { BackupCard, BackupDeck, BackupProfile, BackupReviewLog } from "@/domain/backup";
import { parseTheme } from "@/domain/preferences";

export function toBackupProfile(obj: Profile): BackupProfile {
  return {
    id: obj._id.toHexString(),
    name: obj.name,
    dailyGoal: obj.dailyGoal,
    createdAt: obj.createdAt.toISOString(),
    studyTutorialSeen: obj.studyTutorialSeen,
    themePreference: parseTheme(obj.themePreference),
    newCardsPerDay: obj.newCardsPerDay,
  };
}

export function toBackupDeck(obj: Deck): BackupDeck {
  return {
    id: obj._id.toHexString(),
    name: obj.name,
    description: obj.description ?? null,
    createdAt: obj.createdAt.toISOString(),
  };
}

/** The card's deck comes from the deck that lists it (`Deck.cards`), not from the card itself. */
export function toBackupCard(obj: Card, deckId: string): BackupCard {
  return {
    id: obj._id.toHexString(),
    deckId,
    front: obj.front,
    back: obj.back,
    easeFactor: obj.easeFactor,
    intervalDays: obj.intervalDays,
    repetitions: obj.repetitions,
    lapses: obj.lapses,
    dueDate: obj.dueDate.toISOString(),
    createdAt: obj.createdAt.toISOString(),
  };
}

export function toBackupReviewLog(obj: ReviewLog): BackupReviewLog {
  return {
    id: obj._id.toHexString(),
    cardId: obj.cardId.toHexString(),
    deckId: obj.deckId.toHexString(),
    grade: obj.grade,
    reviewedAt: obj.reviewedAt.toISOString(),
  };
}

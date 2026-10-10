import type { Grade } from "@/domain/schedule";
import type { Card } from "@/features/cards";

export type StudyCard = Card & { deckId: string; deckName: string };

export type StudyErrorCode = "CARD_NOT_FOUND";

export type StudyRepository = {
  /** `null` = deck not found (QUE-04); without `deckId`, every deck. */
  queue(deckId?: string): StudyCard[] | null;
  countDueTomorrow(deckId?: string): number;
  /** One write: reschedules the card and creates its ReviewLog. */
  answer(cardId: string, grade: Grade): StudyCard;
  currentStreak(): number;
};

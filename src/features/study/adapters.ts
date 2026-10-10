import type { Card as CardObject, Deck as DeckObject } from "@/db";
import { toCard } from "@/features/cards/adapters";

import type { StudyCard } from "./interfaces";

export function toStudyCard(card: CardObject, deck: DeckObject): StudyCard {
  return {
    ...toCard(card),
    deckId: deck._id.toHexString(),
    deckName: deck.name,
  };
}

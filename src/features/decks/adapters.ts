import type { Deck as DeckObject } from "@/db";
import { isDue } from "@/domain/dates";

import type { Deck } from "./interfaces";

export function toDeck(obj: DeckObject, now: Date): Deck {
  return {
    id: obj._id.toHexString(),
    name: obj.name,
    description: obj.description ?? undefined,
    createdAt: obj.createdAt,
    cardCount: obj.cards.length,
    dueCount: obj.cards.filter((card) => isDue(card.dueDate, now)).length,
  };
}

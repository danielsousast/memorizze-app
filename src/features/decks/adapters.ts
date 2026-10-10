import type { Deck as DeckObject } from "@/db";

import type { Deck } from "./interfaces";

export function toDeck(obj: DeckObject): Deck {
  return {
    id: obj._id.toHexString(),
    name: obj.name,
    description: obj.description ?? undefined,
    createdAt: obj.createdAt,
    cardCount: obj.cards.length,
  };
}

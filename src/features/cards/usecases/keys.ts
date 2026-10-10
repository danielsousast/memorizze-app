export const cardKeys = {
  all: ["cards"] as const,
  byDeck: (deckId: string) => ["cards", "deck", deckId] as const,
  detail: (id: string) => ["cards", "detail", id] as const,
};

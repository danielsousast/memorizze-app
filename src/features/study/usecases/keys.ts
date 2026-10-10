const scope = (deckId?: string) => deckId ?? "all";

export const studyKeys = {
  all: ["study"] as const,
  queue: (deckId?: string) => ["study", "queue", scope(deckId)] as const,
  streak: ["study", "streak"] as const,
  tomorrow: (deckId?: string) => ["study", "tomorrow", scope(deckId)] as const,
};

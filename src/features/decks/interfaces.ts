export type Deck = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  cardCount: number;
  dueCount: number;
};

export type DeckInput = { name: string; description?: string };

export type DeckErrorCode =
  | "DECK_NAME_EMPTY"
  | "DECK_NAME_DUPLICATE"
  | "DECK_NOT_FOUND";

export type DeckRepository = {
  list(): Deck[];
  getById(id: string): Deck | null;
  create(input: DeckInput): Deck;
  update(id: string, input: DeckInput): Deck;
  remove(id: string): void;
};

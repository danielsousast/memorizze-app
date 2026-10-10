export type Card = {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueDate: Date;
  createdAt: Date;
};

export type CardInput = { front: string; back: string };

export type CardErrorCode =
  | "CARD_FRONT_EMPTY"
  | "CARD_BACK_EMPTY"
  | "CARD_NOT_FOUND"
  | "DECK_NOT_FOUND";

export type CardRepository = {
  listByDeck(deckId: string): Card[];
  getById(id: string): Card | null;
  create(deckId: string, input: CardInput): Card;
  update(id: string, input: Partial<CardInput>): Card;
  remove(id: string): void;
};

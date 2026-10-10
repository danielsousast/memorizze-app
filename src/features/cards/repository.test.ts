import Realm, { BSON } from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { openTestRealm } from "@/testing/realm";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const t0 = new Date("2026-10-09T10:00:00.000Z");

describe("card repository", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(models);
  });

  afterEach(() => {
    realm.close();
  });

  function seedDeck(name = "Inglês") {
    const deck = realm.write(() =>
      realm.create(Deck, { name, createdAt: t0, cards: [] }),
    );
    return deck._id.toHexString();
  }

  const deckCardIds = (deckId: string) =>
    realm
      .objectForPrimaryKey(Deck, new BSON.ObjectId(deckId))!
      .cards.map((c) => c._id.toHexString());

  it("CRD-01 creates a card with trimmed texts and initial scheduling at the end of the deck", () => {
    const deckId = seedDeck();
    const repository = createCardRepository(realm, () => t0);
    const first = repository.create(deckId, { front: "x", back: "y" });

    const card = repository.create(deckId, { front: " a ", back: " b " });

    expect(card).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{24}$/),
      front: "a",
      back: "b",
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      lapses: 0,
      dueDate: t0,
      createdAt: t0,
    });
    expect(deckCardIds(deckId)).toEqual([first.id, card.id]);
  });

  it("CRD-02 lists a deck's cards in insertion order", () => {
    const deckId = seedDeck();
    const otherId = seedDeck("Física");
    const repository = createCardRepository(realm, () => t0);
    const ids = ["c1", "c2", "c3"].map(
      (front) => repository.create(deckId, { front, back: "b" }).id,
    );
    repository.create(otherId, { front: "other", back: "b" });

    expect(repository.listByDeck(deckId).map((c) => c.id)).toEqual(ids);
  });

  it("CRD-03 gets a card by id, or null when it does not exist", () => {
    const deckId = seedDeck();
    const repository = createCardRepository(realm, () => t0);
    const card = repository.create(deckId, { front: "a", back: "b" });

    expect(repository.getById(card.id)).toEqual(card);
    expect(repository.getById(new BSON.ObjectId().toHexString())).toBeNull();
    expect(repository.getById("xyz")).toBeNull();
  });

  it("CRD-06 rejects blank front or back, checking front first, and writes nothing", () => {
    const deckId = seedDeck();
    const repository = createCardRepository(realm, () => t0);
    const rejects = (front: string, back: string, code: string) =>
      expect(() => repository.create(deckId, { front, back })).toThrow(
        expect.objectContaining({ code }),
      );

    rejects(" ", "b", "CARD_FRONT_EMPTY");
    rejects("a", "", "CARD_BACK_EMPTY");
    rejects("", "", "CARD_FRONT_EMPTY");
    expect(realm.objects(Card)).toHaveLength(0);
  });

  it("DCK-08 rejects a card for a missing deck and writes nothing", () => {
    const repository = createCardRepository(realm, () => t0);

    expect(() =>
      repository.create(new BSON.ObjectId().toHexString(), { front: "a", back: "b" }),
    ).toThrow(expect.objectContaining({ code: "DECK_NOT_FOUND" }));
    expect(realm.objects(Card)).toHaveLength(0);
  });
});

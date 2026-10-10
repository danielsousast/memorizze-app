import Realm, { BSON } from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { createRandom } from "@/testing/random";
import { openTestRealm } from "@/testing/realm";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const t0 = new Date("2026-10-09T10:00:00.000Z");
const at = (minutes: number) => new Date(t0.getTime() + minutes * 60_000);

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

  it("CRD-04 edits texts and keeps every scheduling field", () => {
    const deckId = seedDeck();
    const repository = createCardRepository(realm, () => t0);
    const { id } = repository.create(deckId, { front: "a", back: "b" });
    const due = new Date("2026-11-01T00:00:00.000Z");
    const stored = realm.objectForPrimaryKey(Card, new BSON.ObjectId(id))!;
    realm.write(() => {
      stored.easeFactor = 1.9;
      stored.intervalDays = 6;
      stored.repetitions = 3;
      stored.lapses = 1;
      stored.dueDate = due;
    });
    const before = repository.getById(id)!;

    const updated = repository.update(id, { back: " novo " });

    expect(updated).toEqual({ ...before, back: "novo" });
    expect(repository.getById(id)).toEqual(updated);
    expect(updated).toMatchObject({
      front: "a",
      easeFactor: 1.9,
      intervalDays: 6,
      repetitions: 3,
      lapses: 1,
      dueDate: due,
      createdAt: t0,
    });
  });

  it("CRD-06 rejects an edit to a blank text and keeps the card", () => {
    const deckId = seedDeck();
    const repository = createCardRepository(realm, () => t0);
    const card = repository.create(deckId, { front: "a", back: "b" });

    expect(() => repository.update(card.id, { front: "  " })).toThrow(
      expect.objectContaining({ code: "CARD_FRONT_EMPTY" }),
    );
    expect(() => repository.update(card.id, { front: "c", back: " " })).toThrow(
      expect.objectContaining({ code: "CARD_BACK_EMPTY" }),
    );
    expect(repository.getById(card.id)).toEqual(card);
  });

  it("CRD-07 rejects edit and remove of a missing card", () => {
    const repository = createCardRepository(realm, () => t0);
    const missing = new BSON.ObjectId().toHexString();

    expect(() => repository.update(missing, { front: "a" })).toThrow(
      expect.objectContaining({ code: "CARD_NOT_FOUND" }),
    );
    expect(() => repository.remove(missing)).toThrow(
      expect.objectContaining({ code: "CARD_NOT_FOUND" }),
    );
    expect(() => repository.remove("xyz")).toThrow(
      expect.objectContaining({ code: "CARD_NOT_FOUND" }),
    );
  });

  it("CRD-05 removes the card from the database and from its deck", () => {
    const deckId = seedDeck();
    const repository = createCardRepository(realm, () => t0);
    const keep = repository.create(deckId, { front: "a", back: "b" });
    const card = repository.create(deckId, { front: "c", back: "d" });

    repository.remove(card.id);

    expect(repository.getById(card.id)).toBeNull();
    expect(deckCardIds(deckId)).toEqual([keep.id]);
  });

  it("CRD-08 keeps the removed card's review logs", () => {
    const deckId = seedDeck();
    const repository = createCardRepository(realm, () => t0);
    const card = repository.create(deckId, { front: "a", back: "b" });
    realm.write(() => {
      for (const grade of [1, 3]) {
        realm.create(ReviewLog, {
          cardId: new BSON.ObjectId(card.id),
          deckId: new BSON.ObjectId(deckId),
          grade,
          reviewedAt: t0,
        });
      }
    });

    repository.remove(card.id);

    const logs = realm.objects(ReviewLog);
    expect(logs).toHaveLength(2);
    expect(logs.every((l) => l.cardId.toHexString() === card.id)).toBe(true);
  });

  it("INV-03 never creates, changes or deletes review logs", () => {
    const random = createRandom(11);
    let clock = 0;
    const decks = createDeckRepository(realm, () => at(clock++));
    const cards = createCardRepository(realm, () => at(clock++));
    realm.write(() => {
      for (let grade = 0; grade < 5; grade++) {
        realm.create(ReviewLog, {
          cardId: new BSON.ObjectId(),
          deckId: new BSON.ObjectId(),
          grade,
          reviewedAt: at(-grade),
        });
      }
    });
    const snapshot = () =>
      realm.objects(ReviewLog).map((l) => ({
        id: l._id.toHexString(),
        cardId: l.cardId.toHexString(),
        deckId: l.deckId.toHexString(),
        grade: l.grade,
        reviewedAt: l.reviewedAt,
      }));
    const initial = snapshot();
    const deckIds = () => realm.objects(Deck).map((d) => d._id.toHexString());
    const cardIds = () => realm.objects(Card).map((c) => c._id.toHexString());
    const ops = [
      () => decks.create({ name: `deck-${clock}` }),
      () => decks.update(random.pick(deckIds()), { name: `renamed-${clock}` }),
      () => decks.remove(random.pick(deckIds())),
      () => cards.create(random.pick(deckIds()), { front: "f", back: "b" }),
      () => cards.create(random.pick(deckIds()), { front: "f", back: "b" }),
      () => cards.update(random.pick(cardIds()), { front: `f${clock}` }),
      () => cards.remove(random.pick(cardIds())),
    ];
    let succeeded = 0;

    for (let step = 0; step < 100; step++) {
      try {
        random.pick(ops)();
        succeeded++;
      } catch {
        // operations on an empty realm pick no id and are rejected
      }
      expect(snapshot()).toEqual(initial);
    }

    expect(succeeded).toBeGreaterThan(50);
  });
});

import Realm, { BSON } from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createDeckRepository } from "@/features/decks/repository";
import { createRandom } from "@/testing/random";
import { openTestRealm } from "@/testing/realm";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const t0 = new Date("2026-10-09T10:00:00.000Z");
const at = (minutes: number) => new Date(t0.getTime() + minutes * 60_000);
const normalize = (name: string) => name.trim().toLocaleLowerCase();

describe("deck repository", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(models);
  });

  afterEach(() => {
    realm.close();
  });

  function seedCards(deckId: string, count: number) {
    const deck = realm.objectForPrimaryKey(Deck, new BSON.ObjectId(deckId))!;
    realm.write(() => {
      for (let i = 0; i < count; i++) {
        deck.cards.push(
          realm.create(Card, {
            front: `f${i}`,
            back: `b${i}`,
            dueDate: t0,
            createdAt: t0,
          }),
        );
      }
    });
    return deck.cards.map((card) => card._id.toHexString());
  }

  it("DCK-01 creates a deck with a trimmed name, creation time and no cards", () => {
    const repository = createDeckRepository(realm, () => t0);

    const deck = repository.create({ name: "  Inglês ", description: "x" });

    expect(deck).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{24}$/),
      name: "Inglês",
      description: "x",
      createdAt: t0,
      cardCount: 0,
      dueCount: 0,
    });
    expect(realm.objects(Deck)).toHaveLength(1);
  });

  it("DUE-01 counts cards due by the end of the local day in list and getById", () => {
    const now = new Date(2026, 9, 9, 10, 0);
    const repository = createDeckRepository(realm, () => now);
    const { id } = repository.create({ name: "Inglês" });
    const empty = repository.create({ name: "Vazio" });
    const deck = realm.objectForPrimaryKey(Deck, new BSON.ObjectId(id))!;
    realm.write(() => {
      for (const dueDate of [
        new Date(2026, 9, 8, 12, 0),
        new Date(2026, 9, 9, 23, 0),
        new Date(2026, 9, 10, 0, 0),
      ]) {
        deck.cards.push(realm.create(Card, { front: "f", back: "b", dueDate, createdAt: now }));
      }
    });

    expect(repository.list().map((d) => d.dueCount)).toEqual([2, 0]);
    expect(repository.getById(id)?.dueCount).toBe(2);
    expect(repository.getById(empty.id)?.dueCount).toBe(0);
  });

  it("DCK-02 lists decks by createdAt ascending with their card count", () => {
    const times = [at(3), at(1), at(2)];
    const repository = createDeckRepository(realm, () => times.shift()!);
    const third = repository.create({ name: "C" });
    repository.create({ name: "A" });
    repository.create({ name: "B" });
    seedCards(third.id, 2);

    const decks = createDeckRepository(realm, () => t0).list();

    expect(decks.map((d) => d.name)).toEqual(["A", "B", "C"]);
    expect(decks.map((d) => d.cardCount)).toEqual([0, 0, 2]);
  });

  it("DCK-03 gets a deck by id, or null when it does not exist", () => {
    const repository = createDeckRepository(realm, () => t0);
    const created = repository.create({ name: "Inglês" });

    expect(repository.getById(created.id)).toEqual(created);
    expect(repository.getById(new BSON.ObjectId().toHexString())).toBeNull();
    expect(repository.getById("xyz")).toBeNull();
  });

  it("DCK-06 rejects a blank name and writes nothing", () => {
    const repository = createDeckRepository(realm, () => t0);

    expect(() => repository.create({ name: "   " })).toThrow(
      expect.objectContaining({ code: "DECK_NAME_EMPTY" }),
    );
    expect(realm.objects(Deck)).toHaveLength(0);
  });

  it("DCK-07 rejects a name equal to another deck ignoring case and edge spaces", () => {
    const repository = createDeckRepository(realm, () => t0);
    repository.create({ name: "Inglês" });

    expect(() => repository.create({ name: " inglês " })).toThrow(
      expect.objectContaining({ code: "DECK_NAME_DUPLICATE" }),
    );
    expect(realm.objects(Deck)).toHaveLength(1);
  });

  it("INV-01 never stores two decks with the same normalized name", () => {
    const random = createRandom(42);
    const pool = ["Inglês", " inglês", "INGLÊS ", "Física", "física  ", "Arte", " ARTE "];
    let clock = 0;
    const repository = createDeckRepository(realm, () => at(clock++));
    let rejected = 0;

    for (let step = 0; step < 100; step++) {
      try {
        repository.create({ name: random.pick(pool) });
      } catch {
        rejected++;
      }
      const names = realm.objects(Deck).map((d) => normalize(d.name));
      expect(new Set(names).size).toBe(names.length);
    }

    expect(realm.objects(Deck)).toHaveLength(3);
    expect(rejected).toBe(97);
  });

  it("DCK-04 updates name and description without touching createdAt or cards", () => {
    const repository = createDeckRepository(realm, () => t0);
    const { id } = repository.create({ name: "Inglês" });
    const cardIds = seedCards(id, 2);

    const updated = repository.update(id, { name: " Espanhol ", description: "y" });

    expect(updated).toEqual({
      id,
      name: "Espanhol",
      description: "y",
      createdAt: t0,
      cardCount: 2,
      dueCount: 2,
    });
    expect(repository.getById(id)).toEqual(updated);
    const stored = realm.objectForPrimaryKey(Deck, new BSON.ObjectId(id))!;
    expect(stored.cards.map((c) => c._id.toHexString())).toEqual(cardIds);
  });

  it("DCK-04 keeps an omitted description and removes an empty one (A-01)", () => {
    const repository = createDeckRepository(realm, () => t0);
    const { id } = repository.create({ name: "A", description: "d" });

    expect(repository.update(id, { name: "B" }).description).toBe("d");
    expect(repository.getById(id)?.description).toBe("d");

    repository.update(id, { name: "B", description: "" });
    expect(repository.getById(id)).not.toHaveProperty("description", expect.anything());
    expect(realm.objectForPrimaryKey(Deck, new BSON.ObjectId(id))!.description).toBeNull();
  });

  it("DCK-10 accepts an update that keeps the deck's own name in another case", () => {
    const repository = createDeckRepository(realm, () => t0);
    const { id } = repository.create({ name: "Inglês" });

    expect(repository.update(id, { name: "INGLÊS" }).name).toBe("INGLÊS");
  });

  it("DCK-07 rejects an update to another deck's name and keeps the values", () => {
    const repository = createDeckRepository(realm, () => t0);
    repository.create({ name: "Inglês" });
    const other = repository.create({ name: "Física", description: "d" });

    expect(() => repository.update(other.id, { name: "inglês" })).toThrow(
      expect.objectContaining({ code: "DECK_NAME_DUPLICATE" }),
    );
    expect(repository.getById(other.id)).toEqual(other);
  });

  it("DCK-06 rejects an update to a blank name", () => {
    const repository = createDeckRepository(realm, () => t0);
    const deck = repository.create({ name: "Inglês" });

    expect(() => repository.update(deck.id, { name: " " })).toThrow(
      expect.objectContaining({ code: "DECK_NAME_EMPTY" }),
    );
    expect(repository.getById(deck.id)).toEqual(deck);
  });

  it("DCK-08 rejects update and remove of a missing deck", () => {
    const repository = createDeckRepository(realm, () => t0);
    repository.create({ name: "Inglês" });
    const missing = new BSON.ObjectId().toHexString();

    expect(() => repository.update(missing, { name: "X" })).toThrow(
      expect.objectContaining({ code: "DECK_NOT_FOUND" }),
    );
    expect(() => repository.remove(missing)).toThrow(
      expect.objectContaining({ code: "DECK_NOT_FOUND" }),
    );
    expect(() => repository.remove("xyz")).toThrow(
      expect.objectContaining({ code: "DECK_NOT_FOUND" }),
    );
    expect(realm.objects(Deck)).toHaveLength(1);
    expect(realm.objects(Deck)[0].name).toBe("Inglês");
  });

  it("DCK-05 removes the deck and all of its cards", () => {
    const repository = createDeckRepository(realm, () => t0);
    const { id } = repository.create({ name: "A" });
    const cardIds = seedCards(id, 3);

    repository.remove(id);

    expect(realm.objectForPrimaryKey(Deck, new BSON.ObjectId(id))).toBeNull();
    for (const cardId of cardIds) {
      expect(realm.objectForPrimaryKey(Card, new BSON.ObjectId(cardId))).toBeNull();
    }
  });

  it("DCK-09 keeps other decks' cards and every review log", () => {
    const repository = createDeckRepository(realm, () => t0);
    const a = repository.create({ name: "A" });
    const b = repository.create({ name: "B" });
    const aCards = seedCards(a.id, 2);
    const bCards = seedCards(b.id, 2);
    realm.write(() => {
      for (const cardId of aCards) {
        realm.create(ReviewLog, {
          cardId: new BSON.ObjectId(cardId),
          deckId: new BSON.ObjectId(a.id),
          grade: 2,
          reviewedAt: t0,
        });
      }
    });

    repository.remove(a.id);

    const stored = realm.objectForPrimaryKey(Deck, new BSON.ObjectId(b.id))!;
    expect(stored.cards.map((c) => c._id.toHexString())).toEqual(bCards);
    expect(realm.objects(Card)).toHaveLength(2);
    expect(realm.objects(ReviewLog)).toHaveLength(2);
    expect(realm.objects(ReviewLog).map((l) => l.cardId.toHexString())).toEqual(aCards);
  });

  it("INV-02 never leaves orphan cards after random deck operations", () => {
    const random = createRandom(7);
    let clock = 0;
    const repository = createDeckRepository(realm, () => at(clock++));
    const ids = () => realm.objects(Deck).map((d) => d._id.toHexString());
    let removed = 0;

    for (let step = 0; step < 100; step++) {
      const op = random.pick(["create", "create", "update", "remove"] as const);
      try {
        if (op === "create") {
          const { id } = repository.create({ name: `deck-${step}` });
          seedCards(id, Math.floor(random.next() * 4));
        } else if (op === "update") {
          repository.update(random.pick(ids()), { name: `renamed-${step}` });
        } else {
          repository.remove(random.pick(ids()));
          removed++;
        }
      } catch {
        // update/remove on an empty realm picks no id and is rejected
      }
      const inDecks = realm.objects(Deck).reduce((sum, d) => sum + d.cards.length, 0);
      expect(realm.objects(Card)).toHaveLength(inDecks);
    }

    expect(removed).toBeGreaterThan(10);
  });

  it("RST-01 resets scheduling only, for that deck's cards", () => {
    const repository = createDeckRepository(realm, () => at(60));
    const deck = repository.create({ name: "Inglês" });
    const other = repository.create({ name: "Física" });
    const [id] = seedCards(deck.id, 1);
    const [otherId] = seedCards(other.id, 1);
    realm.write(() => {
      for (const key of [id, otherId]) {
        const card = realm.objectForPrimaryKey(Card, new BSON.ObjectId(key))!;
        card.easeFactor = 1.8;
        card.intervalDays = 9;
        card.repetitions = 4;
        card.lapses = 2;
        card.dueDate = at(9999);
      }
      realm.create(ReviewLog, {
        cardId: new BSON.ObjectId(id),
        deckId: new BSON.ObjectId(deck.id),
        grade: 3,
        reviewedAt: t0,
      });
    });

    repository.resetProgress(deck.id);

    const card = realm.objectForPrimaryKey(Card, new BSON.ObjectId(id))!;
    expect([card.easeFactor, card.intervalDays, card.repetitions, card.lapses]).toEqual([
      2.5, 0, 0, 0,
    ]);
    expect(card.dueDate).toEqual(at(60));
    expect([card.front, card.back, card.createdAt]).toEqual(["f0", "b0", t0]);
    expect(realm.objects(ReviewLog)).toHaveLength(1);
    const kept = realm.objectForPrimaryKey(Card, new BSON.ObjectId(otherId))!;
    expect([kept.easeFactor, kept.intervalDays, kept.dueDate]).toEqual([1.8, 9, at(9999)]);
  });

  it("RST-03 resets an empty deck and rejects a missing one", () => {
    const repository = createDeckRepository(realm, () => t0);
    const deck = repository.create({ name: "Vazio" });

    expect(() => repository.resetProgress(deck.id)).not.toThrow();
    expect(() => repository.resetProgress(new BSON.ObjectId().toHexString())).toThrow(
      expect.objectContaining({ code: "DECK_NOT_FOUND" }),
    );
  });
});

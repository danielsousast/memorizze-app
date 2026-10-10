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
    });
    expect(realm.objects(Deck)).toHaveLength(1);
  });

  it("DCK-02 lists decks by createdAt ascending with their card count", () => {
    const times = [at(3), at(1), at(2)];
    const repository = createDeckRepository(realm, () => times.shift()!);
    const third = repository.create({ name: "C" });
    repository.create({ name: "A" });
    repository.create({ name: "B" });
    seedCards(third.id, 2);

    const decks = repository.list();

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
});

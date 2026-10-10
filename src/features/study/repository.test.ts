import Realm, { BSON } from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";

import * as adapters from "./adapters";
import { createStudyRepository } from "./repository";
import { openTestRealm } from "@/testing/realm";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const now = new Date(2026, 9, 10, 10, 0);
const day = (d: number, h = 0, m = 0) => new Date(2026, 9, d, h, m);

describe("study repository", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(models);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  const repo = () => createStudyRepository(realm, () => now);

  function seedDeck(name: string, cards: { front: string; dueDate: Date; createdAt?: Date }[]) {
    const deck = realm.write(() => {
      const d = realm.create(Deck, { name, createdAt: day(1), cards: [] });
      for (const c of cards) {
        d.cards.push(
          realm.create(Card, {
            front: c.front,
            back: "b",
            dueDate: c.dueDate,
            createdAt: c.createdAt ?? day(1),
          }),
        );
      }
      return d;
    });
    return deck._id.toHexString();
  }

  it("QUE-01 returns cards due by end of today, ordered by dueDate then createdAt", () => {
    const deckId = seedDeck("Inglês", [
      { front: "tomorrow", dueDate: day(11) },
      { front: "today", dueDate: day(10, 23) },
      { front: "tie-late", dueDate: day(9), createdAt: day(2) },
      { front: "tie-early", dueDate: day(9), createdAt: day(1) },
    ]);

    const queue = repo().queue(deckId)!;

    expect(queue.map((c) => c.front)).toEqual(["tie-early", "tie-late", "today"]);
    expect(queue[0]).toEqual(
      expect.objectContaining({ deckId, deckName: "Inglês", id: expect.any(String) }),
    );
  });

  it("QUE-01 scopes to the deck, and without deckId merges all decks", () => {
    const a = seedDeck("A", [{ front: "a1", dueDate: day(9) }]);
    const b = seedDeck("B", [{ front: "b1", dueDate: day(8) }]);

    expect(repo().queue(a)!.map((c) => c.front)).toEqual(["a1"]);
    const all = repo().queue()!;
    expect(all.map((c) => [c.front, c.deckId, c.deckName])).toEqual([
      ["b1", b, "B"],
      ["a1", a, "A"],
    ]);
  });

  it("QUE-04 returns null for invalid or missing deck and [] when nothing is due", () => {
    const deckId = seedDeck("A", [{ front: "x", dueDate: day(20) }]);

    expect(repo().queue("xyz")).toBeNull();
    expect(repo().queue(new BSON.ObjectId().toHexString())).toBeNull();
    expect(repo().queue(deckId)).toEqual([]);
  });

  it("PERF-01 maps only the 1000 due cards, not the future ones", () => {
    const due = Array.from({ length: 1000 }, (_, i) => ({
      front: `d${i}`,
      dueDate: day(9, 0, i % 60),
    }));
    const future = Array.from({ length: 1000 }, (_, i) => ({
      front: `f${i}`,
      dueDate: day(20, 0, i % 60),
    }));
    const deckId = seedDeck("Big", [...due, ...future]);
    const spy = jest.spyOn(adapters, "toStudyCard");

    expect(repo().queue(deckId)).toHaveLength(1000);
    expect(spy).toHaveBeenCalledTimes(1000);
  });

  it("SUM-06 counts cards due by end of tomorrow (including today's), respecting scope", () => {
    const a = seedDeck("A", [
      { front: "1", dueDate: day(10) },
      { front: "2", dueDate: day(11, 23, 59) },
      { front: "3", dueDate: day(12) },
    ]);
    seedDeck("B", [{ front: "4", dueDate: day(10) }]);

    expect(repo().countDueTomorrow(a)).toBe(2);
    expect(repo().countDueTomorrow()).toBe(3);
    expect(repo().countDueTomorrow("xyz")).toBe(0);
  });
});

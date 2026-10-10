import Realm, { BSON } from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";

import * as adapters from "./adapters";
import { createStudyRepository } from "./repository";
import { AppError } from "@/domain/errors";
import { startOfLocalDay, addLocalDays } from "@/domain/dates";
import { createRandom } from "@/testing/random";
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
  function seedSrs(name: string, srs: { repetitions: number; intervalDays: number; easeFactor: number }) {
    return realm.write(() => {
      const d = realm.create(Deck, { name, createdAt: day(1), cards: [] });
      const c = realm.create(Card, { front: "f", back: "b", dueDate: day(9), createdAt: day(1), ...srs });
      d.cards.push(c);
      return { deckId: d._id, cardId: c._id.toHexString() };
    });
  }

  it("ANS-01 answer reschedules the card and writes one ReviewLog with the deck of the card", () => {
    seedSrs("A", { repetitions: 0, intervalDays: 0, easeFactor: 2.5 });
    const { deckId, cardId } = seedSrs("B", { repetitions: 2, intervalDays: 3, easeFactor: 2.5 });

    const result = repo().answer(cardId, 2);

    const card = realm.objectForPrimaryKey(Card, new BSON.ObjectId(cardId))!;
    expect([card.repetitions, card.intervalDays, card.easeFactor]).toEqual([3, 8, 2.5]);
    expect(card.dueDate).toEqual(addLocalDays(startOfLocalDay(now), 8));
    expect(result).toEqual(expect.objectContaining({ id: cardId, repetitions: 3, deckName: "B" }));
    const logs = realm.objects(ReviewLog);
    expect(logs).toHaveLength(1);
    expect(logs[0].cardId.toHexString()).toBe(cardId);
    expect(logs[0].deckId.equals(deckId)).toBe(true);
    expect(logs[0].grade).toBe(2);
    expect(logs[0].reviewedAt).toEqual(now);
  });

  it("ANS-08 a failing ReviewLog create rolls back the card too", () => {
    const { cardId } = seedSrs("B", { repetitions: 2, intervalDays: 3, easeFactor: 2.5 });
    const create = realm.create.bind(realm);
    jest.spyOn(realm, "create").mockImplementation(((type: unknown, ...rest: unknown[]) => {
      if (type === ReviewLog) throw new Error("disk full");
      return (create as (...a: unknown[]) => unknown)(type, ...rest);
    }) as typeof realm.create);

    expect(() => repo().answer(cardId, 2)).toThrow("disk full");

    const card = realm.objectForPrimaryKey(Card, new BSON.ObjectId(cardId))!;
    expect([card.repetitions, card.intervalDays]).toEqual([2, 3]);
    expect(realm.objects(ReviewLog)).toHaveLength(0);
  });

  it("CONTRACT answer of an unknown or invalid id throws CARD_NOT_FOUND and writes nothing", () => {
    for (const id of ["xyz", new BSON.ObjectId().toHexString()]) {
      let error: unknown;
      try {
        repo().answer(id, 2);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError<string>).code).toBe("CARD_NOT_FOUND");
    }
    expect(realm.objects(ReviewLog)).toHaveLength(0);
  });

  it("SUM-04 currentStreak counts consecutive days with logs up to today", () => {
    realm.write(() => {
      for (const d of [8, 9, 10]) {
        realm.create(ReviewLog, {
          cardId: new BSON.ObjectId(),
          deckId: new BSON.ObjectId(),
          grade: 2,
          reviewedAt: day(d, 12),
        });
      }
    });

    expect(repo().currentStreak()).toBe(3);
  });

  it("INV-01 logs equal accepted answers and each matches a card change", () => {
    const random = createRandom(42);
    const ids = Array.from({ length: 10 }, () =>
      seedSrs("D", { repetitions: 0, intervalDays: 0, easeFactor: 2.5 }).cardId,
    );
    const create = realm.create.bind(realm);
    let failNext = false;
    jest.spyOn(realm, "create").mockImplementation(((type: unknown, ...rest: unknown[]) => {
      if (type === ReviewLog && failNext) throw new Error("injected");
      return (create as (...a: unknown[]) => unknown)(type, ...rest);
    }) as typeof realm.create);

    let accepted = 0;
    const lapsesBefore = (id: string) =>
      realm.objectForPrimaryKey(Card, new BSON.ObjectId(id))!.repetitions;
    for (let i = 0; i < 100; i++) {
      const id = random.pick(ids);
      failNext = random.next() < 0.2;
      const before = lapsesBefore(id);
      const logsBefore = realm.objects(ReviewLog).length;
      try {
        repo().answer(id, 2);
        accepted += 1;
        expect(lapsesBefore(id)).toBe(before + 1);
        expect(realm.objects(ReviewLog)).toHaveLength(logsBefore + 1);
      } catch {
        expect(lapsesBefore(id)).toBe(before);
        expect(realm.objects(ReviewLog)).toHaveLength(logsBefore);
      }
    }

    expect(realm.objects(ReviewLog)).toHaveLength(accepted);
    const total = ids.reduce((sum, id) => sum + lapsesBefore(id), 0);
    expect(total).toBe(accepted);
  });
});

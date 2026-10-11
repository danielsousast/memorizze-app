import Realm, { BSON } from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { buildBackup, parseBackup, type BackupFile, type BackupSnapshot } from "@/domain/backup";
import { createRandom } from "@/testing/random";
import { openTestRealm } from "@/testing/realm";

import { createBackupRepository } from "./repository";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const EXPORTED_AT = new Date("2026-10-10T19:04:00.000Z");

type Random = ReturnType<typeof createRandom>;

function randomDate(random: Random): Date {
  return new Date(Math.floor(random.next() * 4e12));
}

const TEXTS = ["Olá", "linha 1\nlinha 2", 'aspas "x"', "😀", "ação"];

/** Fills the realm directly, without going through the repository under test. */
function seed(realm: Realm, random: Random) {
  realm.write(() => {
    realm.create(Profile, {
      name: random.pick(TEXTS),
      dailyGoal: Math.floor(random.next() * 100),
      createdAt: randomDate(random),
      studyTutorialSeen: random.next() < 0.5,
      themePreference: random.pick(["system", "light", "dark"]),
      newCardsPerDay: random.pick([0, 5, 10, 50]),
      lastBackupAt: randomDate(random),
      previousBackupAt: randomDate(random),
    });
    const decks = Array.from({ length: Math.floor(random.next() * 4) }, () =>
      realm.create(Deck, {
        name: random.pick(TEXTS),
        description: random.next() < 0.5 ? undefined : random.pick(TEXTS),
        createdAt: randomDate(random),
        cards: [],
      }),
    );
    if (decks.length === 0) return;
    for (let i = 0; i < Math.floor(random.next() * 8); i++) {
      const deck = random.pick(decks);
      const card = realm.create(Card, {
        front: random.pick(TEXTS),
        back: random.pick(TEXTS),
        easeFactor: 1.3 + random.next() * 2,
        intervalDays: Math.floor(random.next() * 400),
        repetitions: Math.floor(random.next() * 20),
        lapses: Math.floor(random.next() * 5),
        dueDate: randomDate(random),
        createdAt: randomDate(random),
      });
      deck.cards.push(card);
      for (let j = 0; j < Math.floor(random.next() * 3); j++) {
        realm.create(ReviewLog, {
          cardId: card._id,
          deckId: deck._id,
          grade: Math.floor(random.next() * 4),
          reviewedAt: randomDate(random),
        });
      }
    }
  });
}

function fileFrom(snapshot: BackupSnapshot): BackupFile {
  const parsed = parseBackup(JSON.stringify(buildBackup(snapshot, EXPORTED_AT)));
  if (!parsed.ok) throw new Error("test file must be valid");
  return parsed.backup;
}

function otherFile(seedValue: number): BackupFile {
  const other = openTestRealm(models);
  seed(other, createRandom(seedValue));
  const file = fileFrom(createBackupRepository(other).snapshot());
  other.close();
  return file;
}

describe("backup repository", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(models);
  });

  afterEach(() => {
    realm.close();
  });

  it("BKP-03 snapshots every record and field, without backup dates", () => {
    const deckId = new BSON.ObjectId();
    const cardId = new BSON.ObjectId();
    const logId = new BSON.ObjectId();
    const created = new Date("2026-02-01T10:00:00.000Z");
    realm.write(() => {
      realm.create(Profile, {
        name: "Ana",
        dailyGoal: 15,
        createdAt: created,
        studyTutorialSeen: true,
        themePreference: "dark",
        newCardsPerDay: 0,
        lastBackupAt: new Date(),
      });
      const deck = realm.create(Deck, { _id: deckId, name: "Inglês", createdAt: created, cards: [] });
      deck.cards.push(
        realm.create(Card, {
          _id: cardId,
          front: "a",
          back: "b",
          easeFactor: 2.1,
          intervalDays: 4,
          repetitions: 2,
          lapses: 1,
          dueDate: created,
          createdAt: created,
        }),
      );
      realm.create(ReviewLog, { _id: logId, cardId, deckId, grade: 3, reviewedAt: created });
    });

    const snapshot = createBackupRepository(realm).snapshot();

    expect(snapshot.profile).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{24}$/),
      name: "Ana",
      dailyGoal: 15,
      createdAt: "2026-02-01T10:00:00.000Z",
      studyTutorialSeen: true,
      themePreference: "dark",
      newCardsPerDay: 0,
    });
    expect(snapshot.decks).toEqual([
      { id: deckId.toHexString(), name: "Inglês", description: null, createdAt: "2026-02-01T10:00:00.000Z" },
    ]);
    expect(snapshot.cards).toEqual([
      {
        id: cardId.toHexString(),
        deckId: deckId.toHexString(),
        front: "a",
        back: "b",
        easeFactor: 2.1,
        intervalDays: 4,
        repetitions: 2,
        lapses: 1,
        dueDate: "2026-02-01T10:00:00.000Z",
        createdAt: "2026-02-01T10:00:00.000Z",
      },
    ]);
    expect(snapshot.reviewLogs).toEqual([
      {
        id: logId.toHexString(),
        cardId: cardId.toHexString(),
        deckId: deckId.toHexString(),
        grade: 3,
        reviewedAt: "2026-02-01T10:00:00.000Z",
      },
    ]);
    expect(JSON.stringify(snapshot)).not.toMatch(/BackupAt/);
  });

  it("BKP-08 counts decks, cards and review logs", () => {
    seed(realm, createRandom(3));
    const repository = createBackupRepository(realm);
    const snapshot = repository.snapshot();
    expect(repository.counts()).toEqual({
      decks: snapshot.decks.length,
      cards: snapshot.cards.length,
      reviewLogs: snapshot.reviewLogs.length,
    });
  });

  it("BKP-23 snapshots a database without decks and restores empty lists", () => {
    realm.write(() => realm.create(Profile, { name: "Ana", createdAt: new Date() }));
    const repository = createBackupRepository(realm);
    const snapshot = repository.snapshot();
    expect(snapshot.decks).toEqual([]);
    expect(snapshot.cards).toEqual([]);
    expect(snapshot.reviewLogs).toEqual([]);

    seed(realm, createRandom(11));
    repository.restore(fileFrom(snapshot));
    expect(realm.objects(Profile)).toHaveLength(1);
    expect(realm.objects(Deck)).toHaveLength(0);
    expect(realm.objects(Card)).toHaveLength(0);
    expect(realm.objects(ReviewLog)).toHaveLength(0);
  });

  it("BKP-13 leaves both backup dates empty after a restore", () => {
    seed(realm, createRandom(5));
    const repository = createBackupRepository(realm);
    expect(repository.lastBackup().last).not.toBeNull();

    repository.restore(otherFile(6));

    expect(repository.lastBackup()).toEqual({ last: null, previous: null });
  });

  it("BKP-11 links restored cards to their decks and keeps the file's ids", () => {
    const file = otherFile(8);
    createBackupRepository(realm).restore(file);

    for (const deck of file.decks) {
      const stored = realm.objectForPrimaryKey(Deck, new BSON.ObjectId(deck.id));
      const expected = file.cards.filter((card) => card.deckId === deck.id).map((card) => card.id);
      expect(stored!.cards.map((card) => card._id.toHexString()).sort()).toEqual(expected.sort());
    }
    expect(realm.objects(Profile)[0]._id.toHexString()).toBe(file.profile.id);
  });

  it("BKP-18 fails with BACKUP_RESTORE_FAILED and leaves the database as it was", () => {
    seed(realm, createRandom(21));
    const repository = createBackupRepository(realm);
    const before = repository.snapshot();
    const lastBefore = repository.lastBackup();
    const file = otherFile(22);
    file.cards.push({ ...file.cards[0] });

    expect(() => repository.restore(file)).toThrow(expect.objectContaining({ code: "BACKUP_RESTORE_FAILED" }));

    expect(repository.snapshot()).toEqual(before);
    expect(repository.lastBackup()).toEqual(lastBefore);
  });

  it("INV-01 leaves the database identical after 50 failures at random points", () => {
    const random = createRandom(99);
    let failures = 0;
    for (let round = 0; round < 50; round++) {
      seed(realm, random);
      const repository = createBackupRepository(realm);
      const before = repository.snapshot();
      const lastBefore = repository.lastBackup();
      const file = otherFile(1000 + round);
      const lists = ([file.decks, file.cards, file.reviewLogs] as { id: string }[][]).filter((list) => list.length > 0);
      if (lists.length === 0) continue;
      const list = random.pick(lists);
      const duplicate = { ...random.pick(list) };
      list.splice(Math.floor(random.next() * (list.length + 1)), 0, duplicate as never);

      expect(() => repository.restore(file)).toThrow(expect.objectContaining({ code: "BACKUP_RESTORE_FAILED" }));
      failures++;

      expect(repository.snapshot()).toEqual(before);
      expect(repository.lastBackup()).toEqual(lastBefore);
    }
    expect(failures).toBeGreaterThan(30);
  });

  it("INV-02 restores 100 random databases to the same data", () => {
    for (let round = 0; round < 100; round++) {
      const source = openTestRealm(models);
      seed(source, createRandom(2000 + round));
      const expected = createBackupRepository(source).snapshot();
      const file = fileFrom(expected);
      source.close();

      seed(realm, createRandom(3000 + round));
      const repository = createBackupRepository(realm);
      repository.restore(file);

      expect(repository.snapshot()).toEqual(expected);
      expect(repository.lastBackup()).toEqual({ last: null, previous: null });
    }
  });

  it("INV-03 gives the same state when the same file is restored twice", () => {
    const file = otherFile(31);
    seed(realm, createRandom(32));
    const repository = createBackupRepository(realm);

    repository.restore(file);
    const once = repository.snapshot();
    repository.restore(file);

    expect(repository.snapshot()).toEqual(once);
    expect(repository.counts()).toEqual({
      decks: file.decks.length,
      cards: file.cards.length,
      reviewLogs: file.reviewLogs.length,
    });
  });

  it("INV-05 never changes the database for text that fails validation", () => {
    seed(realm, createRandom(41));
    const repository = createBackupRepository(realm);
    const before = repository.snapshot();
    const rejected = ["not json", "{}", JSON.stringify({ app: "memorizze", version: 2 })];

    for (const text of rejected) {
      const parsed = parseBackup(text);
      expect(parsed.ok).toBe(false);
      if (parsed.ok) repository.restore(parsed.backup);
    }

    expect(repository.snapshot()).toEqual(before);
  });

  it("BKP-04 markBackedUp moves the last backup to previous and stamps the new one", () => {
    const first = new Date("2026-10-02T12:00:00.000Z");
    const second = new Date("2026-10-10T19:04:00.000Z");
    realm.write(() => {
      realm.create(Profile, { name: "Ana", createdAt: new Date() });
    });
    const repository = createBackupRepository(realm);

    repository.markBackedUp(first);
    expect(repository.lastBackup()).toEqual({ last: first, previous: null });
    repository.markBackedUp(second);
    expect(repository.lastBackup()).toEqual({ last: second, previous: first });
  });
});

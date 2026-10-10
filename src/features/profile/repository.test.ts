import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createRandom } from "@/testing/random";
import { openTestRealm } from "@/testing/realm";

import { createProfileRepository } from "./repository";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const now = new Date(2026, 9, 10, 12, 0);

describe("profile repository", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(models);
  });

  afterEach(() => {
    realm.close();
  });

  function seedLogs(dates: Date[], grade = 2) {
    realm.write(() => {
      for (const reviewedAt of dates) {
        realm.create(ReviewLog, {
          cardId: new Realm.BSON.ObjectId(),
          deckId: new Realm.BSON.ObjectId(),
          grade,
          reviewedAt,
        });
      }
    });
  }

  it("REV-02 counts only reviews inside the local day of now", () => {
    const repository = createProfileRepository(realm, () => now);
    expect(repository.countReviewsToday()).toBe(0);

    seedLogs([new Date(2026, 9, 9, 23, 59), new Date(2026, 9, 10, 0, 0), new Date(2026, 9, 10, 23, 59)]);

    expect(repository.countReviewsToday()).toBe(2);
  });

  it("REV-02 does not count a review at the next day's midnight", () => {
    const repository = createProfileRepository(realm, () => now);
    seedLogs([new Date(2026, 9, 11, 0, 0), new Date(2026, 9, 10, 23, 59)]);

    expect(repository.countReviewsToday()).toBe(1);
  });

  it("REV-02 counts repeated reviews of the same card", () => {
    const repository = createProfileRepository(realm, () => now);
    const cardId = new Realm.BSON.ObjectId();
    realm.write(() => {
      for (let i = 0; i < 3; i++) {
        realm.create(ReviewLog, {
          cardId,
          deckId: new Realm.BSON.ObjectId(),
          grade: 2,
          reviewedAt: new Date(2026, 9, 10, 8 + i),
        });
      }
    });

    expect(repository.countReviewsToday()).toBe(3);
  });

  it("REV-01 counts every grade, including Errei", () => {
    const repository = createProfileRepository(realm, () => now);
    for (const grade of [0, 1, 2, 3]) seedLogs([new Date(2026, 9, 10, 9)], grade);

    expect(repository.countReviewsToday()).toBe(4);
  });

  it("PRF-06 uses the oldest profile when more than one exists", () => {
    realm.write(() => {
      realm.create(Profile, { name: "Nova", createdAt: new Date(2026, 0, 2) });
      realm.create(Profile, { name: "Antiga", createdAt: new Date(2026, 0, 1) });
    });

    expect(createProfileRepository(realm, () => now).get()?.name).toBe("Antiga");
  });

  it("returns null when there is no profile", () => {
    expect(createProfileRepository(realm, () => now).get()).toBeNull();
  });

  it("WEL-04 rejects names over 30 characters and accepts exactly 30", () => {
    const repository = createProfileRepository(realm, () => now);

    expect(() => repository.create("a".repeat(31))).toThrow(
      expect.objectContaining({ code: "PROFILE_NAME_TOO_LONG" }),
    );
    expect(realm.objects(Profile)).toHaveLength(0);

    expect(repository.create("a".repeat(30)).name).toBe("a".repeat(30));
  });

  it("WEL-03 rejects blank names and trims valid ones with defaults", () => {
    const repository = createProfileRepository(realm, () => now);

    expect(() => repository.create("   ")).toThrow(
      expect.objectContaining({ code: "PROFILE_NAME_EMPTY" }),
    );
    expect(realm.objects(Profile)).toHaveLength(0);

    expect(repository.create("  Ana  ")).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{24}$/),
      name: "Ana",
      dailyGoal: 20,
      createdAt: now,
    });
  });

  it("INV-01 never holds more than one profile under random create/update", () => {
    const random = createRandom(7);
    const repository = createProfileRepository(realm, () => now);
    for (let i = 0; i < 100; i++) {
      if (random.next() < 0.5) {
        repository.create(`n${i}`);
      } else if (realm.objects(Profile).length > 0) {
        repository.update({ name: `u${i}`, dailyGoal: 5 * (1 + Math.floor(random.next() * 40)) });
      }
      expect(realm.objects(Profile).length).toBeLessThanOrEqual(1);
    }
  });

  it("INV-01 create returns the existing profile without writing", () => {
    const repository = createProfileRepository(realm, () => now);
    const first = repository.create("Ana");

    expect(repository.create("Bia")).toEqual(first);
    expect(realm.objects(Profile)).toHaveLength(1);
  });

  it("PRF-05 trims the updated name and keeps the old one when invalid", () => {
    const repository = createProfileRepository(realm, () => now);
    repository.create("Ana");

    expect(repository.update({ name: " Bia " }).name).toBe("Bia");
    expect(() => repository.update({ name: "" })).toThrow(
      expect.objectContaining({ code: "PROFILE_NAME_EMPTY" }),
    );
    expect(repository.get()?.name).toBe("Bia");
  });

  it("GOL-01 stores the daily goal", () => {
    const repository = createProfileRepository(realm, () => now);
    repository.create("Ana");

    expect(repository.update({ dailyGoal: 25 }).dailyGoal).toBe(25);
    expect(repository.get()?.dailyGoal).toBe(25);
  });

  it("update without a profile throws PROFILE_NOT_FOUND", () => {
    expect(() => createProfileRepository(realm, () => now).update({ dailyGoal: 25 })).toThrow(
      expect.objectContaining({ code: "PROFILE_NOT_FOUND" }),
    );
  });
});

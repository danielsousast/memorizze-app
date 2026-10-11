import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Realm from "realm";
import { realmConfig } from "./realm";

describe("realmConfig", () => {
  it("SCH-07 uses schemaVersion 5 and opens a v1 file created with schema []", () => {
    expect(realmConfig.schemaVersion).toBe(5);

    const path = join(tmpdir(), `memorizze-migration-${randomUUID()}.realm`);
    new Realm({ path, schemaVersion: 1, schema: [] }).close();

    const realm = new Realm({ ...realmConfig, path });
    expect(realm.schema.map((s) => s.name).sort()).toEqual([
      "Card",
      "Deck",
      "Profile",
      "ReviewLog",
    ]);
    realm.close();
    Realm.deleteFile({ path });
  });

  it("MIG-01 migrates a v3 file keeping its data and filling theme system and limit 10", () => {
    const path = join(tmpdir(), `memorizze-migration-${randomUUID()}.realm`);
    const v3Profile = {
      name: "Profile",
      primaryKey: "_id",
      properties: {
        _id: "objectId",
        name: "string",
        dailyGoal: "int",
        createdAt: "date",
        studyTutorialSeen: "bool",
      },
    };
    const old = new Realm({
      path,
      schemaVersion: 3,
      schema: [v3Profile, ...realmConfig.schema!.slice(1)],
    });
    old.write(() => {
      old.create("Profile", {
        _id: new Realm.BSON.ObjectId(),
        name: "Ana",
        dailyGoal: 15,
        createdAt: new Date(2026, 0, 1),
        studyTutorialSeen: true,
      });
      const deck = old.create("Deck", { name: "D", createdAt: new Date(2026, 0, 1), cards: [] });
      (deck as unknown as { cards: unknown[] }).cards.push(
        old.create("Card", { front: "f", back: "b", dueDate: new Date(), createdAt: new Date() }),
      );
    });
    old.close();

    const realm = new Realm({ ...realmConfig, path });
    const profile = realm.objects<{
      name: string;
      dailyGoal: number;
      studyTutorialSeen: boolean;
      themePreference: string;
      newCardsPerDay: number;
    }>("Profile")[0];
    expect(profile).toEqual(
      expect.objectContaining({
        name: "Ana",
        dailyGoal: 15,
        studyTutorialSeen: true,
        themePreference: "system",
        newCardsPerDay: 10,
      }),
    );
    expect(realm.objects("Deck")).toHaveLength(1);
    expect(realm.objects("Card")).toHaveLength(1);
    realm.close();
    Realm.deleteFile({ path });
  });

  it("BKP-27 migrates a v4 file keeping its data and leaving both backup dates empty", () => {
    const path = join(tmpdir(), `memorizze-migration-${randomUUID()}.realm`);
    const v4Profile = {
      name: "Profile",
      primaryKey: "_id",
      properties: {
        _id: "objectId",
        name: "string",
        dailyGoal: "int",
        createdAt: "date",
        studyTutorialSeen: "bool",
        themePreference: "string",
        newCardsPerDay: "int",
      },
    };
    const old = new Realm({
      path,
      schemaVersion: 4,
      schema: [v4Profile, ...realmConfig.schema!.slice(1)],
    });
    const cardId = new Realm.BSON.ObjectId();
    const deckId = new Realm.BSON.ObjectId();
    old.write(() => {
      old.create("Profile", {
        _id: new Realm.BSON.ObjectId(),
        name: "Ana",
        dailyGoal: 15,
        createdAt: new Date(2026, 0, 1),
        studyTutorialSeen: true,
        themePreference: "dark",
        newCardsPerDay: 20,
      });
      const deck = old.create("Deck", { _id: deckId, name: "D", createdAt: new Date(2026, 0, 1), cards: [] });
      (deck as unknown as { cards: unknown[] }).cards.push(
        old.create("Card", { _id: cardId, front: "f", back: "b", dueDate: new Date(), createdAt: new Date() }),
      );
      old.create("ReviewLog", { cardId, deckId, grade: 2, reviewedAt: new Date() });
    });
    old.close();

    const realm = new Realm({ ...realmConfig, path });
    const profile = realm.objects<{
      name: string;
      themePreference: string;
      newCardsPerDay: number;
      lastBackupAt?: Date | null;
      previousBackupAt?: Date | null;
    }>("Profile")[0];
    expect(profile).toEqual(
      expect.objectContaining({ name: "Ana", themePreference: "dark", newCardsPerDay: 20 }),
    );
    expect(profile.lastBackupAt ?? null).toBeNull();
    expect(profile.previousBackupAt ?? null).toBeNull();
    expect(realm.objects("Deck")).toHaveLength(1);
    expect(realm.objects("Card")).toHaveLength(1);
    expect(realm.objects("ReviewLog")).toHaveLength(1);
    realm.close();
    Realm.deleteFile({ path });
  });
});

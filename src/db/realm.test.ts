import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Realm from "realm";
import { realmConfig } from "./realm";

describe("realmConfig", () => {
  it("SCH-07 uses schemaVersion 3 and opens a v1 file created with schema []", () => {
    expect(realmConfig.schemaVersion).toBe(3);

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
});

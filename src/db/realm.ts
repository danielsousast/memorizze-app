import type Realm from "realm";
import { Card, Deck, Profile, ReviewLog } from "./schemas";

export const realmConfig: Realm.Configuration = {
  path: "memorizze.realm",
  schemaVersion: 4,
  schema: [Profile, Deck, Card, ReviewLog],
  // Realm does not apply schema defaults to objects that predate a new property (MIG-01).
  onMigration: (oldRealm, newRealm) => {
    if (oldRealm.schemaVersion >= 4) return;
    for (const profile of newRealm.objects<Profile>("Profile")) {
      profile.themePreference = "system";
      profile.newCardsPerDay = 10;
    }
  },
};

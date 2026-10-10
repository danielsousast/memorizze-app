import type Realm from "realm";
import { Card, Deck, Profile, ReviewLog } from "./schemas";

export const realmConfig: Realm.Configuration = {
  path: "memorizze.realm",
  schemaVersion: 2,
  schema: [Profile, Deck, Card, ReviewLog],
};

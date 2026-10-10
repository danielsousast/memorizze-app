import Realm, { BSON } from "realm";
import type { Card } from "./card";

export class Deck extends Realm.Object<Deck> {
  _id!: BSON.ObjectId;
  name!: string;
  description?: string;
  createdAt!: Date;
  cards!: Realm.List<Card>;

  static schema: Realm.ObjectSchema = {
    name: "Deck",
    primaryKey: "_id",
    properties: {
      _id: { type: "objectId", default: () => new BSON.ObjectId() },
      name: "string",
      description: "string?",
      createdAt: "date",
      cards: "Card[]",
    },
  };
}

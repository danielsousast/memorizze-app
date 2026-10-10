import Realm, { BSON } from "realm";

export class Card extends Realm.Object<Card> {
  _id!: BSON.ObjectId;
  front!: string;
  back!: string;
  easeFactor!: number;
  intervalDays!: number;
  repetitions!: number;
  lapses!: number;
  dueDate!: Date;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: "Card",
    primaryKey: "_id",
    properties: {
      _id: { type: "objectId", default: () => new BSON.ObjectId() },
      front: "string",
      back: "string",
      easeFactor: { type: "double", default: 2.5 },
      intervalDays: { type: "int", default: 0 },
      repetitions: { type: "int", default: 0 },
      lapses: { type: "int", default: 0 },
      dueDate: { type: "date", indexed: true },
      createdAt: "date",
    },
  };
}

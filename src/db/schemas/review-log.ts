import Realm, { BSON } from "realm";

export class ReviewLog extends Realm.Object<ReviewLog> {
  _id!: BSON.ObjectId;
  cardId!: BSON.ObjectId;
  deckId!: BSON.ObjectId;
  grade!: number;
  reviewedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: "ReviewLog",
    primaryKey: "_id",
    properties: {
      _id: { type: "objectId", default: () => new BSON.ObjectId() },
      cardId: "objectId",
      deckId: "objectId",
      grade: "int",
      reviewedAt: { type: "date", indexed: true },
    },
  };
}

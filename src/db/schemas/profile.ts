import Realm, { BSON } from "realm";

export class Profile extends Realm.Object<Profile> {
  _id!: BSON.ObjectId;
  name!: string;
  dailyGoal!: number;
  createdAt!: Date;
  studyTutorialSeen!: boolean;

  static schema: Realm.ObjectSchema = {
    name: "Profile",
    primaryKey: "_id",
    properties: {
      _id: { type: "objectId", default: () => new BSON.ObjectId() },
      name: "string",
      dailyGoal: { type: "int", default: 20 },
      createdAt: "date",
      studyTutorialSeen: { type: "bool", default: false },
    },
  };
}

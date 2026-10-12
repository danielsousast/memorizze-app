import Realm, { BSON } from "realm";

export class Profile extends Realm.Object<Profile> {
  _id!: BSON.ObjectId;
  name!: string;
  dailyGoal!: number;
  createdAt!: Date;
  studyTutorialSeen!: boolean;
  themePreference!: string;
  /** 0 = no limit. */
  newCardsPerDay!: number;
  reminderEnabled!: boolean;
  reminderHour!: number;
  lastBackupAt?: Date;
  previousBackupAt?: Date;

  static schema: Realm.ObjectSchema = {
    name: "Profile",
    primaryKey: "_id",
    properties: {
      _id: { type: "objectId", default: () => new BSON.ObjectId() },
      name: "string",
      dailyGoal: { type: "int", default: 20 },
      createdAt: "date",
      studyTutorialSeen: { type: "bool", default: false },
      themePreference: { type: "string", default: "system" },
      newCardsPerDay: { type: "int", default: 10 },
      reminderEnabled: { type: "bool", default: false },
      reminderHour: { type: "int", default: 19 },
      lastBackupAt: "date?",
      previousBackupAt: "date?",
    },
  };
}

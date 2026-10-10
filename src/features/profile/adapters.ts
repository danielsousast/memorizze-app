import type { Profile as ProfileObject } from "@/db";

import type { Profile } from "./interfaces";

export function toProfile(obj: ProfileObject): Profile {
  return {
    id: obj._id.toHexString(),
    name: obj.name,
    dailyGoal: obj.dailyGoal,
    createdAt: obj.createdAt,
    studyTutorialSeen: obj.studyTutorialSeen,
  };
}

import { useRealm } from "@realm/react";
import Realm from "realm";

import { Profile as ProfileObject, ReviewLog } from "@/db";
import { addLocalDays, startOfLocalDay } from "@/domain/dates";
import { AppError } from "@/domain/errors";

import { toProfile } from "./adapters";
import type { ProfileErrorCode, ProfileRepository } from "./interfaces";

const NAME_MAX = 30;

function validName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new AppError<ProfileErrorCode>("PROFILE_NAME_EMPTY");
  if (trimmed.length > NAME_MAX) throw new AppError<ProfileErrorCode>("PROFILE_NAME_TOO_LONG");
  return trimmed;
}

export function createProfileRepository(
  realm: Realm,
  now = () => new Date(),
): ProfileRepository {
  // The oldest profile wins when legacy data holds more than one (PRF-06).
  function oldest() {
    return realm.objects(ProfileObject).sorted("createdAt")[0] ?? null;
  }

  return {
    get() {
      const profile = oldest();
      return profile ? toProfile(profile) : null;
    },

    create(name) {
      const valid = validName(name);
      const current = oldest();
      if (current) return toProfile(current);
      const createdAt = now();
      const profile = realm.write(() =>
        realm.create(ProfileObject, { name: valid, createdAt }),
      );
      return toProfile(profile);
    },

    update(input) {
      const name = input.name === undefined ? undefined : validName(input.name);
      const profile = oldest();
      if (!profile) throw new AppError<ProfileErrorCode>("PROFILE_NOT_FOUND");
      realm.write(() => {
        if (name !== undefined) profile.name = name;
        if (input.dailyGoal !== undefined) profile.dailyGoal = input.dailyGoal;
      });
      return toProfile(profile);
    },

    countReviewsToday() {
      const at = now();
      const start = startOfLocalDay(at);
      const end = startOfLocalDay(addLocalDays(at, 1));
      return realm
        .objects(ReviewLog)
        .filtered("reviewedAt >= $0 AND reviewedAt < $1", start, end).length;
    },
  };
}

export function useProfileRepository(): ProfileRepository {
  const realm = useRealm();
  return createProfileRepository(realm);
}

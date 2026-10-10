import { useRealm } from "@realm/react";
import Realm from "realm";

import { Card, Deck, Profile as ProfileObject, ReviewLog } from "@/db";
import { addLocalDays, startOfLocalDay } from "@/domain/dates";
import { AppError } from "@/domain/errors";
import { THEME_OPTIONS, isNewCardsLimit, limitToStored } from "@/domain/preferences";
import { accuracy, dailyCounts, stageCounts } from "@/domain/stats";
import { currentStreak, longestStreak } from "@/domain/streak";

import { toProfile } from "./adapters";
import type { ProfileErrorCode, ProfileInput, ProfileRepository } from "./interfaces";

const NAME_MAX = 30;

function validName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new AppError<ProfileErrorCode>("PROFILE_NAME_EMPTY");
  if (trimmed.length > NAME_MAX) throw new AppError<ProfileErrorCode>("PROFILE_NAME_TOO_LONG");
  return trimmed;
}

function validPreferences(input: ProfileInput) {
  const { themePreference, newCardsPerDay } = input;
  if (themePreference !== undefined && !THEME_OPTIONS.includes(themePreference)) {
    throw new AppError<ProfileErrorCode>("PROFILE_PREFERENCE_INVALID");
  }
  if (newCardsPerDay !== undefined && !isNewCardsLimit(newCardsPerDay)) {
    throw new AppError<ProfileErrorCode>("PROFILE_PREFERENCE_INVALID");
  }
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
      validPreferences(input);
      const profile = oldest();
      if (!profile) throw new AppError<ProfileErrorCode>("PROFILE_NOT_FOUND");
      realm.write(() => {
        if (name !== undefined) profile.name = name;
        if (input.dailyGoal !== undefined) profile.dailyGoal = input.dailyGoal;
        if (input.studyTutorialSeen !== undefined) profile.studyTutorialSeen = input.studyTutorialSeen;
        if (input.themePreference !== undefined) profile.themePreference = input.themePreference;
        if (input.newCardsPerDay !== undefined) {
          profile.newCardsPerDay = limitToStored(input.newCardsPerDay);
        }
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

    stats() {
      const at = now();
      const logs = realm.objects(ReviewLog).map((l) => ({ date: l.reviewedAt, grade: l.grade }));
      const dates = logs.map((l) => l.date);
      return {
        currentStreak: currentStreak(dates, at),
        longestStreak: longestStreak(dates),
        accuracy7: accuracy(logs, at, 7),
        accuracy30: accuracy(logs, at, 30),
        week: dailyCounts(dates, at, 7),
        stages: stageCounts([...realm.objects(Card)]),
      };
    },

    dataCounts() {
      return { decks: realm.objects(Deck).length, cards: realm.objects(Card).length };
    },

    // One transaction: it either erases everything or nothing (SOUT-04).
    wipe() {
      realm.write(() => realm.deleteAll());
    },
  };
}

export function useProfileRepository(): ProfileRepository {
  const realm = useRealm();
  return createProfileRepository(realm);
}

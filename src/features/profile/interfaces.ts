export type Profile = {
  id: string;
  name: string;
  dailyGoal: number;
  createdAt: Date;
};

export type ProfileErrorCode =
  | "PROFILE_NAME_EMPTY"
  | "PROFILE_NAME_TOO_LONG"
  | "PROFILE_NOT_FOUND";

export type ProfileInput = { name?: string; dailyGoal?: number };

export type ProfileStats = {
  currentStreak: number;
  longestStreak: number;
  accuracy7: number | null;
  accuracy30: number | null;
  week: number[];
  stages: { new: number; learning: number; mature: number };
};

export type ProfileRepository = {
  get(): Profile | null;
  create(name: string): Profile;
  update(input: ProfileInput): Profile;
  countReviewsToday(): number;
  stats(): ProfileStats;
};

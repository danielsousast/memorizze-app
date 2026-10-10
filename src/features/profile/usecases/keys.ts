export const profileKeys = {
  all: ["profile"] as const,
  profile: ["profile", "current"] as const,
  stats: ["profile", "stats"] as const,
  reviewsToday: ["profile", "reviews-today"] as const,
};

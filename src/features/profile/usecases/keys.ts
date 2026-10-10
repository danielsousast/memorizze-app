export const profileKeys = {
  all: ["profile"] as const,
  profile: ["profile", "current"] as const,
  reviewsToday: ["profile", "reviews-today"] as const,
};

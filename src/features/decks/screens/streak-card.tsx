import { useFocusEffect } from "expo-router";
import { useCallback, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GoalProgress } from "@/components/goal-progress/goal-progress";
import { Icon } from "@/components/icon/icon";
import { streakSubtitle, streakTitle } from "@/domain/labels";
import { useReviewsToday, useProfile } from "@/features/profile";
import { useStreak } from "@/features/study";
import { radii, screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

const DEFAULT_GOAL = 20;

export function StreakCard({ children }: { children?: ReactNode }) {
  const { colors } = useTheme();
  const streakQuery = useStreak();
  const reviewsQuery = useReviewsToday();
  const streak = streakQuery.data ?? 0;
  const reviewsToday = reviewsQuery.data ?? 0;
  const { refetch: refetchStreak } = streakQuery;
  const { refetch: refetchReviews } = reviewsQuery;

  // HOM-07: numbers follow the recorded reviews and the local day whenever the screen refocuses.
  useFocusEffect(
    useCallback(() => {
      void refetchStreak();
      void refetchReviews();
    }, [refetchStreak, refetchReviews]),
  );
  const goal = useProfile().data?.dailyGoal ?? DEFAULT_GOAL;

  return (
    <View
      testID="streak-card"
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.top}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: streak > 0 ? colors.accentSoft : colors.surface2,
            },
          ]}
        >
          <Icon name="flame" size={24} color={streak > 0 ? colors.accent : colors.text2} />
        </View>
        <View style={styles.topText}>
          <Text style={[typography.title, styles.title, { color: colors.text }]}>
            {streakTitle(streak)}
          </Text>
          <Text style={[typography.caption, { color: colors.text2 }]}>
            {streakSubtitle(streak, reviewsToday > 0)}
          </Text>
        </View>
      </View>
      <GoalProgress done={reviewsToday} goal={goal} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: screenMargin,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    borderRadius: radii.studyCard,
    borderWidth: 1,
  },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  icon: {
    width: sizes.deckIcon + spacing.md,
    height: sizes.deckIcon + spacing.md,
    borderRadius: radii.icon,
    alignItems: "center",
    justifyContent: "center",
  },
  topText: { flex: 1 },
  title: { fontSize: 26, lineHeight: 32 },
});

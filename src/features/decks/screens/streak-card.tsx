import { StyleSheet, Text, View } from "react-native";

import { GoalProgress } from "@/components/goal-progress";
import { Icon } from "@/components/icon";
import { plural } from "@/domain/text";
import { useReviewsToday, useProfile } from "@/features/profile";
import { useStreak } from "@/features/study";
import { radii, screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

const DEFAULT_GOAL = 20;

function subtitle(streak: number, reviewedToday: boolean): string {
  if (streak === 0) return "Sua sequência começa no primeiro estudo";
  if (reviewedToday) return "Você já estudou hoje";
  return `Estude hoje para chegar a ${streak + 1}`;
}

export function StreakCard() {
  const { colors } = useTheme();
  const streak = useStreak().data ?? 0;
  const reviewsToday = useReviewsToday().data ?? 0;
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
          <Text style={[typography.title, { color: colors.text }]}>
            {plural(streak, "dia seguido", "dias seguidos")}
          </Text>
          <Text style={[typography.caption, { color: colors.text2 }]}>
            {subtitle(streak, reviewsToday > 0)}
          </Text>
        </View>
      </View>
      <GoalProgress done={reviewsToday} goal={goal} />
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
});

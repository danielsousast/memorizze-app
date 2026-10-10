import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GoalProgress } from "@/components/goal-progress";
import { Icon } from "@/components/icon";
import { Screen } from "@/components/screen";
import { formatMonthYear } from "@/domain/dates";
import { canStep, stepGoal } from "@/domain/goal";
import {
  radii,
  screenMargin,
  sizes,
  spacing,
  typography,
  useTheme,
} from "@/theme";

import { useProfile } from "../usecases/use-profile";
import { useReviewsToday } from "../usecases/use-reviews-today";
import { useStats } from "../usecases/use-stats";
import { useUpdateProfile } from "../usecases/use-update-profile";
import { GENERIC_ERROR } from "./name-errors";
import { StatsSection } from "./stats-section";

function StepButton({
  label,
  icon,
  disabled,
  onPress,
}: {
  label: string;
  icon: "minus" | "plus";
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.step, { backgroundColor: colors.surface2, opacity: disabled ? 0.5 : 1 }]}
    >
      <Icon name={icon} color={colors.text} />
    </Pressable>
  );
}

export function ProfileScreen() {
  const { colors } = useTheme();
  const profile = useProfile().data;
  const reviewsQuery = useReviewsToday();
  const reviewsToday = reviewsQuery.data ?? 0;
  const { refetch: refetchReviews } = reviewsQuery;
  const statsQuery = useStats();
  const { refetch: refetchStats } = statsQuery;
  const update = useUpdateProfile();
  const [error, setError] = useState<string>();
  const busy = useRef(false);

  // HOM-07: numbers follow the recorded reviews whenever the screen refocuses.
  useFocusEffect(
    useCallback(() => {
      void refetchReviews();
      void refetchStats();
    }, [refetchReviews, refetchStats]),
  );

  async function step(direction: 1 | -1) {
    if (!profile || busy.current) return;
    busy.current = true;
    setError(undefined);
    try {
      await update.mutateAsync({ dailyGoal: stepGoal(profile.dailyGoal, direction) });
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      busy.current = false;
    }
  }

  return (
    <Screen testID="profile-screen" style={styles.body}>
      <Text
        accessibilityRole="header"
        style={[typography.title, { color: colors.text }]}
      >
        Perfil
      </Text>
      {profile ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar nome, ${profile.name}`}
            onPress={() => router.push("/edit-name")}
            style={styles.identity}
          >
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={[typography.title, { color: colors.onAccent }]}>
                {profile.name.charAt(0).toLocaleUpperCase("pt-BR")}
              </Text>
            </View>
            <View style={styles.identityText}>
              <Text
                numberOfLines={1}
                style={[typography.section, { color: colors.text }]}
              >
                {profile.name}
              </Text>
              <Text style={[typography.body, { color: colors.text2 }]}>
                {`Estudando desde ${formatMonthYear(profile.createdAt)}`}
              </Text>
            </View>
          </Pressable>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.goalTop}>
              <View>
                <Text style={[typography.button, { color: colors.text }]}>
                  Meta diária
                </Text>
                <Text style={[typography.caption, { color: colors.text2 }]}>
                  revisões por dia
                </Text>
              </View>
              <View style={styles.stepper}>
                <StepButton
                  label="Diminuir meta"
                  icon="minus"
                  disabled={!canStep(profile.dailyGoal, -1)}
                  onPress={() => step(-1)}
                />
                <Text
                  accessibilityLabel={`Meta diária, ${profile.dailyGoal} revisões por dia`}
                  style={[typography.section, styles.value, { color: colors.text }]}
                >
                  {profile.dailyGoal}
                </Text>
                <StepButton
                  label="Aumentar meta"
                  icon="plus"
                  disabled={!canStep(profile.dailyGoal, 1)}
                  onPress={() => step(1)}
                />
              </View>
            </View>
            {error ? (
              <Text
                accessibilityRole="alert"
                style={[typography.caption, { color: colors.grade.again.text }]}
              >
                {error}
              </Text>
            ) : null}
            <GoalProgress
              done={reviewsToday}
              goal={profile.dailyGoal}
              label="Revisões hoje"
              suffix=""
            />
          </View>
          {statsQuery.data ? (
            <StatsSection stats={statsQuery.data} dailyGoal={profile.dailyGoal} />
          ) : statsQuery.isError ? (
            <Text style={[typography.body, { color: colors.text2 }]}>
              Não foi possível carregar as estatísticas.
            </Text>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: screenMargin, gap: spacing.xl },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: {
    width: sizes.fab + spacing.xl,
    height: sizes.fab + spacing.xl,
    borderRadius: radii.studyCard,
    alignItems: "center",
    justifyContent: "center",
  },
  identityText: { flex: 1 },
  card: {
    padding: spacing.lg,
    gap: spacing.lg,
    borderRadius: radii.studyCard,
    borderWidth: 1,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  step: {
    width: sizes.minTouch,
    height: sizes.minTouch,
    borderRadius: radii.icon,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { minWidth: 40, textAlign: "center" },
  goalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

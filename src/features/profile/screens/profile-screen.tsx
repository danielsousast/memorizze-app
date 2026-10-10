import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GoalProgress } from "@/components/goal-progress";
import { Screen } from "@/components/screen";
import { formatMonthYear } from "@/domain/dates";
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

export function ProfileScreen() {
  const { colors } = useTheme();
  const profile = useProfile().data;
  const reviewsToday = useReviewsToday().data ?? 0;

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
              <Text style={[typography.section, { color: colors.text }]}>
                {profile.dailyGoal}
              </Text>
            </View>
            <GoalProgress
              done={reviewsToday}
              goal={profile.dailyGoal}
              label="Revisões hoje"
              suffix=""
            />
          </View>
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
  goalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

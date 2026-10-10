import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { Edge } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { GoalProgress } from "@/components/goal-progress";
import { Icon } from "@/components/icon";
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

import type { ProfileStats } from "../interfaces";
import { StatsSection } from "./stats-section";
import { useProfileScreen } from "./use-profile-screen";

const TOP_EDGE: Edge[] = ["top"];

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
      style={[
        styles.step,
        { backgroundColor: colors.surface2, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Icon name={icon} color={colors.text} />
    </Pressable>
  );
}

function StatsBlock({
  stats,
  failed,
  dailyGoal,
}: {
  stats?: ProfileStats;
  failed: boolean;
  dailyGoal: number;
}) {
  const { colors } = useTheme();
  if (stats) return <StatsSection stats={stats} dailyGoal={dailyGoal} />;
  if (!failed) return null;
  return (
    <Text style={[typography.body, { color: colors.text2 }]}>
      Não foi possível carregar as estatísticas.
    </Text>
  );
}

export function ProfileScreen() {
  const { colors } = useTheme();
  const {
    profile,
    reviewsToday,
    stats,
    statsError,
    error,
    canDecrease,
    canIncrease,
    decrease,
    increase,
    editName,
    openSettings,
    signOutOpen,
    signOutMessage,
    requestSignOut,
    cancelSignOut,
    confirmSignOut,
  } = useProfileScreen();

  return (
    <Screen testID="profile-screen" edges={TOP_EDGE}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            style={[typography.title, { color: colors.text }]}
          >
            Perfil
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Configurações"
            onPress={openSettings}
            style={[styles.gear, { backgroundColor: colors.surface }]}
          >
            <Icon name="gear" size={22} color={colors.text} />
          </Pressable>
        </View>
        {profile ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar nome, ${profile.name}`}
              onPress={editName}
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
                    disabled={!canDecrease}
                    onPress={decrease}
                  />
                  <Text
                    accessibilityLabel={`Meta diária, ${profile.dailyGoal} revisões por dia`}
                    style={[
                      typography.section,
                      styles.value,
                      { color: colors.text },
                    ]}
                  >
                    {profile.dailyGoal}
                  </Text>
                  <StepButton
                    label="Aumentar meta"
                    icon="plus"
                    disabled={!canIncrease}
                    onPress={increase}
                  />
                </View>
              </View>
              {error ? (
                <Text
                  accessibilityRole="alert"
                  style={[
                    typography.caption,
                    { color: colors.grade.again.text },
                  ]}
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
            <StatsBlock
              stats={stats}
              failed={statsError}
              dailyGoal={profile.dailyGoal}
            />
            <View style={styles.signOut}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sair"
                onPress={requestSignOut}
                style={[
                  styles.signOutButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Icon name="sign-out" color={colors.grade.again.text} />
                <Text style={[typography.button, { color: colors.grade.again.text }]}>
                  Sair
                </Text>
              </Pressable>
              <Text style={[typography.caption, styles.signOutNote, { color: colors.text2 }]}>
                Apaga seus baralhos e progresso deste aparelho.
              </Text>
            </View>
          </>
        ) : null}
        <ConfirmDialog
          visible={signOutOpen}
          icon="sign-out"
          tone="destructive"
          title="Sair e apagar dados?"
          message={signOutMessage}
          confirmLabel="Apagar e sair"
          onConfirm={confirmSignOut}
          onCancel={cancelSignOut}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: screenMargin,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gear: {
    width: sizes.minTouch,
    height: sizes.minTouch,
    borderRadius: radii.icon,
    alignItems: "center",
    justifyContent: "center",
  },
  signOut: { gap: spacing.md },
  signOutButton: {
    minHeight: sizes.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.studyCard,
    borderWidth: 1,
  },
  signOutNote: { textAlign: "center" },
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

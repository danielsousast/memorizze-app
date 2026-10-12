import { StyleSheet, Text, View } from "react-native";

import { t } from "@/lib/i18n";
import { radii, sizes, spacing, typography, useTheme } from "@/theme";

type Props = {
  done: number;
  goal: number;
  /** Row title; defaults to `Meta diária`. */
  label?: string;
  /** Text after `done de goal`; defaults to ` revisões`. */
  suffix?: string;
};

/** Daily goal bar: `done de goal revisões`, filled in `min(done, goal) / goal`. */
export function GoalProgress({
  done,
  goal,
  label,
  suffix,
}: Props) {
  const { colors } = useTheme();
  const ratio = goal > 0 ? Math.min(done, goal) / goal : 0;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Text style={[typography.button, { color: colors.text }]}>{label ?? t("common.goalTitle")}</Text>
        <Text style={[typography.caption, { color: colors.text2 }]}>
          {t("common.goalProgress", { done, goal, suffix: suffix ?? t("common.goalSuffix") })}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
        <View
          testID="goal-progress-bar"
          style={[
            styles.fill,
            { width: `${ratio * 100}%`, backgroundColor: colors.accent },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  track: {
    height: sizes.progressGoal,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radii.pill },
});

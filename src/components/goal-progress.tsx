import { StyleSheet, Text, View } from "react-native";

import { radii, sizes, spacing, typography, useTheme } from "@/theme";

type Props = { done: number; goal: number };

/** Daily goal bar: `done de goal revisões`, filled in `min(done, goal) / goal`. */
export function GoalProgress({ done, goal }: Props) {
  const { colors } = useTheme();
  const ratio = goal > 0 ? Math.min(done, goal) / goal : 0;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Text style={[typography.button, { color: colors.text }]}>Meta diária</Text>
        <Text style={[typography.caption, { color: colors.text2 }]}>
          {`${done} de ${goal} revisões`}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
        <View
          testID="goal-progress-bar"
          style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: colors.accent }]}
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

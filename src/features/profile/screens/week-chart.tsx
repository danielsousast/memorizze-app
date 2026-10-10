import { StyleSheet, Text, View } from "react-native";

import { addLocalDays, formatWeekdayShort } from "@/domain/dates";
import { plural } from "@/domain/text";
import { radii, spacing, tabularNums, typography, useTheme } from "@/theme";

const CHART_HEIGHT = 120;
const MIN_BAR = 6;

type Props = { week: number[]; dailyGoal: number; now?: Date };

export function WeekChart({ week, dailyGoal, now = new Date() }: Props) {
  const { colors } = useTheme();
  const scale = Math.max(dailyGoal, ...week);
  const last = week.length - 1;
  const labels = week.map((_, i) =>
    i === last ? "Hoje" : formatWeekdayShort(addLocalDays(now, i - last)),
  );
  const total = week.reduce((sum, n) => sum + n, 0);
  const summary = week.map((n, i) => `${labels[i]} ${n}`).join(", ");
  const goalBottom = (dailyGoal / scale) * CHART_HEIGHT;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[typography.section, { color: colors.text }]}>Últimos 7 dias</Text>
        <Text style={[typography.caption, { color: colors.text2 }]}>
          {plural(total, "revisão", "revisões")}
        </Text>
      </View>
      <View
        accessible
        accessibilityLabel={`Últimos 7 dias: ${summary}`}
        style={styles.chart}
      >
        <View style={styles.bars} importantForAccessibility="no-hide-descendants">
          {week.map((n, i) => {
            const today = i === last;
            return (
              <View key={i} style={styles.column}>
                <Text
                  testID={`value-${i}`}
                  style={[typography.caption, tabularNums, { color: today ? colors.accent : colors.text2 }]}
                >
                  {n}
                </Text>
                <View
                  testID={`bar-${i}`}
                  style={[
                    styles.bar,
                    {
                      height: Math.max(MIN_BAR, (n / scale) * CHART_HEIGHT),
                      backgroundColor: today ? colors.accent : colors.accentSoft,
                    },
                  ]}
                />
                <Text
                  testID={`label-${i}`}
                  style={[typography.caption, { color: today ? colors.accent : colors.text2 }]}
                >
                  {labels[i]}
                </Text>
              </View>
            );
          })}
          <View pointerEvents="none" style={[styles.goal, { bottom: goalBottom + LABEL_BLOCK }]}>
            <View style={[styles.goalLine, { borderColor: colors.border }]} />
            <Text style={[typography.caption, { color: colors.text2 }]}>{`meta ${dailyGoal}`}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const LABEL_BLOCK = 20 + spacing.xs;

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: radii.studyCard, borderWidth: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chart: { justifyContent: "flex-end" },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, minHeight: CHART_HEIGHT + 44 },
  column: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: spacing.xs },
  bar: { alignSelf: "stretch", borderRadius: radii.icon },
  goal: { position: "absolute", left: 0, right: 0, alignItems: "flex-end" },
  goalLine: { alignSelf: "stretch", borderTopWidth: 1, borderStyle: "dotted" },
});

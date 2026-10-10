import { StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { daysLabel as days } from "@/domain/labels";
import { radii, spacing, typography, useTheme } from "@/theme";

import type { ProfileStats } from "../interfaces";
import { StageBar } from "./stage-bar";
import { WeekChart } from "./week-chart";

type TileProps = {
  value: string;
  label: string;
  accessibilityLabel: string;
  highlighted?: boolean;
};

function Tile({ value, label, accessibilityLabel, highlighted }: TileProps) {
  const { colors } = useTheme();
  const valueColor = highlighted ? colors.accentInk : colors.text;
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.tile,
        {
          backgroundColor: highlighted ? colors.accentSoft : colors.surface,
          borderColor: highlighted ? colors.accentSoft : colors.border,
        },
      ]}
    >
      <View style={styles.value}>
        {highlighted ? <Icon name="flame" size={24} color={colors.accent} /> : null}
        <Text style={[typography.display, styles.valueText, { color: valueColor }]}>{value}</Text>
      </View>
      <Text
        style={[typography.caption, { color: highlighted ? colors.accentInk : colors.text2 }]}
      >
        {label}
      </Text>
    </View>
  );
}

export function StatsSection({ stats, dailyGoal }: { stats: ProfileStats; dailyGoal: number }) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <Tile
          highlighted
          value={days(stats.currentStreak)}
          label="Sequência atual"
          accessibilityLabel={`Sequência atual, ${days(stats.currentStreak)}`}
        />
        <Tile
          value={days(stats.longestStreak)}
          label="Maior sequência"
          accessibilityLabel={`Maior sequência, ${days(stats.longestStreak)}`}
        />
      </View>
      <WeekChart week={stats.week} dailyGoal={dailyGoal} />
      <StageBar stages={stats.stages} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  tile: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xs,
    borderRadius: radii.studyCard,
    borderWidth: 1,
  },
  valueText: { fontSize: 28, lineHeight: 34 },
  value: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});

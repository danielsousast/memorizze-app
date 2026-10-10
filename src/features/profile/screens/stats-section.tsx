import { StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { plural } from "@/domain/text";
import { radii, spacing, typography, useTheme } from "@/theme";

import type { ProfileStats } from "../interfaces";
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
        <Text style={[typography.display, { color: valueColor }]}>{value}</Text>
      </View>
      <Text
        style={[typography.caption, { color: highlighted ? colors.accentInk : colors.text2 }]}
      >
        {label}
      </Text>
    </View>
  );
}

const days = (n: number) => plural(n, "dia", "dias");
const percent = (n: number | null) => (n === null ? "—" : `${n}%`);

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
      <View style={styles.row}>
        <Tile
          value={percent(stats.accuracy7)}
          label="Acerto · 7 dias"
          accessibilityLabel={`Acerto 7 dias, ${percent(stats.accuracy7)}`}
        />
        <Tile
          value={percent(stats.accuracy30)}
          label="Acerto · 30 dias"
          accessibilityLabel={`Acerto 30 dias, ${percent(stats.accuracy30)}`}
        />
      </View>
      <WeekChart week={stats.week} dailyGoal={dailyGoal} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.md },
  tile: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xs,
    borderRadius: radii.studyCard,
    borderWidth: 1,
  },
  value: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});

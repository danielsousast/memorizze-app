import { StyleSheet, Text, View } from "react-native";

import { radii, spacing, tabularNums, typography, useTheme } from "@/theme";

import type { ProfileStats } from "../interfaces";

type Stage = keyof ProfileStats["stages"];

const STAGES: { key: Stage; label: string; a11y: string; opacity: number }[] = [
  { key: "new", label: "Novos", a11y: "Cartões novos", opacity: 0.25 },
  { key: "learning", label: "Aprendendo", a11y: "Cartões aprendendo", opacity: 0.6 },
  { key: "mature", label: "Maduros", a11y: "Cartões maduros", opacity: 1 },
];

export function StageBar({ stages }: { stages: ProfileStats["stages"] }) {
  const { colors } = useTheme();
  const total = stages.new + stages.learning + stages.mature;

  return (
    <View
      testID="stage-card"
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <Text style={[typography.section, { color: colors.text }]}>Seus cartões</Text>
        <Text style={[typography.caption, { color: colors.text2 }]}>{`${total} no total`}</Text>
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        style={[styles.bar, { backgroundColor: colors.surface2 }]}
      >
        {STAGES.filter(({ key }) => stages[key] > 0).map(({ key, opacity }) => (
          <View
            key={key}
            testID={`segment-${key}`}
            style={[
              styles.segment,
              { flex: stages[key], backgroundColor: colors.accent, opacity },
            ]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {STAGES.map(({ key, label, a11y, opacity }) => (
          <View
            key={key}
            accessible
            accessibilityLabel={`${a11y}, ${stages[key]}`}
            style={styles.item}
          >
            <View style={styles.name}>
              <View style={[styles.swatch, { backgroundColor: colors.accent, opacity }]} />
              <Text style={[typography.caption, { color: colors.text2 }]}>{label}</Text>
            </View>
            <Text style={[typography.section, tabularNums, { color: colors.text }]}>
              {stages[key]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: radii.studyCard, borderWidth: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bar: { flexDirection: "row", gap: spacing.xs, height: 12, borderRadius: 6, overflow: "hidden" },
  segment: { borderRadius: 6 },
  legend: { flexDirection: "row", justifyContent: "space-between" },
  item: { gap: spacing.xs },
  name: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  swatch: { width: 12, height: 12, borderRadius: 3 },
});

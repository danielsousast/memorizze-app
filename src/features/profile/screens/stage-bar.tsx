import { StyleSheet, Text, View } from "react-native";

import { t } from "@/lib/i18n";
import { radii, spacing, tabularNums, typography, useTheme } from "@/theme";

import type { ProfileStats } from "../interfaces";

type Stage = keyof ProfileStats["stages"];

const STAGES: { key: Stage; opacity: number }[] = [
  { key: "new", opacity: 0.25 },
  { key: "learning", opacity: 0.6 },
  { key: "mature", opacity: 1 },
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
        <Text style={[typography.section, { color: colors.text }]}>{t("profile.yourCards")}</Text>
        <Text style={[typography.caption, { color: colors.text2 }]}>{t("profile.total", { count: total })}</Text>
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
        {STAGES.map(({ key, opacity }) => (
          <View
            key={key}
            accessible
            accessibilityLabel={t("profile.labelA11y", {
              label: t(`profile.stages.${key}.a11y`),
              value: stages[key],
            })}
            style={styles.item}
          >
            <View style={styles.name}>
              <View style={[styles.swatch, { backgroundColor: colors.accent, opacity }]} />
              <Text style={[typography.caption, { color: colors.text2 }]}>{t(`profile.stages.${key}.label`)}</Text>
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

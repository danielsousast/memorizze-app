import { router } from "expo-router";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { cardStage, stageLabel } from "@/domain/stage";
import type { Card } from "@/features/cards";
import { radii, sizes, spacing, typography, useTheme } from "@/theme";

export function CardRow({ card }: { card: Card }) {
  const { colors } = useTheme();
  const stage = cardStage(card);
  const open = useCallback(() => {
    router.push(`/cards/${card.id}/edit`);
  }, [card.id]);
  return (
    <Pressable
      testID="card-row"
      accessibilityRole="button"
      accessibilityLabel={`${card.front}, ${card.back.replace(/\s*\r?\n\s*/g, " ")}`}
      onPress={open}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.rowText}>
        <Text
          testID="card-front"
          numberOfLines={1}
          style={[typography.button, { color: colors.text }]}
        >
          {card.front}
        </Text>
        <Text numberOfLines={1} style={[typography.caption, { color: colors.text2 }]}>
          {card.back.replace(/\s*\r?\n\s*/g, " ")}
        </Text>
      </View>
      <Badge tone={stage === "new" ? "accent" : "neutral"} text={stageLabel[stage]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: sizes.deckCard,
    paddingHorizontal: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    marginBottom: spacing.sm,
  },
  rowText: { flex: 1 },
});

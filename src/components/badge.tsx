import { StyleSheet, Text, View } from "react-native";

import { radii, spacing, typography, useTheme } from "@/theme";

import { Icon, type IconName } from "./icon";

export type BadgeTone = "accent" | "neutral" | "outline";

type Props = { text: string; tone?: BadgeTone; icon?: IconName };

export function Badge({ text, tone = "neutral", icon }: Props) {
  const { colors } = useTheme();
  const palette = {
    accent: { bg: colors.accentSoft, fg: colors.accentInk, border: colors.accentSoft },
    neutral: { bg: colors.surface2, fg: colors.text2, border: colors.surface2 },
    outline: { bg: colors.surface, fg: colors.text, border: colors.border },
  }[tone];

  return (
    <View style={[styles.base, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      {icon ? <Icon name={icon} size={12} color={palette.fg} /> : null}
      <Text style={[typography.caption, { color: palette.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 24,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
});

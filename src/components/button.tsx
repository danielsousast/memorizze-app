import { Pressable, StyleSheet, Text } from "react-native";

import { radii, sizes, spacing, typography, useTheme } from "@/theme";

import { Icon, type IconName } from "./icon";

export type ButtonVariant = "primary" | "secondary" | "text" | "danger" | "destructive";

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: IconName;
};

export function Button({ label, onPress, variant = "primary", disabled = false, icon }: Props) {
  const { colors } = useTheme();
  const palette = {
    primary: { bg: colors.accent, fg: colors.onAccent, border: colors.accent },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
    text: { bg: "transparent", fg: colors.accentInk, border: "transparent" },
    danger: { bg: colors.grade.again.background, fg: colors.grade.again.text, border: colors.grade.again.background },
    destructive: { bg: colors.grade.again.text, fg: colors.onAccent, border: colors.grade.again.text },
  }[variant];
  const bg = disabled && variant !== "text" ? colors.surface2 : palette.bg;
  const fg = disabled ? colors.text2 : palette.fg;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        { backgroundColor: bg, borderColor: disabled ? colors.surface2 : palette.border },
      ]}
    >
      {icon ? <Icon name={icon} color={fg} /> : null}
      <Text style={[typography.button, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.button,
    borderRadius: radii.button,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
});

import { Pressable, StyleSheet, Text, View } from "react-native";

import { sizes, spacing, typography, useTheme } from "@/theme";

import { Icon } from "./icon";

type Props = {
  title: string;
  subtitle?: string;
  value?: string;
  disabled?: boolean;
  onPress: () => void;
};

export function SettingsRow({ title, subtitle, value, disabled = false, onPress }: Props) {
  const { colors } = useTheme();
  const accessibilityLabel = value ? `${title}, ${value}` : title;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View style={styles.text}>
        <Text style={[typography.button, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.caption, { color: colors.text2 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {value ? <Text style={[typography.button, { color: colors.text2 }]}>{value}</Text> : null}
      <Icon name="chevron-right" size={18} color={colors.text2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.minTouch + spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: { flex: 1 },
  disabled: { opacity: 0.4 },
});

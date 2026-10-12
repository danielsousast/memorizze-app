import { StyleSheet, Switch, Text, View } from "react-native";

import { sizes, spacing, typography, useTheme } from "@/theme";

type Props = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function SettingsSwitchRow({ title, subtitle, value, onValueChange }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[typography.button, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.caption, { color: colors.text2 }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Switch
        accessibilityRole="switch"
        accessibilityLabel={title}
        accessibilityState={{ checked: value }}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
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
});

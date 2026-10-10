import { Pressable, StyleSheet, Text } from "react-native";

import { radii, sizes, spacing, typography, useTheme } from "@/theme";

import { Icon } from "./icon";

type Props = {
  label: string;
  onPress: () => void;
  /** Extended form: text shown next to the plus icon. */
  text?: string;
};

export function Fab({ label, onPress, text }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.base,
        { backgroundColor: colors.accent, shadowColor: colors.accent },
        text ? styles.extended : styles.round,
      ]}
    >
      <Icon name="plus" size={24} color={colors.onAccent} />
      {text ? <Text style={[typography.button, { color: colors.onAccent }]}>{text}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.fab,
    borderRadius: radii.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  round: { width: sizes.fab },
  extended: { paddingHorizontal: spacing.xl },
});

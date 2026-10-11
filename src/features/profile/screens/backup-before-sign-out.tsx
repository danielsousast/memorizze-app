import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { radii, spacing, typography, useTheme } from "@/theme";

type Props = { subtitle: string; onPress: () => void };

export function BackupBeforeSignOut({ subtitle, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Fazer backup antes"
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.accentSoft }]}
    >
      <Icon name="download" size={22} color={colors.accentInk} />
      <View style={styles.texts}>
        <Text style={[typography.button, { color: colors.accentInk }]}>Fazer backup antes</Text>
        <Text style={[typography.caption, { color: colors.accentInk }]}>{subtitle}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors.accentInk} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.icon,
  },
  texts: { flex: 1 },
});

import { Pressable, StyleSheet, Text } from "react-native";

import { Icon } from "@/components/icon";
import { spacing, typography, useTheme } from "@/theme";

export function BackupBeforeSignOut({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Fazer backup antes"
      onPress={onPress}
      style={styles.link}
    >
      <Icon name="download" size={16} color={colors.accentInk} />
      <Text style={[typography.caption, { color: colors.accentInk }]}>Fazer backup antes</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
});

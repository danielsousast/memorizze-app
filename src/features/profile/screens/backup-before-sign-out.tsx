import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { spacing, typography, useTheme } from "@/theme";

type Props = { subtitle: string; onPress: () => void };

export function BackupBeforeSignOut({ subtitle, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Fazer backup antes"
      onPress={onPress}
      style={styles.link}
    >
      <View style={styles.label}>
        <Icon name="download" size={16} color={colors.accentInk} />
        <Text style={[typography.caption, { color: colors.accentInk }]}>Fazer backup antes</Text>
      </View>
      <Text style={[typography.caption, { color: colors.text2 }]}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.xs },
  label: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
});

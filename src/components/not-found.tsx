import { StyleSheet, Text, View } from "react-native";

import { t } from "@/lib/i18n";
import { screenMargin, spacing, typography, useTheme } from "@/theme";

import { Button } from "./button";

type Props = { title: string; actionLabel?: string; onAction: () => void };

export function NotFound({ title, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[typography.section, { color: colors.text }]}>{title}</Text>
      <Button label={actionLabel ?? t("common.back")} onPress={onAction} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    padding: screenMargin,
  },
});

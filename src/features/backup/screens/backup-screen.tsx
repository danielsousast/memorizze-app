import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { Screen } from "@/components/screen";
import { radii, screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

import { useBackupScreen } from "./use-backup-screen";

const TOP_EDGE: Edge[] = ["top"];

export function BackupScreen() {
  const { colors } = useTheme();
  const backup = useBackupScreen();
  const card = { backgroundColor: colors.surface, borderColor: colors.border };
  const badge = { backgroundColor: backup.hasBackup ? colors.grade.good.background : colors.surface2 };

  return (
    <Screen testID="backup-screen" edges={TOP_EDGE}>
      <ScrollView contentContainerStyle={styles.body}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajustes"
          onPress={backup.goBack}
          style={styles.back}
        >
          <Icon name="chevron-left" size={20} color={colors.accentInk} />
          <Text style={[typography.button, { color: colors.accentInk }]}>Ajustes</Text>
        </Pressable>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
            Backup
          </Text>
          <Text style={[typography.body, { color: colors.text2 }]}>
            Seus dados ficam só neste aparelho. Exporte um arquivo para guardar ou levar para outro
            celular.
          </Text>
        </View>

        <View style={[styles.card, card]}>
          <View style={styles.status}>
            <View style={[styles.badge, badge]}>
              {backup.hasBackup ? (
                <Icon name="check" size={22} color={colors.grade.good.text} />
              ) : null}
            </View>
            <View style={styles.statusText}>
              <Text style={[typography.button, { color: colors.text }]}>{backup.statusLabel}</Text>
              {backup.previousLabel ? (
                <Text style={[typography.caption, { color: colors.text2 }]}>
                  {backup.previousLabel}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.stats}>
            {backup.stats.map((stat) => (
              <View key={stat.label} style={[styles.stat, { backgroundColor: colors.surface2 }]}>
                <Text style={[typography.button, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[typography.caption, { color: colors.text2 }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.action}>
          <Button label="Exportar backup" icon="upload" disabled={backup.busy} onPress={backup.onExport} />
          <Text style={[typography.caption, styles.hint, { color: colors.text2 }]}>
            {backup.exportHint}
          </Text>
        </View>
        <View style={styles.action}>
          <Button
            label="Importar backup"
            icon="download"
            variant="secondary"
            disabled={backup.busy}
            onPress={backup.onImport}
          />
          <Text style={[typography.caption, styles.hint, { color: colors.text2 }]}>
            Substitui os dados atuais pelos do arquivo.
          </Text>
        </View>
      </ScrollView>
      <ConfirmDialog
        icon="download"
        tone="destructive"
        title="Importar backup?"
        confirmLabel="Substituir"
        {...backup.importDialog}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: screenMargin, paddingBottom: spacing.xl, gap: spacing.xl },
  back: {
    minHeight: sizes.minTouch,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
  },
  heading: { gap: spacing.sm },
  card: { borderRadius: radii.studyCard, borderWidth: 1, padding: spacing.lg, gap: spacing.lg },
  status: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  badge: {
    width: sizes.minTouch,
    height: sizes.minTouch,
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: { flex: 1 },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1, borderRadius: radii.button, padding: spacing.md },
  action: { gap: spacing.sm },
  hint: { textAlign: "center" },
});

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/bottom-sheet";
import { Icon } from "@/components/icon";
import { Screen } from "@/components/screen";
import { SegmentedControl } from "@/components/segmented-control";
import { SettingsRow } from "@/components/settings-row";
import { SettingsSwitchRow } from "@/components/settings-switch-row";
import { radii, screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

import { useSettingsScreen } from "./use-settings-screen";

const TOP_EDGE: Edge[] = ["top"];

export function SettingsScreen() {
  const { colors } = useTheme();
  const settings = useSettingsScreen();
  const card = { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <Screen testID="settings-screen" edges={TOP_EDGE}>
      <ScrollView contentContainerStyle={styles.body}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Perfil"
          onPress={settings.goBack}
          style={styles.back}
        >
          <Icon name="chevron-left" size={20} color={colors.accentInk} />
       </Pressable>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          Ajustes
        </Text>

        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel, { color: colors.text2 }]}>
            Aparência
          </Text>
          <View style={[styles.card, styles.themeCard, card]}>
            <Text style={[typography.button, { color: colors.text }]}>Tema</Text>
            <SegmentedControl
              label="Tema"
              options={settings.themeSegments}
              value={settings.theme}
              onChange={settings.selectTheme}
            />
            <Text style={[typography.body, { color: colors.text2 }]}>
              Automático acompanha o tema do sistema.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel, { color: colors.text2 }]}>
            Estudo
          </Text>
          <View style={[styles.card, card]}>
            <SettingsSwitchRow
              title="Lembrete diário"
              subtitle="Notificação local, funciona offline"
              value={settings.reminderEnabled}
              onValueChange={settings.toggleReminder}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingsRow
              title="Horário"
              value={settings.reminderHourLabel}
              disabled={!settings.reminderEnabled}
              onPress={settings.openHour}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingsRow
              title="Cartões novos por dia"
              value={settings.newCardsValue}
              onPress={settings.openLimit}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel, { color: colors.text2 }]}>
            Dados
          </Text>
          <View style={[styles.card, card]}>
            <SettingsRow
              title="Backup e restauração"
              subtitle={settings.backupSubtitle}
              onPress={settings.openBackup}
            />
          </View>
        </View>

        {settings.version ? (
          <Text style={[typography.caption, styles.version, { color: colors.text2 }]}>
            {`Memorizze ${settings.version}`}
          </Text>
        ) : null}
      </ScrollView>
      <BottomSheet
        visible={settings.hourOpen}
        title="Horário do lembrete"
        subtitle="Hora em que a notificação chega todos os dias."
        actions={settings.hourActions}
        onClose={settings.closeHour}
      />
      <BottomSheet
        visible={settings.limitOpen}
        title="Cartões novos por dia"
        subtitle="Limite de cartões novos que entram na fila a cada dia."
        actions={settings.limitActions}
        onClose={settings.closeLimit}
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
  section: { gap: spacing.sm },
  sectionLabel: { paddingHorizontal: spacing.xs },
  card: { borderRadius: radii.studyCard, borderWidth: 1, overflow: "hidden" },
  divider: { height: StyleSheet.hairlineWidth },
  themeCard: { padding: spacing.lg, gap: spacing.md },
  version: { textAlign: "center" },
});

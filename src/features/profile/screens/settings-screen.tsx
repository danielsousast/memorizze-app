import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/bottom-sheet";
import { Icon } from "@/components/icon";
import { Screen } from "@/components/screen";
import { SegmentedControl } from "@/components/segmented-control";
import { SettingsRow } from "@/components/settings-row";
import { SettingsSwitchRow } from "@/components/settings-switch-row";
import { t } from "@/lib/i18n";
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
          accessibilityLabel={t("profile.title")}
          onPress={settings.goBack}
          style={styles.back}
        >
          <Icon name="chevron-left" size={20} color={colors.accentInk} />
       </Pressable>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          {t("settings.title")}
        </Text>

        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel, { color: colors.text2 }]}>
            {t("settings.appearance")}
          </Text>
          <View style={[styles.card, styles.themeCard, card]}>
            <Text style={[typography.button, { color: colors.text }]}>{t("settings.theme")}</Text>
            <SegmentedControl
              label={t("settings.theme")}
              options={settings.themeSegments}
              value={settings.theme}
              onChange={settings.selectTheme}
            />
            <Text style={[typography.body, { color: colors.text2 }]}>
              {t("settings.themeHint")}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel, { color: colors.text2 }]}>
            {t("settings.study")}
          </Text>
          <View style={[styles.card, card]}>
            <SettingsSwitchRow
              title={t("settings.reminder")}
              subtitle={t("settings.reminderHint")}
              value={settings.reminderEnabled}
              onValueChange={settings.toggleReminder}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingsRow
              title={t("settings.hour")}
              value={settings.reminderHourLabel}
              disabled={!settings.reminderEnabled}
              onPress={settings.openHour}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingsRow
              title={t("settings.newPerDay")}
              value={settings.newCardsValue}
              onPress={settings.openLimit}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel, { color: colors.text2 }]}>
            {t("settings.data")}
          </Text>
          <View style={[styles.card, card]}>
            <SettingsRow
              title={t("settings.backup")}
              subtitle={settings.backupSubtitle}
              onPress={settings.openBackup}
            />
          </View>
        </View>

        {settings.version ? (
          <Text style={[typography.caption, styles.version, { color: colors.text2 }]}>
            {t("settings.version", { version: settings.version })}
          </Text>
        ) : null}
      </ScrollView>
      <BottomSheet
        visible={settings.hourOpen}
        title={t("settings.hourSheetTitle")}
        subtitle={t("settings.hourSheetSubtitle")}
        actions={settings.hourActions}
        onClose={settings.closeHour}
      />
      <BottomSheet
        visible={settings.limitOpen}
        title={t("settings.newPerDay")}
        subtitle={t("settings.limitSheetSubtitle")}
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

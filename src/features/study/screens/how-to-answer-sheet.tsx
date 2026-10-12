import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { gradeLabel, type Grade } from "@/domain/schedule";
import { t } from "@/lib/i18n";
import { radii, spacing, typography, useTheme } from "@/theme";

const tones = ["again", "hard", "good", "easy"] as const;

const grades: Grade[] = [0, 1, 2, 3];

type Props = { visible: boolean; onDismiss: () => void };

export function HowToAnswerSheet({ visible, onDismiss }: Props) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <Modal
      testID="overlay-modal"
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable testID="overlay-backdrop" style={styles.backdrop} onPress={onDismiss}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: bottom + spacing.lg }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.surface2 }]} />
          <View style={styles.header}>
            <Text style={[typography.label, { color: colors.accentInk }]}>{t("study.sheetEyebrow")}</Text>
            <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
              {t("study.sheetTitle")}
            </Text>
            <Text style={[typography.body, { color: colors.text2 }]}>
              {t("study.sheetBody")}
            </Text>
          </View>
          <View style={styles.rows}>
            {grades.map((grade) => {
              const tone = colors.grade[tones[grade]];
              return (
                <View key={grade} style={styles.row}>
                  <View style={[styles.pill, { backgroundColor: tone.background }]}>
                    <Text style={[typography.button, { color: tone.text }]}>{gradeLabel[grade]}</Text>
                  </View>
                  <Text style={[typography.body, styles.rowText, { color: colors.text }]}>{t(`study.hint.${grade}`)}</Text>
                </View>
              );
            })}
          </View>
          <View style={[styles.tip, { backgroundColor: colors.surface2 }]}>
            <Text style={[typography.button, { color: colors.text2 }]}>
              {t("study.sheetTip")}
            </Text>
          </View>
          <Button label={t("study.sheetDismiss")} onPress={onDismiss} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: radii.pill },
  header: { gap: spacing.sm },
  rows: { gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  pill: {
    width: 84,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radii.button,
  },
  rowText: { flex: 1 },
  tip: { borderRadius: radii.button, padding: spacing.lg },
});

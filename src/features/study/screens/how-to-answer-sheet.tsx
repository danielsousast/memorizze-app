import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { gradeLabel, type Grade } from "@/domain/schedule";
import { radii, spacing, typography, useTheme } from "@/theme";

const tones = ["again", "hard", "good", "easy"] as const;

const rows: { grade: Grade; text: string }[] = [
  { grade: 0, text: "Não lembrei. Volta em instantes." },
  { grade: 1, text: "Lembrei com esforço. Volta logo." },
  { grade: 2, text: "Lembrei bem. Intervalo normal." },
  { grade: 3, text: "Sabia na hora. Demora mais a voltar." },
];

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
            <Text style={[typography.label, { color: colors.accentInk }]}>SUA PRIMEIRA SESSÃO</Text>
            <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
              Como responder
            </Text>
            <Text style={[typography.body, { color: colors.text2 }]}>
              Depois de ver a resposta, diga como foi lembrar. O Memorizze usa isso para decidir quando
              o cartão volta.
            </Text>
          </View>
          <View style={styles.rows}>
            {rows.map(({ grade, text }) => {
              const tone = colors.grade[tones[grade]];
              return (
                <View key={grade} style={styles.row}>
                  <View style={[styles.pill, { backgroundColor: tone.background }]}>
                    <Text style={[typography.button, { color: tone.text }]}>{gradeLabel[grade]}</Text>
                  </View>
                  <Text style={[typography.body, styles.rowText, { color: colors.text }]}>{text}</Text>
                </View>
              );
            })}
          </View>
          <View style={[styles.tip, { backgroundColor: colors.surface2 }]}>
            <Text style={[typography.button, { color: colors.text2 }]}>
              Seja honesto: errar faz parte e ajuda a fixar.
            </Text>
          </View>
          <Button label="Entendi, vamos lá" onPress={onDismiss} />
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

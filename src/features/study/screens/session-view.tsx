import { useMemo, useReducer, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { gradeLabel, intervalLabel, schedule, type Grade } from "@/domain/schedule";
import { answerSession, skipCurrent, startSession, type SessionState } from "@/domain/session";
import { radii, screenMargin, sizes, spacing, tabularNums, typography, useTheme } from "@/theme";

import type { StudyCard } from "../interfaces";

export type SessionAction =
  | { type: "answer"; updated: StudyCard; grade: Grade; now: Date }
  | { type: "skip" };

export function sessionReducer(
  state: SessionState<StudyCard>,
  action: SessionAction,
): SessionState<StudyCard> {
  return action.type === "answer"
    ? answerSession(state, action.updated, action.grade, action.now)
    : skipCurrent(state);
}

const grades: Grade[] = [0, 1, 2, 3];
const gradeTone = ["again", "hard", "good", "easy"] as const;

type Props = { cards: StudyCard[] };

export function SessionView({ cards }: Props) {
  const { colors } = useTheme();
  // The queue is a snapshot: started once from the first read (QUE-02).
  const [state] = useReducer(sessionReducer, cards, (initial) => startSession(initial, new Date()));
  const [revealed, setRevealed] = useState(false);
  const card = state.queue[0];
  const position = state.completed + 1;
  const reveal = () => setRevealed(true);

  const labels = useMemo(() => {
    if (!card) return [];
    const now = new Date();
    return grades.map((g) => intervalLabel(schedule(card, g, now).intervalDays));
  }, [card]);

  if (!card) return null;

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair da sessão"
          hitSlop={8}
          onPress={() => {}}
          style={styles.close}
        >
          <Icon name="close" size={22} color={colors.text} />
        </Pressable>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Cartão ${position} de ${state.total}`}
          accessibilityValue={{ now: state.completed, min: 0, max: state.total }}
          style={[styles.track, { backgroundColor: colors.surface2 }]}
        >
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.accent, width: `${(100 * state.completed) / state.total}%` },
            ]}
          />
        </View>
        <Text style={[typography.button, tabularNums, { color: colors.text }]}>
          {`${position} de ${state.total}`}
        </Text>
      </View>

      <Text style={[typography.button, styles.deckName, { color: colors.text2 }]}>
        {card.deckName}
      </Text>

      <Pressable
        testID="study-card"
        accessibilityRole="button"
        accessibilityLabel="Virar cartão"
        disabled={revealed}
        onPress={reveal}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[typography.label, { color: colors.text2 }]}>FRENTE</Text>
        {revealed ? (
          <>
            <Text style={[typography.section, styles.center, { color: colors.text2 }]}>
              {card.front}
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[typography.label, { color: colors.accentInk }]}>VERSO</Text>
            <Text style={[typography.title, styles.center, { color: colors.text }]}>{card.back}</Text>
          </>
        ) : (
          <>
            <View style={styles.middle}>
              <Text style={[typography.card, styles.center, { color: colors.text }]}>
                {card.front}
              </Text>
            </View>
            <Text style={[typography.button, { color: colors.accentInk }]}>
              Toque para ver a resposta
            </Text>
          </>
        )}
      </Pressable>

      <View style={styles.bottom}>
        {revealed ? (
          <>
            <Text style={[typography.button, styles.center, { color: colors.text2 }]}>
              Como foi lembrar?
            </Text>
            <View style={styles.answers}>
              {grades.map((g) => {
                const tone = colors.grade[gradeTone[g]];
                return (
                  <Pressable
                    key={g}
                    accessibilityRole="button"
                    accessibilityLabel={`${gradeLabel[g]}, ${labels[g]}`}
                    onPress={() => {}} // T8 wires answering
                    style={[styles.answer, { backgroundColor: tone.background }]}
                  >
                    <Text style={[typography.button, { color: tone.text }]}>{gradeLabel[g]}</Text>
                    <Text style={[typography.caption, { color: tone.text }]}>{labels[g]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <Button label="Mostrar resposta" onPress={reveal} variant="secondary" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: screenMargin, paddingBottom: spacing.xl, gap: spacing.lg },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.lg, minHeight: sizes.minTouch },
  close: { minWidth: sizes.minTouch, minHeight: sizes.minTouch, justifyContent: "center" },
  track: { flex: 1, height: sizes.progressSession, borderRadius: radii.pill, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radii.pill },
  deckName: { textAlign: "center" },
  card: {
    flex: 1,
    borderRadius: radii.studyCard,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  middle: { flex: 1, justifyContent: "center" },
  center: { textAlign: "center" },
  divider: { width: 48, height: 2, borderRadius: 1, marginVertical: spacing.lg },
  bottom: { gap: spacing.md },
  answers: { flexDirection: "row", gap: spacing.md },
  answer: {
    flex: 1,
    minHeight: sizes.answerButton,
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
});

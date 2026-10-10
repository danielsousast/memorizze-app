import { Stack, router } from "expo-router";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Alert, BackHandler, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { FlipCard } from "@/components/flip-card";
import { Icon } from "@/components/icon";
import { gradeLabel, intervalLabel, schedule, type Grade } from "@/domain/schedule";
import { answerSession, skipCurrent, startSession, type SessionState } from "@/domain/session";
import { radii, screenMargin, sizes, spacing, tabularNums, typography, useTheme } from "@/theme";

import { useCard } from "@/features/cards";

import type { StudyCard } from "../interfaces";
import { useAnswerCard } from "../usecases/use-answer-card";
import { SummaryView } from "./summary-view";

const SAVE_ERROR = "Não foi possível salvar a resposta. Tente de novo.";

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

function confirmExit() {
  Alert.alert("Sair da sessão?", "Seu progresso já foi salvo.", [
    { text: "Continuar", style: "cancel" },
    { text: "Sair", style: "destructive", onPress: () => router.back() },
  ]);
}

const grades: Grade[] = [0, 1, 2, 3];
const gradeTone = ["again", "hard", "good", "easy"] as const;

type Props = { cards: StudyCard[]; deckId?: string };

export function SessionView({ cards, deckId }: Props) {
  const { colors } = useTheme();
  // The queue is a snapshot: started once from the first read (QUE-02).
  const [state, dispatch] = useReducer(sessionReducer, cards, (initial) => startSession(initial, new Date()));
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const card = state.queue[0];
  const position = state.completed + 1;
  const revealed = card !== undefined && revealedId === card.id;
  const reveal = () => setRevealedId(card?.id ?? null);
  const answer = useAnswerCard();
  const busy = useRef(false);
  const [error, setError] = useState(false);
  // QUE-05: a card deleted during the session is skipped without an answer.
  const { data: stored } = useCard(card?.id ?? "");
  useEffect(() => {
    if (card && stored === null) {
      dispatch({ type: "skip" });
    }
  }, [card, stored]);

  // EXT-03: the Android back button asks for confirmation, only while studying.
  const studying = card !== undefined;
  useEffect(() => {
    if (!studying) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmExit();
      return true;
    });
    return () => subscription.remove();
  }, [studying]);

  function onAnswer(grade: Grade) {
    if (busy.current || !card) return;
    busy.current = true;
    setError(false);
    answer.mutate(
      { cardId: card.id, grade },
      {
        onSuccess: (updated) => {
          dispatch({ type: "answer", updated, grade, now: new Date() });
          setRevealedId(null);
        },
        onError: () => setError(true),
        onSettled: () => {
          busy.current = false;
        },
      },
    );
  }

  const labels = useMemo(() => {
    if (!card) return [];
    const now = new Date();
    return grades.map((g) => intervalLabel(schedule(card, g, now).intervalDays));
  }, [card]);

  // ANS-05: the summary replaces the session in the same route.
  if (!card) {
    return (
      <>
        <Stack.Screen options={{ gestureEnabled: true }} />
        <SummaryView state={state} deckId={deckId} />
      </>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair da sessão"
          hitSlop={8}
          onPress={confirmExit}
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

      <FlipCard
        testID="study-card"
        accessibilityLabel="Virar cartão"
        flipped={revealed}
        disabled={revealed}
        onPress={reveal}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        front={
          <>
            <Text style={[typography.label, { color: colors.text2 }]}>FRENTE</Text>
            <View style={styles.middle}>
              <Text style={[typography.card, styles.center, { color: colors.text }]}>
                {card.front}
              </Text>
            </View>
            <Text style={[typography.button, { color: colors.accentInk }]}>
              Toque para ver a resposta
            </Text>
          </>
        }
        back={
          <>
            <Text style={[typography.label, { color: colors.text2 }]}>FRENTE</Text>
            <Text style={[typography.section, styles.center, { color: colors.text2 }]}>
              {card.front}
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[typography.label, { color: colors.accentInk }]}>VERSO</Text>
            <Text style={[typography.title, styles.center, { color: colors.text }]}>{card.back}</Text>
          </>
        }
      />

      <View style={styles.bottom}>
        {revealed ? (
          <>
            <Text style={[typography.button, styles.center, { color: colors.text2 }]}>
              Como foi lembrar?
            </Text>
            {error ? (
              <Text accessibilityRole="alert" style={[typography.button, styles.center, { color: colors.grade.again.text }]}>
                {SAVE_ERROR}
              </Text>
            ) : null}
            <View style={styles.answers}>
              {grades.map((g) => {
                const tone = colors.grade[gradeTone[g]];
                return (
                  <Pressable
                    key={g}
                    accessibilityRole="button"
                    accessibilityLabel={`${gradeLabel[g]}, ${labels[g]}`}
                    disabled={answer.isPending}
                    onPress={() => onAnswer(g)}
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

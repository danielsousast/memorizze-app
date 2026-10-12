import { Stack } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button/button";
import { ConfirmDialog } from "@/components/confirm-dialog/confirm-dialog";
import { FlipCard } from "@/components/flip-card/flip-card";
import { Icon } from "@/components/icon/icon";
import { t } from "@/lib/i18n";
import { radii, screenMargin, sizes, spacing, tabularNums, typography, useTheme } from "@/theme";

import type { StudyCard } from "../interfaces";
import { AnswerButton } from "./answer-button";
import { HowToAnswerSheet } from "./how-to-answer-sheet";
import { SummaryView } from "./summary-view";
import { useStudySession } from "./use-study-session";

type Props = { cards: StudyCard[]; deckId?: string };

export function SessionView({ cards, deckId }: Props) {
  const { colors } = useTheme();
  const {
    state,
    card,
    position,
    revealed,
    answers,
    error,
    pending,
    reveal,
    answer,
    tutorialOpen,
    dismissTutorial,
    exitOpen,
    requestExit,
    cancelExit,
    leave,
  } = useStudySession(cards);

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
          accessibilityLabel={t("study.exitSession")}
          hitSlop={8}
          onPress={requestExit}
          style={styles.close}
        >
          <Icon name="close" size={22} color={colors.text} />
        </Pressable>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t("study.cardProgressA11y", { position, total: state.total })}
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
          {t("study.progress", { position, total: state.total })}
        </Text>
      </View>

      <Text style={[typography.button, styles.deckName, { color: colors.text2 }]}>
        {card.deckName}
      </Text>

      <FlipCard
        testID="study-card"
        accessibilityLabel={t("study.flipCard")}
        flipped={revealed}
        disabled={revealed}
        onPress={reveal}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        front={
          <>
            <Text style={[typography.label, { color: colors.text2 }]}>{t("study.front")}</Text>
            <View style={styles.middle}>
              <Text style={[typography.card, styles.center, { color: colors.text }]}>
                {card.front}
              </Text>
            </View>
            <Text style={[typography.button, { color: colors.accentInk }]}>
              {t("study.tapToReveal")}
            </Text>
          </>
        }
        back={
          <>
            <Text style={[typography.label, { color: colors.text2 }]}>{t("study.front")}</Text>
            <Text style={[typography.section, styles.center, { color: colors.text2 }]}>
              {card.front}
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[typography.label, { color: colors.accentInk }]}>{t("study.back")}</Text>
            <Text style={[typography.title, styles.center, { color: colors.text }]}>{card.back}</Text>
          </>
        }
      />

      <View style={styles.bottom}>
        {revealed ? (
          <>
            <Text style={[typography.button, styles.center, { color: colors.text2 }]}>
              {t("study.howWasIt")}
            </Text>
            {error ? (
              <Text accessibilityRole="alert" style={[typography.button, styles.center, { color: colors.grade.again.text }]}>
                {error}
              </Text>
            ) : null}
            <View style={styles.answers}>
              {answers.map((option) => (
                <AnswerButton key={option.grade} option={option} disabled={pending} onAnswer={answer} />
              ))}
            </View>
          </>
        ) : (
          <Button label={t("study.showAnswer")} onPress={reveal} variant="secondary" />
        )}
      </View>

      <HowToAnswerSheet visible={tutorialOpen} onDismiss={dismissTutorial} />
      <ConfirmDialog
        visible={exitOpen}
        icon="sign-out"
        title={t("study.exitTitle")}
        message={t("study.exitMessage")}
        confirmLabel={t("study.exitConfirm")}
        cancelLabel={t("study.exitCancel")}
        onConfirm={leave}
        onCancel={cancelExit}
      />
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
});

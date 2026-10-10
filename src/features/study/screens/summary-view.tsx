import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { gradeLabel, type Grade } from "@/domain/schedule";
import { accuracy, studyMinutes, type SessionState } from "@/domain/session";
import {
  reviewedCardsLabel,
  streakDaysLabel,
  studyTimeLabel,
  tomorrowSummaryLabel,
} from "@/domain/labels";
import { radii, screenMargin, spacing, tabularNums, typography, useTheme } from "@/theme";

import { useDueTomorrow, useStreak } from "../index";
import type { StudyCard } from "../interfaces";

const grades: Grade[] = [0, 1, 2, 3];
const gradeTone = ["again", "hard", "good", "easy"] as const;

function goBack() {
  router.back();
}

type Props = { state: SessionState<StudyCard>; deckId?: string };

type BlockProps = {
  value: string;
  rest: string;
  background: string;
  valueColor: string;
  restColor: string;
  icon?: boolean;
};

// One Text per block so the figure and its label read as a single phrase ("2 cartões revistos").
function Block({ value, rest, background, valueColor, restColor, icon }: BlockProps) {
  return (
    <View style={[styles.block, { backgroundColor: background }]}>
      {icon ? <Icon name="flame" size={22} color={valueColor} /> : null}
      <Text style={[typography.button, { color: restColor }]}>
        <Text style={[typography.title, tabularNums, { color: valueColor }]}>{value}</Text>
        {` ${rest}`}
      </Text>
    </View>
  );
}

export function SummaryView({ state, deckId }: Props) {
  const { colors } = useTheme();
  const { data: streak } = useStreak();
  const { data: tomorrow } = useDueTomorrow(deckId);

  const minutes = studyMinutes(state.startedAt, state.lastAnswerAt);
  const studyText = studyTimeLabel(minutes);
  const tomorrowText = tomorrowSummaryLabel(tomorrow);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={[styles.illustration, { backgroundColor: colors.accent }]}>
          <Icon name="check" size={48} color={colors.onAccent} />
        </View>
        <Text accessibilityRole="header" style={[typography.title, styles.center, { color: colors.text }]}>
          Sessão concluída
        </Text>
        <Text style={[typography.body, styles.center, { color: colors.text2 }]}>
          Bom trabalho! Você revisou tudo o que vencia hoje.
        </Text>
      </View>

      <View style={styles.blocks}>
        <Block
          value={String(state.total)}
          rest={reviewedCardsLabel(state.total)}
          background={colors.surface}
          valueColor={colors.text}
          restColor={colors.text2}
        />
        <Block
          value={`${accuracy(state.counts)}%`}
          rest="de acerto"
          background={colors.surface}
          valueColor={colors.text}
          restColor={colors.text2}
        />
        {streak === undefined ? (
          <View style={[styles.block, { backgroundColor: colors.accentSoft }]} />
        ) : (
          <Block
            value={String(streak)}
            rest={streakDaysLabel(streak)}
            background={colors.accentSoft}
            valueColor={colors.accentInk}
            restColor={colors.accentInk}
            icon
          />
        )}
      </View>

      <View style={[styles.answers, { backgroundColor: colors.surface }]}>
        <View style={styles.answersHead}>
          <Text style={[typography.section, { color: colors.text }]}>Suas respostas</Text>
          <Text style={[typography.button, { color: colors.text2 }]}>{studyText}</Text>
        </View>
        <View testID="grade-bar" style={styles.bar}>
          {grades
            .filter((g) => state.counts[g] > 0)
            .map((g) => (
              <View
                key={g}
                testID={`grade-segment-${g}`}
                style={[
                  styles.segment,
                  { flex: state.counts[g], backgroundColor: colors.grade[gradeTone[g]].text },
                ]}
              />
            ))}
        </View>
        <View style={styles.legend}>
          {grades.map((g) => (
            <View key={g} style={styles.legendItem}>
              <View style={styles.legendLabel}>
                <View style={[styles.dot, { backgroundColor: colors.grade[gradeTone[g]].text }]} />
                <Text style={[typography.button, { color: colors.text2 }]}>{gradeLabel[g]}</Text>
              </View>
              <Text style={[typography.section, tabularNums, { color: colors.text }]}>
                {String(state.counts[g])}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {tomorrowText ? (
        <View style={styles.tomorrow}>
          <Icon name="calendar" size={18} color={colors.text2} />
          <Text style={[typography.button, { color: colors.text2 }]}>{tomorrowText}</Text>
        </View>
      ) : null}

      <View style={styles.spacer} />
      <Button label="Concluir" onPress={goBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: screenMargin, paddingBottom: spacing.xl, gap: spacing.lg },
  header: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xl },
  illustration: {
    width: 88,
    height: 88,
    borderRadius: radii.studyCard,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
  blocks: { flexDirection: "row", gap: spacing.md },
  block: { flex: 1, borderRadius: radii.studyCard, padding: spacing.lg, gap: spacing.xs },
  answers: { borderRadius: radii.studyCard, padding: spacing.lg, gap: spacing.lg },
  answersHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bar: { flexDirection: "row", gap: 6, height: 12 },
  segment: { height: 12, borderRadius: radii.pill },
  legend: { flexDirection: "row", justifyContent: "space-between" },
  legendItem: { gap: spacing.xs },
  legendLabel: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tomorrow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  spacer: { flex: 1 },
});

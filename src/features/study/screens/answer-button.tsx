import { useCallback } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { radii, sizes, typography, useTheme } from "@/theme";

import type { AnswerOption } from "./use-study-session";

const gradeTone = ["again", "hard", "good", "easy"] as const;

type Props = {
  option: AnswerOption;
  disabled: boolean;
  onAnswer: (grade: AnswerOption["grade"]) => void;
};

export function AnswerButton({ option, disabled, onAnswer }: Props) {
  const { colors } = useTheme();
  const tone = colors.grade[gradeTone[option.grade]];
  const press = useCallback(() => onAnswer(option.grade), [onAnswer, option.grade]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${option.name}, ${option.interval}`}
      disabled={disabled}
      onPress={press}
      style={[styles.answer, { backgroundColor: tone.background }]}
    >
      <Text style={[typography.button, { color: tone.text }]}>{option.name}</Text>
      <Text style={[typography.caption, { color: tone.text }]}>{option.interval}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  answer: {
    flex: 1,
    minHeight: sizes.answerButton,
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
});

import { useState, type Ref } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { sizes, spacing, typography, useTheme } from "@/theme";

type Props = Omit<TextInputProps, "accessibilityLabel"> & {
  label: string;
  hint?: string;
  error?: string;
  inputRef?: Ref<TextInput>;
};

export function TextField({ label, hint, error, multiline, inputRef, onFocus, onBlur, style, ...rest }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.grade.again.text : focused ? colors.accent : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text style={[typography.label, { color: colors.text2 }]}>{label}</Text>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        multiline={multiline}
        placeholderTextColor={colors.text2}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          typography.body,
          styles.input,
          multiline && styles.multiline,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor,
            borderWidth: focused || error ? sizes.borderFocus : 1,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[typography.caption, { color: colors.grade.again.text }]}>
          {error}
        </Text>
      ) : null}
      {hint ? <Text style={[typography.caption, { color: colors.text2 }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  input: {
    minHeight: sizes.field,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
  },
  multiline: {
    minHeight: sizes.field * 2,
    paddingVertical: spacing.md,
    textAlignVertical: "top",
  },
});

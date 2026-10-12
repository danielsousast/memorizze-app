import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radii, sizes, spacing, typography, useTheme } from "@/theme";

import { Icon, type IconName } from "../icon/icon";

export type SegmentOption<T extends string> = { value: T; label: string; icon?: IconName };

type Props<T extends string> = {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

type SegmentProps<T extends string> = {
  option: SegmentOption<T>;
  selected: boolean;
  onChange: (value: T) => void;
};

function Segment<T extends string>({ option, selected, onChange }: SegmentProps<T>) {
  const { colors } = useTheme();
  const { value } = option;
  const press = useCallback(() => onChange(value), [onChange, value]);
  const ink = selected ? colors.text : colors.text2;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={option.label}
      accessibilityState={{ checked: selected }}
      onPress={press}
      style={[styles.segment, selected && { backgroundColor: colors.surface }]}
    >
      {option.icon ? <Icon name={option.icon} size={18} color={ink} /> : null}
      <Text style={[typography.button, { color: ink }]}>{option.label}</Text>
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({ label, options, value, onChange }: Props<T>) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.track, { backgroundColor: colors.surface2 }]}
    >
      {options.map((option) => (
        <Segment
          key={option.value}
          option={option}
          selected={option.value === value}
          onChange={onChange}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: radii.button,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: sizes.minTouch + spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radii.button - spacing.xs,
  },
});

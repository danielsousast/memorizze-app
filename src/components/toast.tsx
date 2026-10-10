import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { darkColors, radii, sizes, spacing, typography } from "@/theme";

import { Icon } from "./icon";
import type { ToastOptions } from "./use-toast-state";

type Props = ToastOptions & { onHide: () => void };

export const TOAST_BACKGROUND = "#17151F";

export function Toast({ message, action, onHide }: Props) {
  const onPress = action?.onPress;
  const pressAction = useCallback(() => {
    onPress?.();
    onHide();
  }, [onPress, onHide]);

  return (
    <View testID="toast" accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.toast}>
      <View testID="toast-check">
        <Icon name="check" size={18} color={darkColors.grade.good.text} />
      </View>
      <Text style={[typography.body, styles.message]}>{message}</Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={pressAction}
          style={styles.action}
        >
          <Text style={[typography.button, { color: darkColors.accentInk }]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    minHeight: sizes.button,
    borderRadius: radii.toast,
    backgroundColor: TOAST_BACKGROUND,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  message: { flex: 1, color: darkColors.text },
  action: {
    minHeight: sizes.minTouch,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
});

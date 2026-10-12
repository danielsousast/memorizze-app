import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { t } from "@/lib/i18n";
import { radii, sizes, spacing, typography, useTheme } from "@/theme";

import { Button } from "../button/button";
import { Icon, type IconName } from "../icon/icon";

export type SheetAction = {
  label: string;
  subtitle?: string;
  icon?: IconName;
  destructive?: boolean;
  selected?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  actions: SheetAction[];
  onClose: () => void;
};

type RowProps = { action: SheetAction; onClose: () => void };

function ActionRow({ action, onClose }: RowProps) {
  const { colors } = useTheme();
  const ink = action.destructive ? colors.grade.again.text : colors.text;
  const { onPress } = action;

  const press = useCallback(() => {
    onPress();
    onClose();
  }, [onPress, onClose]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityState={{ selected: action.selected }}
      onPress={press}
      style={[styles.row, { borderColor: colors.border }]}
    >
      {action.icon ? <Icon name={action.icon} size={22} color={ink} /> : null}
      <View style={styles.rowText}>
        <Text style={[typography.button, { color: ink }]}>{action.label}</Text>
        {action.subtitle ? (
          <Text style={[typography.caption, { color: colors.text2 }]}>{action.subtitle}</Text>
        ) : null}
      </View>
      {action.selected ? <Icon name="check" size={20} color={colors.accent} /> : null}
    </Pressable>
  );
}

export function BottomSheet({ visible, title, subtitle, actions, onClose }: Props) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <Modal
      testID="overlay-modal"
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable testID="overlay-backdrop" style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: bottom + spacing.lg }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.surface2 }]} />
          <View style={styles.header}>
            <Text style={[typography.section, { color: colors.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[typography.body, { color: colors.text2 }]}>{subtitle}</Text>
            ) : null}
          </View>
          <View style={[styles.group, { backgroundColor: colors.surface2 }]}>
            {actions.map((action) => (
              <ActionRow key={action.label} action={action} onClose={onClose} />
            ))}
          </View>
          <Button label={t("common.cancel")} variant="secondary" onPress={onClose} />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: radii.pill },
  header: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  group: { borderRadius: radii.sheet - spacing.sm, overflow: "hidden" },
  row: {
    minHeight: sizes.minTouch + spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1 },
});

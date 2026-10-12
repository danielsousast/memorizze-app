import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { t } from "@/lib/i18n";
import { radii, spacing, typography, useTheme } from "@/theme";

import { Button } from "./button";
import { Icon, type IconName } from "./icon";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon: IconName;
  tone?: "destructive" | "neutral";
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  icon,
  tone = "neutral",
  children,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const destructive = tone === "destructive";
  const badgeBackground = destructive ? colors.grade.again.background : colors.accentSoft;
  const badgeInk = destructive ? colors.grade.again.text : colors.accentInk;

  return (
    <Modal
      testID="overlay-modal"
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable testID="overlay-backdrop" style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <View style={[styles.badge, { backgroundColor: badgeBackground }]}>
            <Icon name={icon} size={28} color={badgeInk} />
          </View>
          <Text style={[typography.section, styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[typography.body, styles.message, { color: colors.text2 }]}>{message}</Text>
          {children}
          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              variant={destructive ? "destructive" : "primary"}
              onPress={onConfirm}
            />
            <Button label={cancelLabel ?? t("common.cancel")} variant="secondary" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.xl,
  },
  dialog: {
    borderRadius: radii.sheet,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radii.icon,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { textAlign: "center" },
  message: { textAlign: "center" },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.sm },
});

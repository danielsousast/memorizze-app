import { router } from "expo-router";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { tomorrowLabel } from "@/domain/labels";
import { t } from "@/lib/i18n";
import { screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

import { useDueTomorrow } from "../index";

type Props = { deckId?: string };

function goBack() {
  router.back();
}

function goHome() {
  router.dismissTo("/");
}

export function EmptyView({ deckId }: Props) {
  const { colors } = useTheme();
  const { data: tomorrow } = useDueTomorrow(deckId);
  const label = tomorrowLabel(tomorrow);
  const addCards = useCallback(() => {
    router.replace(`/decks/${deckId}/cards/new`);
  }, [deckId]);

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("study.exitSession")}
        hitSlop={8}
        onPress={goBack}
        style={styles.close}
      >
        <Icon name="close" size={22} color={colors.text} />
      </Pressable>

      <View style={styles.middle}>
        <View style={[styles.illustration, { backgroundColor: colors.accentSoft }]}>
          <Icon name="check" size={48} color={colors.accentInk} />
        </View>
        <Text accessibilityRole="header" style={[typography.title, styles.center, { color: colors.text }]}>
          {t("study.emptyTitle")}
        </Text>
        <Text style={[typography.body, styles.center, { color: colors.text2 }]}>
          {t("study.emptyMessage")}
        </Text>
        {label ? <Badge text={label} tone="outline" icon="calendar" /> : null}
      </View>

      <View style={styles.bottom}>
        <Button label={t("study.backHome")} onPress={goHome} />
        {deckId ? (
          <Button
            label={t("study.addCards")}
            variant="text"
            onPress={addCards}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: screenMargin, paddingBottom: spacing.xl },
  close: { minWidth: sizes.minTouch, minHeight: sizes.minTouch, justifyContent: "center" },
  middle: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg },
  illustration: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
  bottom: { gap: spacing.md },
});

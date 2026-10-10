import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

import { useDueTomorrow } from "../index";

type Props = { deckId?: string };

function tomorrowLabel(count: number | undefined) {
  if (count === undefined) return "";
  if (count === 0) return "Amanhã: nenhum cartão";
  return `Amanhã: ${count} ${count === 1 ? "cartão" : "cartões"}`;
}

export function EmptyView({ deckId }: Props) {
  const { colors } = useTheme();
  const { data: tomorrow } = useDueTomorrow(deckId);
  const label = tomorrowLabel(tomorrow);

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sair da sessão"
        hitSlop={8}
        onPress={() => router.back()}
        style={styles.close}
      >
        <Icon name="close" size={22} color={colors.text} />
      </Pressable>

      <View style={styles.middle}>
        <View style={[styles.illustration, { backgroundColor: colors.accentSoft }]}>
          <Icon name="check" size={48} color={colors.accentInk} />
        </View>
        <Text accessibilityRole="header" style={[typography.title, styles.center, { color: colors.text }]}>
          Nada para revisar hoje
        </Text>
        <Text style={[typography.body, styles.center, { color: colors.text2 }]}>
          Você está em dia! A memória também se fortalece no descanso.
        </Text>
        {label ? <Badge text={label} tone="outline" icon="calendar" /> : null}
      </View>

      <View style={styles.bottom}>
        <Button label="Voltar ao início" onPress={() => router.dismissTo("/")} />
        {deckId ? (
          <Button
            label="Adicionar novos cartões"
            variant="text"
            onPress={() => router.replace(`/decks/${deckId}/cards/new`)}
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

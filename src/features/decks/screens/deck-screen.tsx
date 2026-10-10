import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Icon } from "@/components/icon";
import { NotFound } from "@/components/not-found";
import { Screen } from "@/components/screen";
import { cardStage, stageLabel } from "@/domain/stage";
import { plural } from "@/domain/text";
import { useCards, type Card } from "@/features/cards";
import { radii, screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

import { useDeck, type Deck } from "@/features/decks";

function goHome() {
  router.dismissTo("/");
}

type Props = { deckId: string };

export function DeckScreen({ deckId }: Props) {
  const { data: deck, isPending } = useDeck(deckId);
  if (isPending) return <Screen testID="deck-screen">{null}</Screen>;
  if (!deck) {
    return (
      <Screen testID="deck-screen">
        <NotFound title="Baralho não encontrado" actionLabel="Voltar ao início" onAction={goHome} />
      </Screen>
    );
  }
  return <DeckDetail deck={deck} />;
}

function DeckDetail({ deck }: { deck: Deck }) {
  const { colors } = useTheme();
  const { data: cards } = useCards(deck.id);
  const rows = cards ? [...cards].reverse() : undefined;
  const matureCount = cards ? cards.filter((c) => cardStage(c) === "mature").length : 0;

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          {deck.name}
        </Text>
        {deck.description ? (
          <Text testID="deck-description" style={[typography.body, { color: colors.text2 }]}>
            {deck.description}
          </Text>
        ) : null}
      </View>
      <View style={styles.badges}>
        <Badge tone="outline" text={plural(deck.cardCount, "cartão", "cartões")} />
        {deck.dueCount > 0 ? <Badge tone="accent" text={`${deck.dueCount} para hoje`} /> : null}
        {matureCount > 0 ? <Badge tone="outline" text={`${matureCount} maduros`} /> : null}
      </View>
      {rows && rows.length > 0 ? (
        <Text accessibilityRole="header" style={[typography.section, { color: colors.text }]}>
          Cartões
        </Text>
      ) : null}
    </View>
  );

  return (
    <Screen testID="deck-screen">
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Início"
          onPress={goHome}
          hitSlop={8}
          style={styles.back}
        >
          <Icon name="chevron-left" size={20} color={colors.accentInk} />
          <Text style={[typography.button, { color: colors.accentInk }]}>Início</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Opções do baralho"
          onPress={() => undefined}
          hitSlop={8}
          style={styles.more}
        >
          <Icon name="more" size={24} color={colors.text} />
        </Pressable>
      </View>
      <FlatList
        data={rows ?? []}
        keyExtractor={(card) => card.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <CardRow card={item} />}
        ListEmptyComponent={
          rows ? (
            <Text style={[typography.body, styles.empty, { color: colors.text2 }]}>
              Nenhum cartão ainda
            </Text>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

function CardRow({ card }: { card: Card }) {
  const { colors } = useTheme();
  const stage = cardStage(card);
  return (
    <View
      testID="card-row"
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.rowText}>
        <Text
          testID="card-front"
          numberOfLines={1}
          style={[typography.button, { color: colors.text }]}
        >
          {card.front}
        </Text>
        <Text numberOfLines={1} style={[typography.caption, { color: colors.text2 }]}>
          {card.back.replace(/\s*\r?\n\s*/g, " ")}
        </Text>
      </View>
      <Badge tone={stage === "new" ? "accent" : "neutral"} text={stageLabel[stage]} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: screenMargin,
    paddingVertical: spacing.md,
  },
  back: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: sizes.minTouch },
  more: {
    minHeight: sizes.minTouch,
    minWidth: sizes.minTouch,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: screenMargin, paddingBottom: spacing.xl },
  headerContent: { gap: spacing.xl, paddingBottom: spacing.lg },
  titleBlock: { gap: spacing.sm },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  empty: { textAlign: "center", paddingVertical: spacing.xl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: sizes.deckCard,
    paddingHorizontal: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    marginBottom: spacing.sm,
  },
  rowText: { flex: 1 },
});

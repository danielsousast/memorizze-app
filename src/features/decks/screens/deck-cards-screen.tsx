import { FlatList, type ListRenderItemInfo, Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { NotFound } from "@/components/not-found";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { plural } from "@/domain/text";
import type { Card } from "@/features/cards";
import { radii, screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

import { useDeck, type Deck } from "@/features/decks";

import { CardRow } from "./card-row";
import { goHome } from "./use-deck-screen";
import { useDeckCardsScreen } from "./use-deck-cards-screen";

type Props = { deckId: string };

export function DeckCardsScreen({ deckId }: Props) {
  const { data: deck, isPending } = useDeck(deckId);
  if (isPending) return <Screen testID="deck-cards-screen">{null}</Screen>;
  if (!deck) {
    return (
      <Screen testID="deck-cards-screen">
        <NotFound title="Baralho não encontrado" actionLabel="Voltar ao início" onAction={goHome} />
      </Screen>
    );
  }
  return <DeckCards deck={deck} />;
}

function cardKey(card: Card): string {
  return card.id;
}

function renderCard({ item }: ListRenderItemInfo<Card>) {
  return <CardRow card={item} />;
}

function DeckCards({ deck }: { deck: Deck }) {
  const { colors } = useTheme();
  const screen = useDeckCardsScreen(deck);
  const { all } = screen;

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          Todos os cartões
        </Text>
        <Text style={[typography.body, { color: colors.text2 }]}>
          {`${deck.name} · ${plural(deck.cardCount, "cartão", "cartões")}`}
        </Text>
      </View>
      {all && all.length > 0 ? (
        <TextField
          label="Buscar cartões"
          placeholder="Buscar na frente ou no verso"
          value={screen.query}
          onChangeText={screen.setQuery}
        />
      ) : null}
    </View>
  );

  return (
    <Screen testID="deck-cards-screen">
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Baralho"
          onPress={screen.goBack}
          hitSlop={8}
          style={styles.back}
        >
          <Icon name="chevron-left" size={20} color={colors.accentInk} />
          <Text style={[typography.button, { color: colors.accentInk }]}>Baralho</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar cartão"
          onPress={screen.addCard}
          hitSlop={8}
          style={[styles.add, { backgroundColor: colors.accentSoft }]}
        >
          <Icon name="plus" size={24} color={colors.accentInk} />
        </Pressable>
      </View>
      <FlatList
        data={screen.rows}
        keyExtractor={cardKey}
        ListHeaderComponent={header}
        renderItem={renderCard}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          all ? (
            <Text style={[typography.body, styles.empty, { color: colors.text2 }]}>
              {all.length === 0 ? "Nenhum cartão ainda" : "Nenhum cartão encontrado"}
            </Text>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
    </Screen>
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
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: sizes.minTouch,
  },
  add: {
    minHeight: sizes.minTouch,
    minWidth: sizes.minTouch,
    borderRadius: radii.card,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: screenMargin, paddingBottom: spacing.xxxl },
  headerContent: { gap: spacing.xl, paddingBottom: spacing.lg },
  titleBlock: { gap: spacing.sm },
  empty: { textAlign: "center", paddingVertical: spacing.xl },
});

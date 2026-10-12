import { FlatList, type ListRenderItemInfo, Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge/badge";
import { BottomSheet } from "@/components/bottom-sheet/bottom-sheet";
import { Button } from "@/components/button/button";
import { ConfirmDialog } from "@/components/confirm-dialog/confirm-dialog";
import { Fab } from "@/components/fab/fab";
import { Icon } from "@/components/icon/icon";
import { NotFound } from "@/components/not-found/not-found";
import { Screen } from "@/components/screen/screen";
import type { Card } from "@/features/cards";
import { t } from "@/lib/i18n";
import { screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

import { useDeck, useDeleteDeck, type Deck } from "@/features/decks";

import { CardRow } from "./card-row";
import { goHome, useDeckScreen } from "./use-deck-screen";

type Props = { deckId: string };

export function DeckScreen({ deckId }: Props) {
  const { data: deck, isPending } = useDeck(deckId);
  const remove = useDeleteDeck();
  if (isPending) return <Screen testID="deck-screen">{null}</Screen>;
  if (!deck) {
    // Deleted from this screen: the deck vanishes before navigation settles; avoid a not-found flash.
    if (remove.isPending || remove.isSuccess) return <Screen testID="deck-screen">{null}</Screen>;
    return (
      <Screen testID="deck-screen">
        <NotFound title={t("deck.notFound")} actionLabel={t("deck.backHome")} onAction={goHome} />
      </Screen>
    );
  }
  return <DeckDetail deck={deck} remove={remove} />;
}

function cardKey(card: Card): string {
  return card.id;
}

function renderCard({ item }: ListRenderItemInfo<Card>) {
  return <CardRow card={item} />;
}

function DeckDetail({ deck, remove }: { deck: Deck; remove: ReturnType<typeof useDeleteDeck> }) {
  const { colors } = useTheme();
  const screen = useDeckScreen(deck, remove);
  const { all, matureCount } = screen;

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
        <Badge tone="outline" text={t("plurals.card", { count: deck.cardCount })} />
        {deck.dueCount > 0 ? <Badge tone="accent" text={t("deck.detail.dueBadge", { count: deck.dueCount })} /> : null}
        {matureCount > 0 ? <Badge tone="outline" text={t("deck.detail.matureBadge", { count: matureCount })} /> : null}
      </View>
      <Button label={screen.studyLabel} onPress={screen.study} />
      {all && all.length > 0 ? (
        <>
          <View style={styles.sectionRow}>
            <Text accessibilityRole="header" style={[typography.section, { color: colors.text }]}>
              {t("deck.detail.cards")}
            </Text>
            {screen.showAll ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("deck.detail.seeAll")}
                onPress={screen.seeAll}
                hitSlop={8}
                style={styles.seeAll}
              >
                <Text style={[typography.button, { color: colors.accentInk }]}>
                  {t("deck.detail.seeAll")}
                </Text>
                <Icon name="chevron-right" size={16} color={colors.accentInk} />
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <Screen testID="deck-screen">
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("deck.detail.back")}
          onPress={screen.goHome}
          hitSlop={8}
          style={styles.back}
        >
          <Icon name="chevron-left" size={20} color={colors.accentInk} />
          <Text style={[typography.button, { color: colors.accentInk }]}>
            {t("deck.detail.back")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("deck.detail.options")}
          onPress={screen.openMenu}
          hitSlop={8}
          style={styles.more}
        >
          <Icon name="more" size={24} color={colors.text} />
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
              {t("deck.detail.empty")}
            </Text>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
      <View style={styles.fab}>
        <Fab label={t("deck.detail.addCard")} onPress={screen.addCard} />
      </View>
      <BottomSheet
        visible={screen.menuOpen}
        title={deck.name}
        subtitle={screen.sheetSubtitle}
        actions={screen.sheetActions}
        onClose={screen.closeMenu}
      />
      <ConfirmDialog
        visible={screen.deleteOpen}
        icon="trash"
        tone="destructive"
        title={t("deck.detail.deleteTitle")}
        message={screen.deleteMessage}
        confirmLabel={t("deck.detail.delete")}
        onConfirm={screen.confirmDelete}
        onCancel={screen.cancelDelete}
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
  more: {
    minHeight: sizes.minTouch,
    minWidth: sizes.minTouch,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: screenMargin,
    paddingBottom: sizes.fab + spacing.xxxl,
  },
  fab: { position: "absolute", right: screenMargin, bottom: screenMargin },
  headerContent: { gap: spacing.xl, paddingBottom: spacing.lg },
  titleBlock: { gap: spacing.sm },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: sizes.minTouch,
  },
  empty: { textAlign: "center", paddingVertical: spacing.xl },
});

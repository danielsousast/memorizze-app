import { router } from "expo-router";
import { useCallback } from "react";
import { FlatList, type ListRenderItemInfo, Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { DeckIcon } from "@/components/deck-icon/deck-icon";
import { Fab } from "@/components/fab/fab";
import { Screen } from "@/components/screen/screen";
import { formatLongDate } from "@/domain/dates";
import { t } from "@/lib/i18n";
import { radii, screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

import { useProfile } from "@/features/profile";
import { useDecks, type Deck } from "@/features/decks";

import { StreakCard } from "./streak-card";

function openCreate() {
  router.push("/decks/new");
}

function accessibilityLabel(deck: Deck): string {
  const parts = [deck.name, t("plurals.card", { count: deck.cardCount })];
  if (deck.dueCount > 0) parts.push(t("deck.home.dueLabel", { count: deck.dueCount }));
  else if (deck.cardCount > 0) parts.push(t("deck.home.upToDateLabel"));
  return parts.join(", ");
}

function greeting(name?: string): string {
  if (name) return t("deck.home.greetingNamed", { name });
  return t("deck.home.greeting");
}

function openStudyAll() {
  router.push("/study");
}

function deckKey(deck: Deck): string {
  return deck.id;
}

function DeckBadge({ deck }: { deck: Deck }) {
  if (deck.dueCount > 0) return <Badge tone="accent" text={t("deck.home.dueBadge", { count: deck.dueCount })} />;
  if (deck.cardCount > 0) return <Badge tone="neutral" icon="check" text={t("deck.home.upToDateBadge")} />;
  return null;
}

function DeckItem({ deck }: { deck: Deck }) {
  const { colors } = useTheme();
  const open = useCallback(() => {
    router.push(`/decks/${deck.id}`);
  }, [deck.id]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel(deck)}
      onPress={open}
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <DeckIcon name={deck.name} />
      <View style={styles.itemText}>
        <Text numberOfLines={1} style={[typography.button, { color: colors.text }]}>
          {deck.name}
        </Text>
        <Text style={[typography.caption, { color: colors.text2 }]}>
          {t("plurals.card", { count: deck.cardCount })}
        </Text>
      </View>
      <DeckBadge deck={deck} />
    </Pressable>
  );
}

function renderDeck({ item }: ListRenderItemInfo<Deck>) {
  return <DeckItem deck={item} />;
}

export function HomeScreen() {
  const { colors } = useTheme();
  const { data, isPending } = useDecks();
  const name = useProfile().data?.name;

  const header = (
    <View style={styles.header}>
      <Text style={[typography.caption, { color: colors.text2 }]}>
        {formatLongDate(new Date())}
      </Text>
      <Text accessibilityRole="header" style={[typography.display, { color: colors.text }]}>
        {greeting(name)}
      </Text>
    </View>
  );

  if (isPending || !data) {
    return <Screen testID="home-screen">{header}</Screen>;
  }

  if (data.length === 0) {
    return (
      <Screen testID="home-screen">
        {header}
        <StreakCard />
        <View style={styles.empty}>
          <Text style={[typography.title, { color: colors.text }]}>{t("deck.home.emptyTitle")}</Text>
          <Text style={[typography.body, styles.emptyText, { color: colors.text2 }]}>
            {t("deck.home.emptyBody")}
          </Text>
          <Button label={t("deck.home.createFirst")} icon="plus" onPress={openCreate} />
        </View>
      </Screen>
    );
  }

  const totalDue = data.reduce((sum, deck) => sum + deck.dueCount, 0);

  return (
    <Screen testID="home-screen">
      <FlatList
        data={data}
        keyExtractor={deckKey}
        renderItem={renderDeck}
        ListHeaderComponent={
          <>
            {header}
            <StreakCard>
              <View style={styles.study}>
                <Button label={t("deck.home.studyAll")} onPress={openStudyAll} />
                {totalDue > 0 ? (
                  <Badge tone="accent" text={t("plurals.card", { count: totalDue })} />
                ) : null}
              </View>
            </StreakCard>
            <View style={styles.sectionRow}>
              <Text style={[typography.section, { color: colors.text }]}>{t("deck.home.yourDecks")}</Text>
              <Text style={[typography.caption, { color: colors.text2 }]}>
                {t("plurals.deck", { count: data.length })}
              </Text>
            </View>
          </>
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
      />
      <View style={styles.fab}>
        <Fab label={t("deck.home.create")} onPress={openCreate} />
      </View>
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: spacing.md }} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: screenMargin,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  study: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: screenMargin,
    paddingBottom: spacing.lg,
  },
  list: { paddingBottom: sizes.fab + spacing.xxxl },
  item: {
    minHeight: sizes.deckCard,
    marginHorizontal: screenMargin,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  itemText: { flex: 1 },
  empty: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: screenMargin,
    paddingBottom: spacing.xxxl,
  },
  emptyText: { textAlign: "center" },
  fab: { position: "absolute", right: screenMargin, bottom: screenMargin },
});

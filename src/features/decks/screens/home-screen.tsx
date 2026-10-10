import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { DeckIcon } from "@/components/deck-icon";
import { Fab } from "@/components/fab";
import { Screen } from "@/components/screen";
import { formatLongDate } from "@/domain/dates";
import { plural } from "@/domain/text";
import { radii, screenMargin, sizes, spacing, typography, useTheme } from "@/theme";

import { useDecks, type Deck } from "@/features/decks";

import { StreakCard } from "./streak-card";

function openCreate() {
  router.push("/decks/new");
}

function accessibilityLabel(deck: Deck): string {
  const parts = [deck.name, plural(deck.cardCount, "cartão", "cartões")];
  if (deck.dueCount > 0) parts.push(`${deck.dueCount} para hoje`);
  else if (deck.cardCount > 0) parts.push("em dia");
  return parts.join(", ");
}

function DeckItem({ deck }: { deck: Deck }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel(deck)}
      onPress={() => router.push(`/decks/${deck.id}`)}
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <DeckIcon name={deck.name} />
      <View style={styles.itemText}>
        <Text numberOfLines={1} style={[typography.button, { color: colors.text }]}>
          {deck.name}
        </Text>
        <Text style={[typography.caption, { color: colors.text2 }]}>
          {plural(deck.cardCount, "cartão", "cartões")}
        </Text>
      </View>
      {deck.dueCount > 0 ? (
        <Badge tone="accent" text={`${deck.dueCount} hoje`} />
      ) : deck.cardCount > 0 ? (
        <Badge tone="neutral" icon="check" text="Em dia" />
      ) : null}
    </Pressable>
  );
}

export function HomeScreen() {
  const { colors } = useTheme();
  const { data, isPending } = useDecks();

  const header = (
    <View style={styles.header}>
      <Text style={[typography.caption, { color: colors.text2 }]}>
        {formatLongDate(new Date())}
      </Text>
      <Text accessibilityRole="header" style={[typography.display, { color: colors.text }]}>
        Olá
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
          <Text style={[typography.title, { color: colors.text }]}>Nenhum baralho ainda</Text>
          <Text style={[typography.body, styles.emptyText, { color: colors.text2 }]}>
            Crie seu primeiro baralho e adicione alguns cartões. Cinco minutos por dia já fazem
            diferença.
          </Text>
          <Button label="Criar primeiro baralho" icon="plus" onPress={openCreate} />
        </View>
      </Screen>
    );
  }

  const totalDue = data.reduce((sum, deck) => sum + deck.dueCount, 0);

  return (
    <Screen testID="home-screen">
      <FlatList
        data={data}
        keyExtractor={(deck) => deck.id}
        renderItem={({ item }) => <DeckItem deck={item} />}
        ListHeaderComponent={
          <>
            {header}
            <StreakCard />
            <View testID="study-all" style={styles.study}>
              <Button label="Estudar tudo" onPress={() => router.push("/study")} />
              {totalDue > 0 ? (
                <Badge tone="accent" text={plural(totalDue, "cartão", "cartões")} />
              ) : null}
            </View>
            <View style={styles.sectionRow}>
              <Text style={[typography.section, { color: colors.text }]}>Seus baralhos</Text>
              <Text style={[typography.caption, { color: colors.text2 }]}>
                {plural(data.length, "baralho", "baralhos")}
              </Text>
            </View>
          </>
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
      />
      <View style={styles.fab}>
        <Fab label="Criar baralho" onPress={openCreate} />
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
    paddingHorizontal: screenMargin,
    paddingBottom: spacing.xl,
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

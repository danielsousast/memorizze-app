import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { NotFound } from "@/components/not-found";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { t } from "@/lib/i18n";
import { screenMargin, spacing, typography, useTheme } from "@/theme";

import { useDeck, type Deck } from "@/features/decks";

import { leaveDeckForm, useDeckForm } from "./use-deck-form";

type Props = { deckId?: string };

export function DeckFormScreen({ deckId }: Props) {
  if (deckId === undefined) return <DeckForm />;
  return <EditDeck deckId={deckId} />;
}

function EditDeck({ deckId }: { deckId: string }) {
  const { data, isPending } = useDeck(deckId);
  if (isPending) return <Screen>{null}</Screen>;
  if (!data) {
    return (
      <Screen>
        <NotFound title={t("deck.notFound")} actionLabel={t("common.back")} onAction={leaveDeckForm} />
      </Screen>
    );
  }
  return <DeckForm deck={data} />;
}

function DeckForm({ deck }: { deck?: Deck }) {
  const { colors } = useTheme();
  const form = useDeckForm(deck);

  return (
    <Screen keyboardAvoiding>
      <View style={styles.header}>
        <Button label={t("common.cancel")} variant="text" onPress={form.cancel} />
        <Text accessibilityRole="header" style={[typography.section, { color: colors.text }]}>
          {deck ? t("deck.form.titleEdit") : t("deck.form.titleNew")}
        </Text>
        <Button label={t("common.save")} disabled={form.pending} onPress={form.submit} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TextField label={t("deck.form.name")} value={form.name} onChangeText={form.setName} error={form.nameError} autoFocus={!deck} />
        <TextField label={t("deck.form.description")} value={form.description} onChangeText={form.setDescription} multiline hint={t("common.optional")} />
        {form.formError ? (
          <Text accessibilityRole="alert" style={[typography.caption, { color: colors.grade.again.text }]}>
            {form.formError}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: screenMargin,
    paddingVertical: spacing.md,
  },
  body: { padding: screenMargin, gap: spacing.xl },
});

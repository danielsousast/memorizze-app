import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { NotFound } from "@/components/not-found";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
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
        <NotFound title="Baralho não encontrado" actionLabel="Voltar" onAction={leaveDeckForm} />
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
        <Button label="Cancelar" variant="text" onPress={form.cancel} />
        <Text accessibilityRole="header" style={[typography.section, { color: colors.text }]}>
          {deck ? "Editar baralho" : "Novo baralho"}
        </Text>
        <Button label="Salvar" disabled={form.pending} onPress={form.submit} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TextField label="Nome" value={form.name} onChangeText={form.setName} error={form.nameError} autoFocus={!deck} />
        <TextField label="Descrição" value={form.description} onChangeText={form.setDescription} multiline hint="Opcional" />
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

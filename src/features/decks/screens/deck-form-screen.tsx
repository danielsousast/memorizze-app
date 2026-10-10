import { router } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { NotFound } from "@/components/not-found";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { screenMargin, spacing, typography, useTheme } from "@/theme";

import { useCreateDeck, useDeck, useUpdateDeck, type Deck } from "@/features/decks";

const NAME_ERRORS: Record<string, string> = {
  DECK_NAME_EMPTY: "Dê um nome ao baralho.",
  DECK_NAME_DUPLICATE: "Já existe um baralho com esse nome.",
};
const GENERIC_ERROR = "Não foi possível salvar. Tente de novo.";

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

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
        <NotFound title="Baralho não encontrado" actionLabel="Voltar" onAction={leave} />
      </Screen>
    );
  }
  return <DeckForm deck={data} />;
}

function DeckForm({ deck }: { deck?: Deck }) {
  const { colors } = useTheme();
  const create = useCreateDeck();
  const update = useUpdateDeck();
  const [name, setName] = useState(deck?.name ?? "");
  const [description, setDescription] = useState(deck?.description ?? "");
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const busy = useRef(false);
  const pending = create.isPending || update.isPending;

  function onError(error: unknown) {
    const code = (error as { code?: string } | null)?.code;
    const message = code ? NAME_ERRORS[code] : undefined;
    if (message) setNameError(message);
    else setFormError(GENERIC_ERROR);
  }

  async function save() {
    if (busy.current) return;
    busy.current = true;
    setNameError(undefined);
    setFormError(undefined);
    const text = description.trim();
    try {
      if (deck) {
        await update.mutateAsync({ id: deck.id, input: { name, description: text } });
        router.dismiss();
      } else {
        const created = await create.mutateAsync({ name, description: text || undefined });
        router.dismiss();
        router.push(`/decks/${created.id}`);
      }
    } catch (error) {
      onError(error);
    } finally {
      busy.current = false;
    }
  }

  return (
    <Screen keyboardAvoiding>
      <View style={styles.header}>
        <Button label="Cancelar" variant="text" onPress={leave} />
        <Text accessibilityRole="header" style={[typography.section, { color: colors.text }]}>
          {deck ? "Editar baralho" : "Novo baralho"}
        </Text>
        <Button label="Salvar" disabled={pending} onPress={save} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TextField label="Nome" value={name} onChangeText={setName} error={nameError} autoFocus={!deck} />
        <TextField label="Descrição" value={description} onChangeText={setDescription} multiline hint="Opcional" />
        {formError ? (
          <Text accessibilityRole="alert" style={[typography.caption, { color: colors.grade.again.text }]}>
            {formError}
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

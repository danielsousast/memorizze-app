import { ScrollView, StyleSheet, Text, View, type TextInput } from "react-native";

import { Button } from "@/components/button";
import { DeckIcon } from "@/components/deck-icon";
import { Icon } from "@/components/icon";
import { NotFound } from "@/components/not-found";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { useDeck } from "@/features/decks";
import { radii, screenMargin, spacing, typography, useTheme } from "@/theme";

import { useCard, useDeleteCard } from "@/features/cards";
import type { Card } from "@/features/cards";

import { closeToHome, type FieldErrors } from "./card-form";
import { useCreateCardForm } from "./use-create-card-form";
import { useEditCardForm } from "./use-edit-card-form";

type Props = { deckId: string } | { cardId: string };

export function CardEditorScreen(props: Props) {
  if ("cardId" in props) return <EditCard cardId={props.cardId} />;
  return <CreateCard deckId={props.deckId} />;
}

function CreateCard({ deckId }: { deckId: string }) {
  const deck = useDeck(deckId);

  if (deck.isPending) {
    return <Screen>{null}</Screen>;
  }
  if (deck.data === null || deck.data === undefined) {
    return (
      <Screen>
        <NotFound
          title="Baralho não encontrado"
          actionLabel="Voltar"
          onAction={closeToHome}
        />
      </Screen>
    );
  }
  return <CreateCardForm deckId={deckId} deckName={deck.data.name} />;
}

// Edit mode: the card carries no deck reference, so the deck chip is omitted and
// closing falls back to Início when there is nothing to go back to.
function EditCard({ cardId }: { cardId: string }) {
  const card = useCard(cardId);
  const remove = useDeleteCard();

  // After a successful delete the card query refetches to null; do not flash NotFound.
  if (card.isPending || remove.isSuccess) {
    return <Screen>{null}</Screen>;
  }
  if (card.data === null || card.data === undefined) {
    return (
      <Screen>
        <NotFound
          title="Cartão não encontrado"
          actionLabel="Voltar"
          onAction={closeToHome}
        />
      </Screen>
    );
  }
  return <EditCardForm card={card.data} remove={remove} />;
}

function EditCardForm({
  card,
  remove,
}: {
  card: Card;
  remove: ReturnType<typeof useDeleteCard>;
}) {
  const form = useEditCardForm(card, remove);
  return (
    <CardEditorForm
      title="Editar cartão"
      front={form.front}
      back={form.back}
      onFrontChange={form.setFront}
      onBackChange={form.setBack}
      errors={form.errors}
      formError={form.formError}
      pending={form.pending}
      onCancel={form.cancel}
      onSave={form.save}
      onDelete={form.confirmDelete}
    />
  );
}

function CreateCardForm({ deckId, deckName }: { deckId: string; deckName: string }) {
  const form = useCreateCardForm(deckId);
  return (
    <CardEditorForm
      title="Novo cartão"
      deckName={deckName}
      front={form.front}
      back={form.back}
      onFrontChange={form.setFront}
      onBackChange={form.setBack}
      frontRef={form.frontRef}
      errors={form.errors}
      formError={form.formError}
      pending={form.pending}
      onCancel={form.cancel}
      onSave={form.save}
      onSaveAnother={form.saveAnother}
    />
  );
}

type FormProps = {
  title: string;
  /** Omit to hide the deck chip (edit mode). */
  deckName?: string;
  front: string;
  back: string;
  onFrontChange: (text: string) => void;
  onBackChange: (text: string) => void;
  frontRef?: React.Ref<TextInput>;
  errors: FieldErrors;
  formError?: string;
  pending: boolean;
  onCancel: () => void;
  onSave: () => void;
  /** Omit to hide `Salvar e criar outro` (edit mode). */
  onSaveAnother?: () => void;
  /** Provide to show `Excluir cartão` (edit mode). */
  onDelete?: () => void;
};

function CardEditorForm(props: FormProps) {
  const { colors } = useTheme();
  return (
    <Screen keyboardAvoiding>
      <View style={styles.header}>
        <Button label="Cancelar" variant="text" onPress={props.onCancel} />
        <Text accessibilityRole="header" style={[typography.section, { color: colors.text }]}>
          {props.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {props.deckName ? (
          <View style={[styles.deckChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DeckIcon name={props.deckName} />
            <Text style={[typography.button, { color: colors.text }]}>{props.deckName}</Text>
          </View>
        ) : null}
        <TextField
          label="Frente"
          hint="Pergunta ou termo"
          multiline
          inputRef={props.frontRef}
          value={props.front}
          onChangeText={props.onFrontChange}
          error={props.errors.front}
        />
        <TextField
          label="Verso"
          hint="Resposta"
          multiline
          value={props.back}
          onChangeText={props.onBackChange}
          error={props.errors.back}
        />
        <View style={styles.tip}>
          <Icon name="bulb" color={colors.text2} />
          <Text style={[typography.body, styles.tipText, { color: colors.text2 }]}>
            Uma ideia por cartão deixa a revisão mais rápida.
          </Text>
        </View>
        {props.formError ? (
          <Text
            accessibilityRole="alert"
            style={[typography.caption, { color: colors.grade.again.text }]}
          >
            {props.formError}
          </Text>
        ) : null}
        <Button label="Salvar" onPress={props.onSave} disabled={props.pending} />
        {props.onSaveAnother ? (
          <Button
            label="Salvar e criar outro"
            variant="text"
            onPress={props.onSaveAnother}
            disabled={props.pending}
          />
        ) : null}
        {props.onDelete ? (
          <Button
            label="Excluir cartão"
            variant="danger"
            onPress={props.onDelete}
            disabled={props.pending}
          />
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
    paddingHorizontal: spacing.sm,
  },
  headerSpacer: { minWidth: 88 },
  content: { padding: screenMargin, gap: spacing.xl },
  deckChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.md,
    padding: spacing.sm,
    paddingRight: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.pill,
  },
  tip: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  tipText: { flex: 1 },
});

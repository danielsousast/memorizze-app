import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View, type TextInput } from "react-native";

import { Button } from "@/components/button";
import { DeckIcon } from "@/components/deck-icon";
import { Icon } from "@/components/icon";
import { NotFound } from "@/components/not-found";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { AppError } from "@/domain/errors";
import { useDeck } from "@/features/decks";
import { radii, screenMargin, spacing, typography, useTheme } from "@/theme";

import { useCard, useCreateCard, useDeleteCard, useUpdateCard } from "@/features/cards";
import type { Card } from "@/features/cards";

type Props = { deckId: string } | { cardId: string };

type FieldErrors = { front?: string; back?: string };

const GENERIC_ERROR = "Não foi possível salvar. Tente de novo.";

function closeEditor(fallbackHref: string) {
  if (router.canGoBack()) router.back();
  else router.replace(fallbackHref as never);
}

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
          onAction={() => closeEditor("/")}
        />
      </Screen>
    );
  }
  return <CreateCardForm deckId={deckId} deckName={deck.data.name} />;
}

function toFieldErrors(error: unknown): { errors?: FieldErrors; formError?: string } {
  if (error instanceof AppError && error.code === "CARD_FRONT_EMPTY") {
    return { errors: { front: "Escreva a frente do cartão." } };
  }
  if (error instanceof AppError && error.code === "CARD_BACK_EMPTY") {
    return { errors: { back: "Escreva o verso do cartão." } };
  }
  return { formError: GENERIC_ERROR };
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
          onAction={() => closeEditor("/")}
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
  const update = useUpdateCard();
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const busy = useRef(false);

  function save() {
    if (busy.current) return;
    busy.current = true;
    setErrors({});
    setFormError(undefined);
    update.mutate(
      { id: card.id, input: { front, back } },
      {
        onSuccess: () => closeEditor("/"),
        onError: (error) => {
          const mapped = toFieldErrors(error);
          setErrors(mapped.errors ?? {});
          setFormError(mapped.formError);
        },
        onSettled: () => {
          busy.current = false;
        },
      },
    );
  }

  function confirmDelete() {
    if (busy.current) return;
    Alert.alert("Excluir cartão?", undefined, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          if (busy.current) return;
          busy.current = true;
          setFormError(undefined);
          remove.mutate(card.id, {
            onSuccess: () => closeEditor("/"),
            onError: () => setFormError("Não foi possível excluir. Tente de novo."),
            onSettled: () => {
              busy.current = false;
            },
          });
        },
      },
    ]);
  }

  return (
    <CardEditorForm
      title="Editar cartão"
      front={front}
      back={back}
      onFrontChange={setFront}
      onBackChange={setBack}
      errors={errors}
      formError={formError}
      pending={update.isPending || remove.isPending}
      onCancel={() => closeEditor("/")}
      onSave={save}
      onDelete={confirmDelete}
    />
  );
}

function CreateCardForm({ deckId, deckName }: { deckId: string; deckName: string }) {
  const create = useCreateCard();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const frontRef = useRef<TextInput>(null);
  const busy = useRef(false);

  function submit(another: boolean) {
    if (busy.current) return;
    busy.current = true;
    setErrors({});
    setFormError(undefined);
    create.mutate(
      { deckId, input: { front, back } },
      {
        onSuccess: () => {
          if (another) {
            setFront("");
            setBack("");
            frontRef.current?.focus();
          } else {
            closeEditor(`/decks/${deckId}`);
          }
        },
        onError: (error) => {
          const mapped = toFieldErrors(error);
          setErrors(mapped.errors ?? {});
          setFormError(mapped.formError);
        },
        onSettled: () => {
          busy.current = false;
        },
      },
    );
  }

  return (
    <CardEditorForm
      title="Novo cartão"
      deckName={deckName}
      front={front}
      back={back}
      onFrontChange={setFront}
      onBackChange={setBack}
      frontRef={frontRef}
      errors={errors}
      formError={formError}
      pending={create.isPending}
      onCancel={() => closeEditor(`/decks/${deckId}`)}
      onSave={() => submit(false)}
      onSaveAnother={() => submit(true)}
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

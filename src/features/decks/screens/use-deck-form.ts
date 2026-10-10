import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useCreateDeck, useUpdateDeck, type Deck } from "@/features/decks";

const NAME_ERRORS: Record<string, string> = {
  DECK_NAME_EMPTY: "Dê um nome ao baralho.",
  DECK_NAME_DUPLICATE: "Já existe um baralho com esse nome.",
};
const GENERIC_ERROR = "Não foi possível salvar. Tente de novo.";

export function leaveDeckForm() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export function useDeckForm(deck?: Deck) {
  const create = useCreateDeck();
  const update = useUpdateDeck();
  const [name, setName] = useState(deck?.name ?? "");
  const [description, setDescription] = useState(deck?.description ?? "");
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const busy = useRef(false);

  const submit = useCallback(async () => {
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
      const code = (error as { code?: string } | null)?.code;
      const message = code ? NAME_ERRORS[code] : undefined;
      if (message) setNameError(message);
      else setFormError(GENERIC_ERROR);
    } finally {
      busy.current = false;
    }
  }, [deck, create, update, name, description]);

  return {
    name,
    description,
    nameError,
    formError,
    pending: create.isPending || update.isPending,
    setName,
    setDescription,
    submit,
    cancel: leaveDeckForm,
  };
}

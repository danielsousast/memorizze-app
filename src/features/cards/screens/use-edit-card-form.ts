import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";

import { useUpdateCard, type Card, type useDeleteCard } from "@/features/cards";

import { closeToHome, toFieldErrors, type FieldErrors } from "./card-form";

export function useEditCardForm(card: Card, remove: ReturnType<typeof useDeleteCard>) {
  const update = useUpdateCard();
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const busy = useRef(false);

  const save = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setErrors({});
    setFormError(undefined);
    update.mutate(
      { id: card.id, input: { front, back } },
      {
        onSuccess: closeToHome,
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
  }, [update, card.id, front, back]);

  const deleteCard = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setFormError(undefined);
    remove.mutate(card.id, {
      onSuccess: closeToHome,
      onError: () => setFormError("Não foi possível excluir. Tente de novo."),
      onSettled: () => {
        busy.current = false;
      },
    });
  }, [remove, card.id]);

  const confirmDelete = useCallback(() => {
    if (busy.current) return;
    Alert.alert("Excluir cartão?", undefined, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: deleteCard },
    ]);
  }, [deleteCard]);

  return {
    front,
    back,
    errors,
    formError,
    pending: update.isPending || remove.isPending,
    setFront,
    setBack,
    cancel: closeToHome,
    save,
    confirmDelete,
  };
}

import { useCallback, useRef, useState } from "react";

import { t } from "@/lib/i18n";
import { useUpdateCard, type Card, type useDeleteCard } from "@/features/cards";

import { closeToHome, toFieldErrors, type FieldErrors } from "./card-form";

export function useEditCardForm(card: Card, remove: ReturnType<typeof useDeleteCard>) {
  const update = useUpdateCard();
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [confirming, setConfirming] = useState(false);
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
    setConfirming(false);
    if (busy.current) return;
    busy.current = true;
    setFormError(undefined);
    remove.mutate(card.id, {
      onSuccess: closeToHome,
      onError: () => setFormError(t("card.deleteFailed")),
      onSettled: () => {
        busy.current = false;
      },
    });
  }, [remove, card.id]);

  const confirmDelete = useCallback(() => {
    if (busy.current) return;
    setConfirming(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setConfirming(false);
  }, []);

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
    confirming,
    confirmDelete,
    cancelDelete,
    deleteCard,
  };
}

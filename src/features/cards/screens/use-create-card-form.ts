import { useCallback, useRef, useState } from "react";
import type { TextInput } from "react-native";

import { useCreateCard } from "@/features/cards";

import { closeEditor, toFieldErrors, type FieldErrors } from "./card-form";

export function useCreateCardForm(deckId: string) {
  const create = useCreateCard();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const frontRef = useRef<TextInput>(null);
  const busy = useRef(false);

  const submit = useCallback(
    (another: boolean) => {
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
    },
    [create, deckId, front, back],
  );

  const save = useCallback(() => submit(false), [submit]);
  const saveAnother = useCallback(() => submit(true), [submit]);
  const cancel = useCallback(() => closeEditor(`/decks/${deckId}`), [deckId]);

  return {
    front,
    back,
    errors,
    formError,
    pending: create.isPending,
    frontRef,
    setFront,
    setBack,
    cancel,
    save,
    saveAnother,
  };
}

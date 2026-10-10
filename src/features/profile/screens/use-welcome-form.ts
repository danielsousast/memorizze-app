import { useCallback, useRef, useState } from "react";

import { useCreateProfile } from "../usecases/use-create-profile";
import { GENERIC_ERROR, nameErrorMessage } from "./name-errors";

export function useWelcomeForm() {
  const create = useCreateProfile();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const busy = useRef(false);

  const submit = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setNameError(undefined);
    setFormError(undefined);
    try {
      await create.mutateAsync(name);
    } catch (error) {
      const message = nameErrorMessage(error);
      if (message) setNameError(message);
      else setFormError(GENERIC_ERROR);
    } finally {
      busy.current = false;
    }
  }, [create, name]);

  return { name, nameError, formError, pending: create.isPending, setName, submit };
}

import { useCallback, useRef, useState } from "react";

import { useImportFlow } from "@/features/backup";

import { useCreateProfile } from "../usecases/use-create-profile";
import { GENERIC_ERROR, nameErrorMessage } from "./name-errors";

export function useWelcomeForm() {
  const create = useCreateProfile();
  const importFlow = useImportFlow();
  const { start: startImport } = importFlow;
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

  const importBackup = useCallback(() => void startImport(), [startImport]);

  return {
    importBackup,
    importBusy: importFlow.busy,
    importDialog: importFlow.dialog,
    name,
    nameError,
    formError,
    pending: create.isPending,
    setName,
    submit,
  };
}

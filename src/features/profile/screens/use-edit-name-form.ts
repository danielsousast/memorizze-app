import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useProfile } from "../usecases/use-profile";
import { useUpdateProfile } from "../usecases/use-update-profile";
import { GENERIC_ERROR, nameErrorMessage } from "./name-errors";

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace("/profile");
}

export function useEditNameForm() {
  const profile = useProfile().data;
  const update = useUpdateProfile();
  const [name, setName] = useState(profile?.name ?? "");
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const busy = useRef(false);

  const submit = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setNameError(undefined);
    setFormError(undefined);
    try {
      await update.mutateAsync({ name });
      leave();
    } catch (error) {
      const message = nameErrorMessage(error);
      if (message) setNameError(message);
      else setFormError(GENERIC_ERROR);
    } finally {
      busy.current = false;
    }
  }, [update, name]);

  return { name, nameError, formError, pending: update.isPending, setName, submit, cancel: leave };
}

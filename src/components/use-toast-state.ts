import { useCallback, useEffect, useRef, useState } from "react";

export const TOAST_DURATION_MS = 4000;

export type ToastOptions = {
  message: string;
  action?: { label: string; onPress: () => void };
};

export function useToastState() {
  const [toast, setToast] = useState<ToastOptions>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clear = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const hide = useCallback(() => {
    clear();
    setToast(undefined);
  }, [clear]);

  const show = useCallback(
    (options: ToastOptions) => {
      clear();
      setToast(options);
      timer.current = setTimeout(hide, TOAST_DURATION_MS);
    },
    [clear, hide],
  );

  useEffect(() => clear, [clear]);

  return { toast, show, hide };
}

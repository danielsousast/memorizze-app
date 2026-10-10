import { createContext, type ReactNode, useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/theme";

import { Toast } from "./toast";
import { type ToastOptions, useToastState } from "./use-toast-state";

type ToastApi = { show: (options: ToastOptions) => void; hide: () => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside ToastProvider");
  return api;
}

/**
 * Renders one toast above the app. A `Modal` (BottomSheet, ConfirmDialog) covers it,
 * so a sheet action closes the sheet before it calls `show`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { toast, show, hide } = useToastState();
  const { bottom } = useSafeAreaInsets();
  const api = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.layer, { bottom: bottom + spacing.lg }]}>
          <Toast message={toast.message} action={toast.action} onHide={hide} />
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", left: spacing.lg, right: spacing.lg },
});

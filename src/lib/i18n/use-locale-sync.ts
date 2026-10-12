import { useEffect } from "react";
import { AppState } from "react-native";

import { syncLocale } from "./index";

export function useLocaleSync() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") syncLocale();
    });
    return () => subscription.remove();
  }, []);
}

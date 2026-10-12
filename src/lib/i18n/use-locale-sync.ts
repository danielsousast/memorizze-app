import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { i18n, syncLocale } from "./index";

/**
 * Re-reads the device locale whenever the app returns to the foreground and returns it,
 * so a consumer can use it as a `key` to remount translated screens (I18NS-09).
 */
export function useLocaleSync() {
  const [locale, setLocale] = useState(i18n.locale);

  useEffect(() => {
    function handleChange(state: AppStateStatus) {
      if (state !== "active") return;
      syncLocale();
      setLocale(i18n.locale);
    }
    const subscription = AppState.addEventListener("change", handleChange);
    return () => subscription.remove();
  }, []);

  return locale;
}

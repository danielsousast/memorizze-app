import { useLayoutEffect } from "react";
import { Appearance } from "react-native";

import { colorSchemeFor, type ThemePreference } from "@/domain/preferences";

/**
 * Forces the saved theme on the whole app, or hands the choice back to the system
 * (`Automático`, or no profile). Runs before the first paint with a profile (THM-04).
 */
export function useApplyTheme(preference: ThemePreference | undefined) {
  useLayoutEffect(() => {
    Appearance.setColorScheme(colorSchemeFor(preference));
  }, [preference]);
}

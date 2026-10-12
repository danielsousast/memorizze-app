import { t } from "@/lib/i18n";

export type ThemePreference = "system" | "light" | "dark";

/** `null` = no limit. */
export type NewCardsLimit = 5 | 10 | 20 | 30 | 50 | null;

export const THEME_OPTIONS: readonly ThemePreference[] = ["system", "light", "dark"];

// Getters resolve the text at read time, so a locale change shows on the next read.
export const themeLabel: Record<ThemePreference, string> = {
  get system() {
    return t("theme.system");
  },
  get light() {
    return t("theme.light");
  },
  get dark() {
    return t("theme.dark");
  },
};

export const NEW_CARDS_OPTIONS: readonly NewCardsLimit[] = [5, 10, 20, 30, 50, null];

export const DEFAULT_THEME: ThemePreference = "system";
export const DEFAULT_NEW_CARDS_LIMIT: NewCardsLimit = 10;

export function newCardsLabel(limit: NewCardsLimit): string {
  return limit === null ? t("newCards.noLimit") : String(limit);
}

/** The scheme to force, or `"unspecified"` to follow the system (`Appearance.setColorScheme`). */
export function colorSchemeFor(
  preference: ThemePreference | undefined,
): "light" | "dark" | "unspecified" {
  if (preference === "light" || preference === "dark") return preference;
  return "unspecified";
}

export function parseTheme(stored: string): ThemePreference {
  return THEME_OPTIONS.find((option) => option === stored) ?? DEFAULT_THEME;
}

export function isNewCardsLimit(value: unknown): value is NewCardsLimit {
  return NEW_CARDS_OPTIONS.some((option) => option === value);
}

// Realm stores the limit as an int; 0 stands for "no limit".
export function limitFromStored(stored: number): NewCardsLimit {
  if (stored === 0) return null;
  return isNewCardsLimit(stored) ? stored : DEFAULT_NEW_CARDS_LIMIT;
}

export function limitToStored(limit: NewCardsLimit): number {
  return limit ?? 0;
}

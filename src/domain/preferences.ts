export type ThemePreference = "system" | "light" | "dark";

/** `null` = no limit. */
export type NewCardsLimit = 5 | 10 | 20 | 30 | 50 | null;

export const THEME_OPTIONS: readonly ThemePreference[] = ["system", "light", "dark"];

export const themeLabel: Record<ThemePreference, string> = {
  system: "Automático",
  light: "Claro",
  dark: "Escuro",
};

export const NEW_CARDS_OPTIONS: readonly NewCardsLimit[] = [5, 10, 20, 30, 50, null];

export const DEFAULT_THEME: ThemePreference = "system";
export const DEFAULT_NEW_CARDS_LIMIT: NewCardsLimit = 10;

export function newCardsLabel(limit: NewCardsLimit): string {
  return limit === null ? "Sem limite" : String(limit);
}

/** The scheme to force, or `null` to follow the system. */
export function colorSchemeFor(preference: ThemePreference | undefined): "light" | "dark" | null {
  if (preference === "light" || preference === "dark") return preference;
  return null;
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

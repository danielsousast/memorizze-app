export type AppLocale = "pt-BR" | "en" | "es";

export const DEFAULT_LOCALE: AppLocale = "pt-BR";

export function resolveLocale(tag: string | undefined): AppLocale {
  const language = tag?.split(/[-_]/)[0]?.toLowerCase();
  if (language === "en") return "en";
  if (language === "es") return "es";
  return DEFAULT_LOCALE;
}

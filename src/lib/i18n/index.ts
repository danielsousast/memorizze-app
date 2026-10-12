import { getLocales } from "expo-localization";
import { I18n, type Dict } from "i18n-js";

import { DEFAULT_LOCALE, resolveLocale } from "@/domain/locale";

import en from "./locales/en.json";
import es from "./locales/es.json";
import ptBR from "./locales/pt-BR.json";

function deviceLocale() {
  return resolveLocale(getLocales()[0]?.languageTag);
}

export function createI18n(translations: Dict) {
  return new I18n(translations, {
    defaultLocale: DEFAULT_LOCALE,
    enableFallback: true,
    locale: deviceLocale(),
  });
}

export const i18n = createI18n({ "pt-BR": ptBR, en, es });

export function syncLocale() {
  i18n.locale = deviceLocale();
}

export const t = i18n.t.bind(i18n);

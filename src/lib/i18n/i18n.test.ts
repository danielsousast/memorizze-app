import { getLocales } from "expo-localization";

import { createI18n } from "./index";

const mockGetLocales = getLocales as jest.Mock;

function loadModule() {
  let mod: typeof import("./index");
  jest.isolateModules(() => {
    mod = require("./index");
  });
  return mod!;
}

afterEach(() => {
  mockGetLocales.mockReturnValue([{ languageTag: "pt-BR" }]);
});

describe("i18n instance", () => {
  it("uses pt-BR when the device is pt-BR", () => {
    mockGetLocales.mockReturnValue([{ languageTag: "pt-BR" }]);
    expect(loadModule().i18n.locale).toBe("pt-BR");
  });

  it("uses en when the device is en-US", () => {
    mockGetLocales.mockReturnValue([{ languageTag: "en-US" }]);
    expect(loadModule().i18n.locale).toBe("en");
  });

  it("falls back to the pt-BR text when the active catalog lacks the key", () => {
    mockGetLocales.mockReturnValue([{ languageTag: "en-US" }]);
    const i18n = createI18n({
      "pt-BR": { x: "texto" },
      en: {},
    });
    expect(i18n.t("x")).toBe("texto");
  });

  it("uses es when the device is es-MX", () => {
    mockGetLocales.mockReturnValue([{ languageTag: "es-MX" }]);
    expect(loadModule().i18n.locale).toBe("es");
  });

  it("falls back to the pt-BR text when es lacks the key", () => {
    mockGetLocales.mockReturnValue([{ languageTag: "es-ES" }]);
    const i18n = createI18n({ "pt-BR": { x: "texto" }, en: {}, es: {} });
    expect(i18n.t("x")).toBe("texto");
  });

  it("ships catalogs with the same keys and no empty values", () => {
    const keys = (value: object, prefix = ""): string[] =>
      Object.entries(value).flatMap(([key, child]) =>
        typeof child === "object" && child !== null
          ? keys(child, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      );
    const ptBR = require("./locales/pt-BR.json");
    const en = require("./locales/en.json");
    const es = require("./locales/es.json");
    expect(keys(en).sort()).toEqual(keys(ptBR).sort());
    expect(keys(es).sort()).toEqual(keys(ptBR).sort());
    for (const catalog of [en, es]) {
      expect(JSON.stringify(catalog)).not.toMatch(/:\s*""/);
    }
  });
});

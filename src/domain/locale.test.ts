import { resolveLocale } from "./locale";

describe("resolveLocale", () => {
  it.each(["pt-BR", "pt-PT", "pt"])("maps %s to pt-BR", (tag) => {
    expect(resolveLocale(tag)).toBe("pt-BR");
  });

  it.each(["en-US", "en-GB", "en"])("maps %s to en", (tag) => {
    expect(resolveLocale(tag)).toBe("en");
  });

  it.each(["es-ES", "", undefined])("falls back to pt-BR for %p", (tag) => {
    expect(resolveLocale(tag)).toBe("pt-BR");
  });
});

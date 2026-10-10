import {
  DEFAULT_NEW_CARDS_LIMIT,
  DEFAULT_THEME,
  NEW_CARDS_OPTIONS,
  THEME_OPTIONS,
  colorSchemeFor,
  isNewCardsLimit,
  limitFromStored,
  limitToStored,
  newCardsLabel,
  parseTheme,
  themeLabel,
} from "./preferences";

describe("preferences", () => {
  it("NEW-07 defaults to system theme and 10 new cards", () => {
    expect(DEFAULT_THEME).toBe("system");
    expect(DEFAULT_NEW_CARDS_LIMIT).toBe(10);
  });

  it("NEW-07 offers 5, 10, 20, 30, 50 and no limit", () => {
    expect(NEW_CARDS_OPTIONS).toEqual([5, 10, 20, 30, 50, null]);
    expect(NEW_CARDS_OPTIONS.map(newCardsLabel)).toEqual([
      "5",
      "10",
      "20",
      "30",
      "50",
      "Sem limite",
    ]);
  });

  it("THM-01 offers Automático, Claro and Escuro", () => {
    expect(THEME_OPTIONS).toEqual(["system", "light", "dark"]);
    expect(THEME_OPTIONS.map((t) => themeLabel[t])).toEqual(["Automático", "Claro", "Escuro"]);
  });

  it("THM-03 maps system (or no profile) to null so the OS decides", () => {
    expect(colorSchemeFor("system")).toBeNull();
    expect(colorSchemeFor(undefined)).toBeNull();
    expect(colorSchemeFor("light")).toBe("light");
    expect(colorSchemeFor("dark")).toBe("dark");
  });

  it("parses a stored theme and falls back to system", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("sepia")).toBe("system");
  });

  it("maps the stored limit 0 to no limit and back", () => {
    expect(limitFromStored(0)).toBeNull();
    expect(limitFromStored(20)).toBe(20);
    expect(limitFromStored(7)).toBe(10);
    expect(limitToStored(null)).toBe(0);
    expect(limitToStored(50)).toBe(50);
  });

  it("validates a limit against the options", () => {
    expect(isNewCardsLimit(null)).toBe(true);
    expect(isNewCardsLimit(30)).toBe(true);
    expect(isNewCardsLimit(7)).toBe(false);
    expect(isNewCardsLimit(0)).toBe(false);
    expect(isNewCardsLimit("10")).toBe(false);
  });
});

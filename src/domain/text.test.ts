import { initials, matches, plural, searchKey } from "./text";

describe("initials", () => {
  it.each([
    ["Inglês — Verbos", "IN"],
    ["JavaScript", "JA"],
    ["é", "É"],
    ["42 respostas", "RE"],
    ["123", "#"],
  ])("initials(%j) = %j (INI-01)", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });

  it("falls back to # for empty or symbol-only names", () => {
    expect(initials("")).toBe("#");
    expect(initials("— !")).toBe("#");
  });
});

describe("plural", () => {
  it("picks singular only for exactly 1", () => {
    expect(plural(1, "cartão", "cartões")).toBe("1 cartão");
    expect(plural(0, "cartão", "cartões")).toBe("0 cartões");
    expect(plural(2, "cartão", "cartões")).toBe("2 cartões");
  });
});

describe("searchKey", () => {
  it("lowercases, strips accents and trims", () => {
    expect(searchKey("  FÁCIL Ção ")).toBe("facil cao");
  });
});

describe("matches", () => {
  it("ignores case (DECK-04)", () => {
    expect(matches("ESQUE", "esquecer")).toBe(true);
  });

  it("ignores accents (DECK-04)", () => {
    expect(matches("facil", "fácil")).toBe(true);
  });

  it("matches everything on a blank query (DECK-04)", () => {
    expect(matches("  ", "x")).toBe(true);
  });

  it("matches on any field and rejects when none match (DECK-04)", () => {
    expect(matches("b", "a", "xbx")).toBe(true);
    expect(matches("zz", "a", "b")).toBe(false);
  });
});

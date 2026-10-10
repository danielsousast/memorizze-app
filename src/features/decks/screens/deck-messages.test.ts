import { deckSheetSubtitle, deleteDeckMessage } from "./deck-messages";

describe("deleteDeckMessage", () => {
  it("DEL-01 omits the cards for an empty deck", () =>
    expect(deleteDeckMessage("Inglês", 0)).toBe(
      "“Inglês” será apagado deste aparelho. Não dá para desfazer.",
    ));
  it("DEL-01 uses the singular for one card", () =>
    expect(deleteDeckMessage("Inglês", 1)).toBe(
      "“Inglês” e seu único cartão serão apagados deste aparelho. Não dá para desfazer.",
    ));
  it("DEL-01 counts the cards otherwise", () =>
    expect(deleteDeckMessage("Inglês", 142)).toBe(
      "“Inglês” e seus 142 cartões serão apagados deste aparelho. Não dá para desfazer.",
    ));
});

describe("deckSheetSubtitle", () => {
  it("MENU-01 adds the due count when above zero", () =>
    expect(deckSheetSubtitle(142, 12)).toBe("142 cartões · 12 para hoje"));
  it("MENU-01 omits the due count at zero", () =>
    expect(deckSheetSubtitle(1, 0)).toBe("1 cartão"));
});

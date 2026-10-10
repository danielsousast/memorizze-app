import { deleteDeckMessage } from "./deck-messages";

describe("deleteDeckMessage", () => {
  it("has no message for an empty deck", () => expect(deleteDeckMessage(0)).toBeUndefined());
  it("uses the singular for one card", () =>
    expect(deleteDeckMessage(1)).toBe("O único cartão deste baralho também será excluído."));
  it("counts the cards otherwise", () =>
    expect(deleteDeckMessage(4)).toBe("Os 4 cartões deste baralho também serão excluídos."));
});

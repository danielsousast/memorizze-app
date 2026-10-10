import { render, screen } from "@testing-library/react-native";

import { DeckIcon } from "./deck-icon";

describe("DeckIcon", () => {
  it("shows the first two letters of a single word, upper-cased", async () => {
    await render(<DeckIcon name="Inglês" />);
    expect(screen.getByText("IN")).toBeTruthy();
  });

  it("shows the first letters of the first two words", async () => {
    await render(<DeckIcon name="Java Script" />);
    expect(screen.getByText("JS")).toBeTruthy();
  });
});

import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { Fab } from "./fab";

describe("Fab", () => {
  it("is an accessible button with label and a 44pt target (A11Y-01)", async () => {
    const onPress = jest.fn();
    await render(<Fab label="Criar baralho" onPress={onPress} />);
    const fab = screen.getByRole("button", { name: "Criar baralho" });
    expect(fab.props.accessibilityLabel).toBe("Criar baralho");
    const style = StyleSheet.flatten(fab.props.style);
    expect(style.minHeight ?? style.height).toBeGreaterThanOrEqual(44);
    await fireEvent.press(fab);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows the extended text when given", async () => {
    await render(<Fab label="Adicionar cartão" text="Adicionar cartão" onPress={jest.fn()} />);
    expect(screen.getByText("Adicionar cartão")).toBeTruthy();
  });
});

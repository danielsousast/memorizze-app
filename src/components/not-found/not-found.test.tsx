import { fireEvent, render, screen } from "@testing-library/react-native";

import { NotFound } from "./not-found";

describe("NotFound", () => {
  it("shows the title and a labelled action button (A11Y-01)", async () => {
    const onAction = jest.fn();
    await render(<NotFound title="Baralho não encontrado" actionLabel="Voltar" onAction={onAction} />);
    expect(screen.getByText("Baralho não encontrado")).toBeTruthy();
    const button = screen.getByRole("button", { name: "Voltar" });
    expect(button.props.accessibilityLabel).toBe("Voltar");
    await fireEvent.press(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen } from "@testing-library/react-native";

import { SettingsRow } from "./settings-row";

describe("SettingsRow", () => {
  it("NEW-01 shows title, value and is labelled with both", async () => {
    await render(<SettingsRow title="Cartões novos por dia" value="10" onPress={jest.fn()} />);
    expect(screen.getByText("Cartões novos por dia")).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cartões novos por dia, 10" })).toBeTruthy();
  });

  it("shows an optional subtitle and works without a value", async () => {
    await render(<SettingsRow title="Backup" subtitle="Último backup" onPress={jest.fn()} />);
    expect(screen.getByText("Último backup")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Backup" })).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await render(<SettingsRow title="Horário" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Horário" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen } from "@testing-library/react-native";

import { SettingsSwitchRow } from "./settings-switch-row";

describe("SettingsSwitchRow", () => {
  it("CONTRACT exposes a switch with the title as label and the checked state", async () => {
    await render(
      <SettingsSwitchRow title="Lembrete diário" subtitle="Notificação local" value onValueChange={jest.fn()} />,
    );
    expect(screen.getByText("Lembrete diário")).toBeTruthy();
    expect(screen.getByText("Notificação local")).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Lembrete diário", checked: true })).toBeTruthy();
  });

  it("shows an unchecked switch and works without a subtitle", async () => {
    await render(<SettingsSwitchRow title="Lembrete diário" value={false} onValueChange={jest.fn()} />);
    expect(screen.getByRole("switch", { name: "Lembrete diário", checked: false })).toBeTruthy();
  });

  it("calls onValueChange with the new value", async () => {
    const onValueChange = jest.fn();
    await render(<SettingsSwitchRow title="Lembrete diário" value={false} onValueChange={onValueChange} />);
    await fireEvent(screen.getByRole("switch", { name: "Lembrete diário" }), "valueChange", true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});

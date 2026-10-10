import { fireEvent, render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { StyleSheet } from "react-native";

import { darkColors, lightColors } from "@/theme";

import { ConfirmDialog } from "./confirm-dialog";

function setup(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const element = (
    <ConfirmDialog
      visible
      title="Excluir baralho?"
      message="Não dá para desfazer."
      confirmLabel="Excluir baralho"
      icon="trash"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  );
  return { onConfirm, onCancel, element };
}

function confirmBackground() {
  const button = screen.getByRole("button", { name: "Excluir baralho" });
  return StyleSheet.flatten(button.props.style).backgroundColor;
}

describe("ConfirmDialog", () => {
  it("shows title, message, confirm and cancel (OVL-01)", async () => {
    await render(setup().element);
    expect(screen.getByText("Excluir baralho?")).toBeTruthy();
    expect(screen.getByText("Não dá para desfazer.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Excluir baralho" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
  });

  it("calls onConfirm once and not onCancel (OVL-02)", async () => {
    const { element, onConfirm, onCancel } = setup();
    await render(element);
    await fireEvent.press(screen.getByRole("button", { name: "Excluir baralho" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels from the button, the backdrop and the Android back button (OVL-03)", async () => {
    const { element, onConfirm, onCancel } = setup();
    await render(element);
    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    await fireEvent.press(screen.getByTestId("overlay-backdrop"));
    await fireEvent(screen.getByTestId("overlay-modal"), "requestClose");
    expect(onCancel).toHaveBeenCalledTimes(3);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("uses the danger color only in the destructive tone (OVL-04)", async () => {
    const { element } = setup({ tone: "destructive" });
    await render(element);
    expect(confirmBackground()).toBe(lightColors.grade.again.text);
    await screen.unmount();
    await render(setup().element);
    expect(confirmBackground()).toBe(lightColors.accent);
  });

  it("uses the destructive color of the dark theme (OVL-04)", async () => {
    const scheme = jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");
    await render(setup({ tone: "destructive" }).element);
    expect(confirmBackground()).toBe(darkColors.grade.again.text);
    scheme.mockRestore();
  });

  it("renders nothing when hidden (OVL-05)", async () => {
    await render(setup({ visible: false }).element);
    expect(screen.queryByText("Excluir baralho?")).toBeNull();
  });

  it("labels both buttons and keeps them at 44pt or more (OVL-18)", async () => {
    await render(setup().element);
    for (const name of ["Excluir baralho", "Cancelar"]) {
      const button = screen.getByRole("button", { name });
      expect(button.props.accessibilityLabel).toBe(name);
      expect(StyleSheet.flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(44);
    }
  });
});

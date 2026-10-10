import { fireEvent, render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { StyleSheet } from "react-native";

import { SafeArea } from "@/testing/safe-area";
import { lightColors } from "@/theme";

import { BottomSheet, type SheetAction } from "./bottom-sheet";

function setup(visible = true) {
  const onClose = jest.fn();
  const add = jest.fn();
  const reset = jest.fn();
  const remove = jest.fn();
  const actions: SheetAction[] = [
    { label: "Adicionar cartão", icon: "plus", onPress: add },
    { label: "Redefinir progresso", subtitle: "Todos os cartões voltam a ser novos", onPress: reset },
    { label: "Excluir baralho", icon: "trash", destructive: true, onPress: remove },
  ];
  const element = (
    <SafeArea>
      <BottomSheet
        visible={visible}
        title="Inglês — Verbos irregulares"
        subtitle="142 cartões · 12 para hoje"
        actions={actions}
        onClose={onClose}
      />
    </SafeArea>
  );
  return { element, onClose, add, reset, remove };
}

describe("BottomSheet", () => {
  it("shows title, subtitle, actions in order and cancel (OVL-06)", async () => {
    await render(setup().element);
    expect(screen.getByText("Inglês — Verbos irregulares")).toBeTruthy();
    expect(screen.getByText("142 cartões · 12 para hoje")).toBeTruthy();
    const names = screen.getAllByRole("button").map((b) => b.props.accessibilityLabel);
    expect(names).toEqual(["Adicionar cartão", "Redefinir progresso", "Excluir baralho", "Cancelar"]);
  });

  it("runs the pressed action once and closes once (OVL-07)", async () => {
    const { element, onClose, add, reset } = setup();
    await render(element);
    await fireEvent.press(screen.getByRole("button", { name: "Adicionar cartão" }));
    expect(add).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from cancel, the backdrop and the Android back button without running actions (OVL-08)", async () => {
    const { element, onClose, add, reset, remove } = setup();
    await render(element);
    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    await fireEvent.press(screen.getByTestId("overlay-backdrop"));
    await fireEvent(screen.getByTestId("overlay-modal"), "requestClose");
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(add).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("colors destructive actions and shows action subtitles (OVL-09)", async () => {
    await render(setup().element);
    const danger = screen.getByText("Excluir baralho");
    expect(StyleSheet.flatten(danger.props.style).color).toBe(lightColors.grade.again.text);
    const normal = screen.getByText("Adicionar cartão");
    expect(StyleSheet.flatten(normal.props.style).color).toBe(lightColors.text);
    expect(screen.getByText("Todos os cartões voltam a ser novos")).toBeTruthy();
  });

  it("renders nothing when hidden", async () => {
    await render(setup(false).element);
    expect(screen.queryByText("Inglês — Verbos irregulares")).toBeNull();
  });

  it("uses the dark danger color in the dark theme (OVL-09)", async () => {
    const scheme = jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");
    await render(setup().element);
    const danger = screen.getByText("Excluir baralho");
    expect(StyleSheet.flatten(danger.props.style).color).not.toBe(lightColors.grade.again.text);
    scheme.mockRestore();
  });

  it("labels every button and keeps it at 44pt or more (OVL-18)", async () => {
    await render(setup().element);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button.props.accessibilityLabel).toBeTruthy();
      expect(StyleSheet.flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(44);
    }
  });
});

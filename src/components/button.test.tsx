import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { lightColors } from "@/theme";

import { Button } from "./button";

describe("Button", () => {
  it("is an accessible button with the label and a 44pt target (A11Y-01)", async () => {
    await render(<Button label="Salvar" onPress={jest.fn()} />);
    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button.props.accessibilityLabel).toBe("Salvar");
    expect(StyleSheet.flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(44);
  });

  it("calls onPress when enabled", async () => {
    const onPress = jest.fn();
    await render(<Button label="Salvar" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is disabled in the a11y state and ignores presses (A11Y-01)", async () => {
    const onPress = jest.fn();
    await render(<Button label="Salvar" onPress={onPress} disabled />);
    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("destructive variant is solid danger with onAccent text (OVL-15)", async () => {
    await render(<Button label="Apagar" variant="destructive" onPress={jest.fn()} />);
    const button = screen.getByRole("button", { name: "Apagar" });
    expect(StyleSheet.flatten(button.props.style).backgroundColor).toBe(lightColors.grade.again.text);
    expect(StyleSheet.flatten(screen.getByText("Apagar").props.style).color).toBe(lightColors.onAccent);
  });

  it("keeps the danger variant colors (OVL-15)", async () => {
    await render(<Button label="Remover" variant="danger" onPress={jest.fn()} />);
    const button = screen.getByRole("button", { name: "Remover" });
    expect(StyleSheet.flatten(button.props.style).backgroundColor).toBe(lightColors.grade.again.background);
  });

  it.each(["primary", "secondary", "text", "danger", "destructive"] as const)(
    "renders the %s variant",
    async (variant) => {
      await render(<Button label="X" variant={variant} onPress={jest.fn()} />);
      expect(screen.getByText("X")).toBeTruthy();
    },
  );
});

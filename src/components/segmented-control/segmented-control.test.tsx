import { fireEvent, render, screen } from "@testing-library/react-native";

import { darkColors, lightColors } from "@/theme";

import { SegmentedControl, type SegmentOption } from "./segmented-control";

type Theme = "system" | "light" | "dark";

const options: SegmentOption<Theme>[] = [
  { value: "system", label: "Automático" },
  { value: "light", label: "Claro", icon: "sun" },
  { value: "dark", label: "Escuro", icon: "moon" },
];

function setup(value: Theme = "system") {
  const onChange = jest.fn();
  const element = (
    <SegmentedControl label="Tema" options={options} value={value} onChange={onChange} />
  );
  return { element, onChange };
}

describe("SegmentedControl", () => {
  it("THM-01 shows the options in order inside a radiogroup", async () => {
    await render(setup().element);
    expect(screen.getByLabelText("Tema")).toBeTruthy();
    const names = screen.getAllByRole("radio").map((r) => r.props.accessibilityLabel);
    expect(names).toEqual(["Automático", "Claro", "Escuro"]);
  });

  it("THM-01 marks only the current option as checked", async () => {
    await render(setup("light").element);
    expect(screen.getByRole("radio", { name: "Claro", checked: true })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Automático", checked: false })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Escuro", checked: false })).toBeTruthy();
  });

  it("THM-02 reports the pressed value", async () => {
    const { element, onChange } = setup();
    await render(element);
    await fireEvent.press(screen.getByRole("radio", { name: "Escuro" }));
    expect(onChange).toHaveBeenCalledWith("dark");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("THM-01 keeps every target at 44pt or more", async () => {
    await render(setup().element);
    for (const radio of screen.getAllByRole("radio")) {
      const style = Array.isArray(radio.props.style) ? Object.assign({}, ...radio.props.style.flat()) : radio.props.style;
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
    }
  });

  it("THM-01 uses the surface of the active theme for the selected option", async () => {
    const color = (r: ReturnType<typeof screen.getByRole>) =>
      Object.assign({}, ...r.props.style.flat().filter(Boolean)).backgroundColor;
    await render(setup().element);
    expect(color(screen.getByRole("radio", { name: "Automático" }))).toBe(lightColors.surface);
    expect(darkColors.surface).not.toBe(lightColors.surface);
  });
});

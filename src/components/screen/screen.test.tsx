import { render, screen } from "@testing-library/react-native";
import { StyleSheet, Text, useColorScheme } from "react-native";

import { darkColors, lightColors } from "@/theme";

import { Screen } from "./screen";

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(),
  __esModule: true,
}));

describe("Screen", () => {
  const mockScheme = (value: "light" | "dark") =>
    (jest.requireMock("react-native/Libraries/Utilities/useColorScheme").default as jest.Mock).mockReturnValue(value);

  it("paints the light background and renders children", async () => {
    mockScheme("light");
    await render(<Screen testID="s"><Text>conteúdo</Text></Screen>);
    expect(screen.getByText("conteúdo")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId("s").props.style).backgroundColor).toBe(lightColors.background);
  });

  it("paints the dark background in dark mode (THM-01)", async () => {
    mockScheme("dark");
    await render(<Screen testID="s"><Text>x</Text></Screen>);
    expect(StyleSheet.flatten(screen.getByTestId("s").props.style).backgroundColor).toBe(darkColors.background);
    void useColorScheme;
  });
});

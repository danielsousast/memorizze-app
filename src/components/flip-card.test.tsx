import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { FlipCard } from "./flip-card";

jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return { ...actual, useReducedMotion: jest.fn(() => false) };
});

const view = (flipped: boolean, onPress = jest.fn(), disabled = false) => (
  <FlipCard
    flipped={flipped}
    disabled={disabled}
    onPress={onPress}
    testID="card"
    front={<Text>frente</Text>}
    back={<Text>verso</Text>}
  />
);

describe("FlipCard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useReducedMotion as jest.Mock).mockReturnValue(false);
  });
  afterEach(() => jest.useRealTimers());

  it("FLP-01/02 keeps the front until 150 ms, then shows the back", async () => {
    const { rerender } = await render(view(false));
    await rerender(view(true));
    expect(screen.getByText("frente")).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(149);
    });
    expect(screen.queryByText("verso")).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByText("verso")).toBeTruthy();
    expect(screen.queryByText("frente")).toBeNull();
  });

  it("FLP-01 rotates Y through 90deg and back to 0 in 300 ms", async () => {
    const { rerender } = await render(view(false));
    await rerender(view(true));
    const angle = () => JSON.stringify(screen.getByTestId("card").parent?.props.style);
    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(angle()).toContain("90");
    await act(async () => {
      jest.advanceTimersByTime(160);
    });
    expect(angle()).toMatch(/rotateY\W+0deg/);
  });

  it("FLP-05 shows the front at once when flipped goes back to false", async () => {
    const { rerender } = await render(view(false));
    await rerender(view(true));
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await rerender(view(false));
    expect(screen.getByText("frente")).toBeTruthy();
  });

  it("FLP-06 swaps at once with reduced motion", async () => {
    (useReducedMotion as jest.Mock).mockReturnValue(true);
    const { rerender } = await render(view(false));
    await rerender(view(true));
    expect(screen.getByText("verso")).toBeTruthy();
  });

  it("FLP-07 never shows the back when reset before the swap", async () => {
    const { rerender } = await render(view(false));
    await rerender(view(true));
    await rerender(view(false));
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(screen.getByText("frente")).toBeTruthy();
    expect(screen.queryByText("verso")).toBeNull();
  });

  it("FLP-04 disabled blocks onPress", async () => {
    const onPress = jest.fn();
    await render(view(true, onPress, true));
    await fireEvent.press(screen.getByTestId("card"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

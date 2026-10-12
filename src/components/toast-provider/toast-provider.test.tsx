import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { StyleSheet } from "react-native";

import { SafeArea } from "@/testing/safe-area";

import { ToastProvider, useToast } from "./toast-provider";

let toast: ReturnType<typeof useToast>;

function capture(api: ReturnType<typeof useToast>) {
  toast = api;
}

function Probe() {
  const api = useToast();
  useEffect(() => capture(api), [api]);
  return null;
}

async function mount() {
  return render(
    <SafeArea>
      <ToastProvider>
        <Probe />
      </ToastProvider>
    </SafeArea>,
  );
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

/** The id of the 4000 ms timer the provider armed most recently. */
function lastToastTimer(setTimer: jest.SpyInstance) {
  const index = setTimer.mock.calls.map(([, ms]) => ms).lastIndexOf(4000);
  return setTimer.mock.results[index].value;
}

describe("ToastProvider", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("shows the message with a check icon (OVL-10)", async () => {
    await mount();
    await act(async () => toast.show({ message: "Cartão salvo" }));
    expect(screen.getByText("Cartão salvo")).toBeTruthy();
    expect(screen.getByTestId("toast-check")).toBeTruthy();
  });

  it("disappears after 4000 ms (OVL-11)", async () => {
    await mount();
    await act(async () => toast.show({ message: "Cartão salvo" }));
    await advance(3999);
    expect(screen.getByText("Cartão salvo")).toBeTruthy();
    await advance(1);
    expect(screen.queryByText("Cartão salvo")).toBeNull();
  });

  it("runs the action once and closes the toast (OVL-12, OVL-16)", async () => {
    const onPress = jest.fn();
    await mount();
    const setTimer = jest.spyOn(global, "setTimeout");
    const clearTimer = jest.spyOn(global, "clearTimeout");
    await act(async () => toast.show({ message: "Baralho excluído", action: { label: "Desfazer", onPress } }));
    await fireEvent.press(screen.getByRole("button", { name: "Desfazer" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Baralho excluído")).toBeNull();
    expect(clearTimer).toHaveBeenCalledWith(lastToastTimer(setTimer));
    await advance(4000);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("replaces the toast and restarts the countdown (OVL-13)", async () => {
    await mount();
    await act(async () => toast.show({ message: "Primeiro" }));
    await advance(3000);
    await act(async () => toast.show({ message: "Segundo" }));
    expect(screen.queryByText("Primeiro")).toBeNull();
    await advance(3999);
    expect(screen.getByText("Segundo")).toBeTruthy();
    await advance(1);
    expect(screen.queryByText("Segundo")).toBeNull();
  });

  it("throws outside the provider (OVL-14)", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<Probe />)).rejects.toThrow("useToast must be used inside ToastProvider");
    error.mockRestore();
  });

  it("cancels the timer on unmount (OVL-17)", async () => {
    await mount();
    const setTimer = jest.spyOn(global, "setTimeout");
    const clearTimer = jest.spyOn(global, "clearTimeout");
    await act(async () => toast.show({ message: "Cartão salvo" }));
    const id = lastToastTimer(setTimer);
    expect(clearTimer).not.toHaveBeenCalledWith(id);
    await screen.unmount();
    expect(clearTimer).toHaveBeenCalledWith(id);
  });

  it("is a polite alert region (OVL-19)", async () => {
    await mount();
    await act(async () => toast.show({ message: "Cartão salvo" }));
    const region = screen.getByTestId("toast");
    expect(region.props.accessibilityRole).toBe("alert");
    expect(region.props.accessibilityLiveRegion).toBe("polite");
  });

  it("keeps the action button at 44pt or more (OVL-18)", async () => {
    await mount();
    await act(async () => toast.show({ message: "Ok", action: { label: "Desfazer", onPress: jest.fn() } }));
    const button = screen.getByRole("button", { name: "Desfazer" });
    expect(StyleSheet.flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(44);
  });
});

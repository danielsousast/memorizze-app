import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { TextField } from "./text-field";

describe("TextField", () => {
  it("labels the input and keeps a 44pt target (A11Y-01)", async () => {
    await render(<TextField label="Nome" value="" onChangeText={jest.fn()} />);
    const input = screen.getByLabelText("Nome");
    expect(input.props.accessibilityLabel).toBe("Nome");
    expect(StyleSheet.flatten(input.props.style).minHeight).toBeGreaterThanOrEqual(44);
  });

  it("forwards text changes", async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Nome" value="" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Inglês");
    expect(onChangeText).toHaveBeenCalledWith("Inglês");
  });

  it("shows the error text only when error is given", async () => {
    const { rerender } = await render(<TextField label="Nome" value="" />);
    expect(screen.queryByText("x")).toBeNull();
    await rerender(<TextField label="Nome" value="" error="x" />);
    expect(screen.getByText("x")).toBeTruthy();
  });

  it("picks the border color: error, then focus, then default", async () => {
    const border = () => StyleSheet.flatten(screen.getByLabelText("Nome").props.style).borderColor;
    const { rerender } = await render(<TextField label="Nome" value="" />);
    const idle = border();
    await fireEvent(screen.getByLabelText("Nome"), "focus");
    const focused = border();
    expect(focused).not.toBe(idle);
    await rerender(<TextField label="Nome" value="" error="x" />);
    const errored = border();
    expect(errored).not.toBe(focused);
    expect(errored).not.toBe(idle);
  });

  it("calls the caller's onFocus and onBlur", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await render(<TextField label="Nome" value="" onFocus={onFocus} onBlur={onBlur} />);
    await fireEvent(screen.getByLabelText("Nome"), "focus");
    await fireEvent(screen.getByLabelText("Nome"), "blur");
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("shows the hint", async () => {
    await render(<TextField label="Frente" hint="Dica" multiline />);
    expect(screen.getByText("Dica")).toBeTruthy();
  });
});

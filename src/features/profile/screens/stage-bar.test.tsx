import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { StageBar } from "./stage-bar";

const flex = (id: string) =>
  StyleSheet.flatten(screen.getByTestId(id, { includeHiddenElements: true }).props.style).flex;
const segments = () => screen.queryAllByTestId(/^segment-/, { includeHiddenElements: true });

describe("StageBar", () => {
  it("CRD-01 shows the total and the three counts with names", async () => {
    await render(<StageBar stages={{ new: 96, learning: 128, mature: 268 }} />);
    expect(screen.getByText("Seus cartões")).toBeTruthy();
    expect(screen.getByText("492 no total")).toBeTruthy();
    for (const [name, n] of [["Novos", "96"], ["Aprendendo", "128"], ["Maduros", "268"]]) {
      expect(screen.getByText(name)).toBeTruthy();
      expect(screen.getByText(n)).toBeTruthy();
    }
  });

  it("CRD-02 omits zero segments and keeps the order", async () => {
    await render(<StageBar stages={{ new: 5, learning: 0, mature: 7 }} />);
    expect(segments().map((s) => s.props.testID)).toEqual(["segment-new", "segment-mature"]);
  });

  it("CRD-03 widths are weighted by the counts", async () => {
    await render(<StageBar stages={{ new: 96, learning: 128, mature: 268 }} />);
    expect(segments().map((s) => s.props.testID)).toEqual([
      "segment-new",
      "segment-learning",
      "segment-mature",
    ]);
    expect([flex("segment-new"), flex("segment-learning"), flex("segment-mature")]).toEqual([
      96, 128, 268,
    ]);
  });

  it("CRD-04 empty shows zeros and no segment", async () => {
    await render(<StageBar stages={{ new: 0, learning: 0, mature: 0 }} />);
    expect(screen.getByText("0 no total")).toBeTruthy();
    expect(screen.getAllByText("0")).toHaveLength(3);
    expect(segments()).toHaveLength(0);
  });

  it("A11Y-01 each count reads as one labelled item", async () => {
    await render(<StageBar stages={{ new: 96, learning: 128, mature: 268 }} />);
    expect(screen.getByLabelText("Cartões novos, 96")).toBeTruthy();
    expect(screen.getByLabelText("Cartões aprendendo, 128")).toBeTruthy();
    expect(screen.getByLabelText("Cartões maduros, 268")).toBeTruthy();
  });
});

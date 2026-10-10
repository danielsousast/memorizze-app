import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { GoalProgress } from "./goal-progress";

describe("GoalProgress", () => {
  it("HOM-05 keeps the text and fills the bar when done passes the goal", async () => {
    await render(<GoalProgress done={34} goal={30} />);
    expect(screen.getByText("34 de 30 revisões")).toBeTruthy();
    const bar = screen.getByTestId("goal-progress-bar");
    expect(StyleSheet.flatten(bar.props.style).width).toBe("100%");
  });

  it("HOM-04 fills the bar in proportion to done / goal", async () => {
    await render(<GoalProgress done={18} goal={30} />);
    const bar = screen.getByTestId("goal-progress-bar");
    expect(StyleSheet.flatten(bar.props.style).width).toBe("60%");
  });
});

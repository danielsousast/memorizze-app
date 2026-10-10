import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { lightColors } from "@/theme";

import { WeekChart } from "./week-chart";

const week = [32, 24, 35, 30, 41, 28, 18];
// 2026-10-10 is a Saturday.
const saturday = new Date(2026, 9, 10, 12);

const bar = (i: number) => StyleSheet.flatten(screen.getByTestId(`bar-${i}`, { includeHiddenElements: true }).props.style);
const renderChart = (w: number[], goal = 30) =>
  render(<WeekChart week={w} dailyGoal={goal} now={saturday} />);

describe("WeekChart", () => {
  it("CHT-01 shows seven values in order", async () => {
    await renderChart(week);
    const values = week.map((_, i) => screen.getByTestId(`value-${i}`, { includeHiddenElements: true }).props.children);
    expect(values).toEqual(week);
  });

  it("CHT-02 labels weekdays, Hoje last, accent only on today", async () => {
    await renderChart(week);
    const labels = week.map((_, i) => screen.getByTestId(`label-${i}`, { includeHiddenElements: true }).props.children);
    expect(labels).toEqual(["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Hoje"]);
    expect(bar(6).backgroundColor).toBe(lightColors.accent);
    for (let i = 0; i < 6; i++) expect(bar(i).backgroundColor).not.toBe(lightColors.accent);
  });

  it("CHT-03 header total", async () => {
    await renderChart(week);
    expect(screen.getByText("208 revisões")).toBeTruthy();
    await screen.unmount();
    await renderChart([0, 0, 0, 0, 0, 0, 1]);
    expect(screen.getByText("1 revisão")).toBeTruthy();
  });

  it("CHT-04 scales by max(goal, max count)", async () => {
    await renderChart(week);
    expect(screen.getByText("meta 30", { includeHiddenElements: true })).toBeTruthy();
    expect(bar(4).height).toBeGreaterThan(0);
    expect(bar(3).height / bar(4).height).toBeCloseTo(30 / 41);
    await screen.unmount();
    await renderChart([10, 0, 0, 0, 0, 0, 15], 30);
    expect(bar(6).height / bar(0).height).toBeCloseTo(1.5);
    expect(screen.getByTestId("value-1", { includeHiddenElements: true }).props.children).toBe(0);
    expect(bar(1).height).toBeGreaterThan(0);
  });

  it("CHT-04 uses the goal as scale when above every day", async () => {
    await renderChart([15, 0, 0, 0, 0, 0, 30], 30);
    expect(bar(0).height / bar(6).height).toBeCloseTo(0.5);
  });

  it("CHT-05 exposes one accessibility label", async () => {
    await renderChart(week);
    expect(
      screen.getByLabelText("Últimos 7 dias: Dom 32, Seg 24, Ter 35, Qua 30, Qui 41, Sex 28, Hoje 18"),
    ).toBeTruthy();
  });
});

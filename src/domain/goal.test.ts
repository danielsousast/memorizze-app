import { createRandom } from "@/testing/random";

import { canStep, GOAL_MAX, GOAL_MIN, stepGoal } from "./goal";

describe("stepGoal", () => {
  it("moves to the next or previous multiple of 5 (GOL-06)", () => {
    expect(stepGoal(23, 1)).toBe(25);
    expect(stepGoal(23, -1)).toBe(20);
    expect(stepGoal(20, 1)).toBe(25);
    expect(stepGoal(20, -1)).toBe(15);
  });

  it("clamps to the 5..200 range (GOL-06)", () => {
    expect(stepGoal(3, 1)).toBe(5);
    expect(stepGoal(250, -1)).toBe(200);
    expect(stepGoal(200, 1)).toBe(200);
    expect(stepGoal(5, -1)).toBe(5);
  });
});

describe("canStep", () => {
  it("is false at the limits (GOL-02)", () => {
    expect(canStep(200, 1)).toBe(false);
    expect(canStep(5, -1)).toBe(false);
  });

  it("is true inside the range (GOL-02)", () => {
    expect(canStep(195, 1)).toBe(true);
    expect(canStep(10, -1)).toBe(true);
    expect(canStep(200, -1)).toBe(true);
    expect(canStep(5, 1)).toBe(true);
  });
});

describe("goal invariant", () => {
  it("stays a multiple of 5 within 5..200 after any step sequence (INV-02)", () => {
    const random = createRandom(42);
    for (let run = 0; run < 100; run++) {
      let goal = 20;
      for (let step = 0; step < 50; step++) {
        goal = stepGoal(goal, random.pick([1, -1] as const));
        expect(goal).toBeGreaterThanOrEqual(GOAL_MIN);
        expect(goal).toBeLessThanOrEqual(GOAL_MAX);
        expect(goal % 5).toBe(0);
      }
    }
  });
});

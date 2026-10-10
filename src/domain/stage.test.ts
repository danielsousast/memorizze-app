import { cardStage, stageLabel } from "./stage";

describe("cardStage", () => {
  it("is new when never repeated, whatever the interval (STG-01)", () => {
    expect(cardStage({ repetitions: 0, intervalDays: 30 })).toBe("new");
  });

  it("is learning below 21 days (STG-01)", () => {
    expect(cardStage({ repetitions: 1, intervalDays: 20 })).toBe("learning");
  });

  it("is mature from 21 days (STG-01)", () => {
    expect(cardStage({ repetitions: 3, intervalDays: 21 })).toBe("mature");
  });
});

describe("stageLabel", () => {
  it("has the pt-BR labels (STG-01)", () => {
    expect(stageLabel).toEqual({ new: "Novo", learning: "Aprendendo", mature: "Maduro" });
  });
});

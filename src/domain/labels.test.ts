import {
  daysLabel,
  percentLabel,
  reviewedCardsLabel,
  streakDaysLabel,
  streakSubtitle,
  studyTimeLabel,
  tomorrowLabel,
  tomorrowSummaryLabel,
  weekLabels,
} from "./labels";

describe("tomorrowLabel", () => {
  it("is empty while loading", () => expect(tomorrowLabel(undefined)).toBe(""));
  it("says none for zero", () => expect(tomorrowLabel(0)).toBe("Amanhã: nenhum cartão"));
  it("uses singular and plural", () => {
    expect(tomorrowLabel(1)).toBe("Amanhã: 1 cartão");
    expect(tomorrowLabel(3)).toBe("Amanhã: 3 cartões");
  });
});

describe("tomorrowSummaryLabel", () => {
  it("is empty while loading", () => expect(tomorrowSummaryLabel(undefined)).toBe(""));
  it("says none for zero", () =>
    expect(tomorrowSummaryLabel(0)).toBe("Amanhã: nenhum cartão para revisar"));
  it("counts cards", () => {
    expect(tomorrowSummaryLabel(1)).toBe("Amanhã: 1 cartão para revisar");
    expect(tomorrowSummaryLabel(3)).toBe("Amanhã: 3 cartões para revisar");
  });
});

describe("studyTimeLabel", () => {
  it("shows less than a minute for zero", () => expect(studyTimeLabel(0)).toBe("< 1 min de estudo"));
  it("shows the minutes", () => expect(studyTimeLabel(5)).toBe("5 min de estudo"));
});

describe("small labels", () => {
  it("reviewedCardsLabel", () => {
    expect(reviewedCardsLabel(1)).toBe("cartão revisto");
    expect(reviewedCardsLabel(2)).toBe("cartões revistos");
  });
  it("streakDaysLabel", () => {
    expect(streakDaysLabel(1)).toBe("dia seguido");
    expect(streakDaysLabel(0)).toBe("dias seguidos");
  });
  it("daysLabel and percentLabel", () => {
    expect(daysLabel(1)).toBe("1 dia");
    expect(daysLabel(2)).toBe("2 dias");
    expect(percentLabel(null)).toBe("—");
    expect(percentLabel(80)).toBe("80%");
  });
});

describe("streakSubtitle", () => {
  it("covers the three states", () => {
    expect(streakSubtitle(0, false)).toBe("Sua sequência começa no primeiro estudo");
    expect(streakSubtitle(3, true)).toBe("Você já estudou hoje");
    expect(streakSubtitle(3, false)).toBe("Estude hoje para chegar a 4");
  });
});

describe("weekLabels", () => {
  it("ends with Hoje", () => {
    const labels = weekLabels(7, new Date(2026, 9, 10));
    expect(labels).toHaveLength(7);
    expect(labels[6]).toBe("Hoje");
  });
});

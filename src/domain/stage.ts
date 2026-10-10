export type CardStage = "new" | "learning" | "mature";

export const MATURE_INTERVAL_DAYS = 21;

export function cardStage(card: { repetitions: number; intervalDays: number }): CardStage {
  if (card.repetitions === 0) return "new";
  return card.intervalDays < MATURE_INTERVAL_DAYS ? "learning" : "mature";
}

export const stageLabel: Record<CardStage, string> = {
  new: "Novo",
  learning: "Aprendendo",
  mature: "Maduro",
};

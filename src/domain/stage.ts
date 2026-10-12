import { t } from "@/lib/i18n";

export type CardStage = "new" | "learning" | "mature";

export const MATURE_INTERVAL_DAYS = 21;

export function cardStage(card: { repetitions: number; intervalDays: number }): CardStage {
  if (card.repetitions === 0) return "new";
  return card.intervalDays < MATURE_INTERVAL_DAYS ? "learning" : "mature";
}

// Getters resolve the text at read time, so a locale change shows on the next read.
export const stageLabel: Record<CardStage, string> = {
  get new() {
    return t("stage.new");
  },
  get learning() {
    return t("stage.learning");
  },
  get mature() {
    return t("stage.mature");
  },
};

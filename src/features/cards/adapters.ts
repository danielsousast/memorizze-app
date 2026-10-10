import type { Card as CardObject } from "@/db";

import type { Card } from "./interfaces";

export function toCard(obj: CardObject): Card {
  return {
    id: obj._id.toHexString(),
    front: obj.front,
    back: obj.back,
    easeFactor: obj.easeFactor,
    intervalDays: obj.intervalDays,
    repetitions: obj.repetitions,
    lapses: obj.lapses,
    dueDate: obj.dueDate,
    createdAt: obj.createdAt,
  };
}

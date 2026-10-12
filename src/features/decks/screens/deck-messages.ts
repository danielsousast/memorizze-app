import { t } from "@/lib/i18n";

// Body of the delete-deck confirmation (DEL-01).
export function deleteDeckMessage(name: string, cardCount: number): string {
  if (cardCount === 0) return t("deckMessages.deleteEmpty", { name });
  const cards = t("deckMessages.deleteCards", { count: cardCount });
  return t("deckMessages.deleteWithCards", { name, cards });
}

// Subtitle of the deck menu sheet (MENU-01).
export function deckSheetSubtitle(cardCount: number, dueCount: number): string {
  const cards = t("plurals.card", { count: cardCount });
  return dueCount > 0 ? t("deckMessages.sheetDue", { cards, due: dueCount }) : cards;
}

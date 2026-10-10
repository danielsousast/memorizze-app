// Body of the delete-deck confirmation (DEL-01).
export function deleteDeckMessage(name: string, cardCount: number): string {
  if (cardCount === 0) return `“${name}” será apagado deste aparelho. Não dá para desfazer.`;
  const cards = cardCount === 1 ? "seu único cartão" : `seus ${cardCount} cartões`;
  return `“${name}” e ${cards} serão apagados deste aparelho. Não dá para desfazer.`;
}

// Subtitle of the deck menu sheet (MENU-01).
export function deckSheetSubtitle(cardCount: number, dueCount: number): string {
  const cards = cardCount === 1 ? "1 cartão" : `${cardCount} cartões`;
  return dueCount > 0 ? `${cards} · ${dueCount} para hoje` : cards;
}

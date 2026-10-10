// Body of the delete-deck confirmation; undefined when the deck is empty.
export function deleteDeckMessage(cardCount: number): string | undefined {
  if (cardCount === 0) return undefined;
  if (cardCount === 1) return "O único cartão deste baralho também será excluído.";
  return `Os ${cardCount} cartões deste baralho também serão excluídos.`;
}

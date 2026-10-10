/**
 * Applies the daily new-card budget to an already ordered queue. Cards that are not new
 * are never cut; a new card introduced today costs nothing; the rest share what is left
 * of `limit` after today's introductions. `limit === null` keeps everything.
 */
export function selectQueue<T extends { id: string; repetitions: number }>(
  cards: readonly T[],
  limit: number | null,
  introducedToday: ReadonlySet<string>,
): T[] {
  if (limit === null) return [...cards];
  let budget = Math.max(0, limit - introducedToday.size);
  return cards.filter((card) => {
    if (card.repetitions > 0 || introducedToday.has(card.id)) return true;
    if (budget === 0) return false;
    budget -= 1;
    return true;
  });
}

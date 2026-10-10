export const PREVIEW_LIMIT = 5;

export function newestFirst<T>(cards: readonly T[]): T[] {
  return [...cards].reverse();
}

export function previewCards<T>(cards: readonly T[], limit = PREVIEW_LIMIT): T[] {
  return newestFirst(cards).slice(0, limit);
}

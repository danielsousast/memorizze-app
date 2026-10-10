// Deterministic PRNG (mulberry32) for invariant tests with a fixed seed.
export function createRandom(seed: number) {
  let state = seed >>> 0;

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function pick<T>(items: readonly T[]): T {
    return items[Math.floor(next() * items.length)];
  }

  return { next, pick };
}

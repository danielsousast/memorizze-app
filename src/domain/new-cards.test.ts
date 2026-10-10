import { createRandom } from "@/testing/random";

import { selectQueue } from "./new-cards";

type Item = { id: string; repetitions: number };
const fresh = (id: string): Item => ({ id, repetitions: 0 });
const known = (id: string): Item => ({ id, repetitions: 2 });
const ids = (items: Item[]) => items.map((i) => i.id);
const none = new Set<string>();

describe("selectQueue", () => {
  it("NEW-02 keeps every non-new card and caps new cards at the limit, in order", () => {
    const cards = [fresh("n1"), known("k1"), fresh("n2"), fresh("n3"), known("k2")];
    expect(ids(selectQueue(cards, 2, none))).toEqual(["n1", "k1", "n2", "k2"]);
  });

  it("NEW-02 never cuts non-new cards, even with limit 0 left", () => {
    expect(ids(selectQueue([known("k1"), fresh("n1")], 1, new Set(["x"])))).toEqual(["k1"]);
  });

  it("NEW-03 subtracts the cards already introduced today from the budget", () => {
    const cards = [fresh("n1"), fresh("n2"), fresh("n3")];
    expect(ids(selectQueue(cards, 3, new Set(["a", "b"])))).toEqual(["n1"]);
  });

  it("NEW-04 keeps a card introduced today that is still new, at no cost", () => {
    const cards = [fresh("n1"), fresh("again"), fresh("n2")];
    expect(ids(selectQueue(cards, 2, new Set(["again"])))).toEqual(["n1", "again"]);
  });

  it("NEW-05 returns everything without a limit", () => {
    const cards = [fresh("n1"), known("k1"), fresh("n2"), fresh("n3")];
    expect(selectQueue(cards, null, none)).toEqual(cards);
  });

  it("NEW-08 leaves only the budget-free cards when the budget is spent", () => {
    expect(selectQueue([fresh("n1"), fresh("n2")], 2, new Set(["a", "b"]))).toEqual([]);
  });

  it("does not mutate the input", () => {
    const cards = [fresh("n1"), fresh("n2")];
    selectQueue(cards, 1, none);
    expect(cards).toHaveLength(2);
  });

  it("INVARIANT NEW-02: output is an ordered subset, non-new intact, new within budget", () => {
    const random = createRandom(42);
    for (let step = 0; step < 100; step++) {
      const cards = Array.from({ length: Math.floor(random.next() * 12) }, (_, i) =>
        random.next() < 0.5 ? fresh(`c${i}`) : known(`c${i}`),
      );
      const limit = random.pick([null, 0, 1, 5, 10]);
      const introduced = new Set(
        cards.filter((c) => c.repetitions === 0 && random.next() < 0.3).map((c) => c.id),
      );
      const out = selectQueue(cards, limit, introduced);

      expect(ids(out)).toEqual(ids(cards.filter((c) => out.includes(c))));
      expect(ids(out.filter((c) => c.repetitions > 0))).toEqual(
        ids(cards.filter((c) => c.repetitions > 0)),
      );
      const charged = out.filter((c) => c.repetitions === 0 && !introduced.has(c.id));
      if (limit === null) expect(out).toEqual(cards);
      else expect(charged.length).toBeLessThanOrEqual(Math.max(0, limit - introduced.size));
    }
  });
});

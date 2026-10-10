import { newestFirst, previewCards } from "./cards-list";

describe("cards-list", () => {
  it("ALL-01 previewCards returns the 5 newest, newest first", () => {
    expect(previewCards([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([8, 7, 6, 5, 4]);
  });

  it("ALL-01 previewCards returns everything when there are fewer than 5", () => {
    expect(previewCards([1, 2, 3])).toEqual([3, 2, 1]);
  });

  it("newestFirst does not mutate its input", () => {
    const input = [1, 2, 3];
    expect(newestFirst(input)).toEqual([3, 2, 1]);
    expect(input).toEqual([1, 2, 3]);
  });
});

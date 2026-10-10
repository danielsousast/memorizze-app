import { openTestRealm } from "@/testing/realm";

const ItemSchema = {
  name: "Item",
  properties: { name: "string" },
};

describe("openTestRealm", () => {
  it("writes and reads, and isolates separate realms", () => {
    const first = openTestRealm(ItemSchema);
    const second = openTestRealm(ItemSchema);

    first.write(() => first.create("Item", { name: "a" }));

    expect(first.isInMemory).toBe(true);
    expect(first.objects("Item")).toHaveLength(1);
    expect(second.objects("Item")).toHaveLength(0);

    first.close();
    second.close();
  });
});

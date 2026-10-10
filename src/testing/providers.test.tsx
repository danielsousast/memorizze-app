import { useRealm } from "@realm/react";
import Realm from "realm";

import { renderHookWithProviders } from "@/testing/providers";
import { openTestRealm } from "@/testing/realm";

const ItemSchema = { name: "Item", properties: { name: "string" } };

describe("renderHookWithProviders", () => {
  let realm: Realm;

  beforeEach(() => {
    realm = openTestRealm(ItemSchema);
  });

  afterEach(() => {
    realm.close();
  });

  it("provides the given realm and leaves it open after unmount", async () => {
    const { result, unmount } = await renderHookWithProviders(
      () => useRealm(),
      realm,
    );

    expect(result.current).toBe(realm);

    await unmount();

    expect(realm.isClosed).toBe(false);
  });
});

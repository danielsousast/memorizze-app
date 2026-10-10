import { screen } from "expo-router/testing-library";
import { Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { useDecks } from "@/features/decks";

import { openTestRealm } from "./realm";
import { renderRouterWithProviders } from "./router";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

function DeckCount() {
  const { data } = useDecks();
  return <Text>{data ? `count:${data.length}` : "loading"}</Text>;
}

describe("renderRouterWithProviders", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => realm.close());

  it("renders routes that read real hooks from the given realm", async () => {
    realm.write(() => {
      realm.create(Deck, { name: "A", createdAt: new Date() });
      realm.create(Deck, { name: "B", createdAt: new Date() });
    });
    const rendered = await renderRouterWithProviders({ index: DeckCount }, realm);
    expect(await screen.findByText("count:2")).toBeTruthy();
    expect(rendered).toHavePathname("/");
    await rendered.unmount();
  });
});

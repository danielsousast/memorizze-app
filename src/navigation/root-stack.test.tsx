import { router } from "expo-router";
import { act, fireEvent, screen, waitFor } from "expo-router/testing-library";
import { useQueryClient } from "@tanstack/react-query";
import { Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import HomeRoute from "../app/(tabs)/index";
import TabsLayout from "../app/(tabs)/_layout";
import WelcomeRoute from "../app/welcome";
import { RootStack } from "./root-stack";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

function stub(label: string) {
  const Stub = () => <Text>{label}</Text>;
  Stub.displayName = `Stub(${label})`;
  return Stub;
}

function PendingProfileStack() {
  const client = useQueryClient();
  client.setQueryDefaults(["profile"], { queryFn: () => new Promise(() => {}) });
  return <RootStack />;
}
const routes = {
  "(tabs)/_layout": TabsLayout,
  "(tabs)/index": HomeRoute,
  welcome: WelcomeRoute,
  "decks/new": stub("Novo"),
  "decks/[deckId]/edit": stub("Editar"),
  "decks/[deckId]/cards/new": stub("Novo cartão"),
  "cards/[cardId]/edit": stub("Editar cartão"),
};

describe("RootStack", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  const open = (url = "/") =>
    renderRouterWithProviders(routes, realm, url, { navigator: RootStack });
  const addProfile = () =>
    realm.write(() => {
      realm.create(Profile, { name: "Ana", dailyGoal: 20, createdAt: new Date() });
    });

  it("ENT-01 opens the welcome screen without a profile", async () => {
    const rendered = await open();
    expect(await screen.findByText("Começar")).toBeTruthy();
    expect(rendered).toHavePathname("/welcome");
    await rendered.unmount();
  });

  it("ENT-02 opens the home screen with a profile", async () => {
    addProfile();
    const rendered = await open();
    expect(await screen.findByTestId("home-screen")).toBeTruthy();
    expect(rendered).toHavePathname("/");
    expect(screen.queryByText("Começar")).toBeNull();
    await rendered.unmount();
  });

  it("ENT-03 shows neither screen while the profile is pending", async () => {
    // The profile query never resolves, so the read stays pending.
    const pending = await renderRouterWithProviders(routes, realm, "/", {
      navigator: PendingProfileStack,
    });
    expect(screen.queryByText("Começar")).toBeNull();
    expect(screen.queryByTestId("home-screen")).toBeNull();
    await pending.unmount();
  });

  it("WEL-02 creating the profile replaces welcome with home; back does not reopen it", async () => {
    const rendered = await open();
    await fireEvent.changeText(await screen.findByLabelText("Como podemos te chamar?"), "Ana");
    await fireEvent.press(screen.getByRole("button", { name: "Começar" }));
    expect(await screen.findByTestId("home-screen")).toBeTruthy();
    expect(rendered).toHavePathname("/");
    expect(realm.objects(Profile)).toHaveLength(1);
    expect(router.canGoBack()).toBe(false);
    expect(screen.queryByText("Começar")).toBeNull();
    expect(screen.getByTestId("home-screen")).toBeTruthy();
    await rendered.unmount();
  });

  it("WEL-05 with a profile, pushing /welcome does not show the welcome screen", async () => {
    addProfile();
    const rendered = await open();
    await screen.findByTestId("home-screen");
    await act(async () => {
      try {
        router.push("/welcome");
      } catch {
        // an unmatched protected route may throw; either way it must not render
      }
    });
    await waitFor(() => expect(screen.queryByText("Começar")).toBeNull());
    await rendered.unmount();
  });
});

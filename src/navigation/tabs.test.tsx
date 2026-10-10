import { act, fireEvent, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import TabsLayout from "../app/(tabs)/_layout";
import HomeRoute from "../app/(tabs)/index";
import ProfileRoute from "../app/(tabs)/profile";
import { RootStack } from "./root-stack";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

function stub(label: string) {
  const Stub = () => <Text>{label}</Text>;
  Stub.displayName = `Stub(${label})`;
  return Stub;
}

const routes = {
  "(tabs)/_layout": TabsLayout,
  "(tabs)/index": HomeRoute,
  "(tabs)/profile": ProfileRoute,
  welcome: stub("Boas-vindas"),
  study: stub("Sessão"),
  "decks/[deckId]/index": stub("Baralho"),
  "decks/new": stub("Novo"),
  "decks/[deckId]/edit": stub("Editar"),
  "decks/[deckId]/cards/new": stub("Novo cartão"),
  "cards/[cardId]/edit": stub("Editar cartão"),
};

describe("Tabs", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
    realm.write(() => {
      realm.create(Profile, { name: "Ana", dailyGoal: 20, createdAt: new Date() });
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  const open = (url: string) =>
    renderRouterWithProviders(routes, realm, url, { navigator: RootStack });
  const tab = (name: string) => screen.findByLabelText(new RegExp(`^${name}, tab`));

  it("TAB-01 shows Início and Perfil on the home screen with Início selected", async () => {
    const rendered = await open("/");
    expect((await tab("Início")).props.accessibilityState.selected).toBe(true);
    expect((await tab("Perfil")).props.accessibilityState.selected).toBe(false);
    await rendered.unmount();
  });

  it("TAB-01 shows both tabs on the profile screen with Perfil selected; tapping navigates", async () => {
    const rendered = await open("/");
    await act(async () => {
      fireEvent.press(await tab("Perfil"));
    });
    expect(rendered).toHavePathname("/profile");
    expect((await tab("Perfil")).props.accessibilityState.selected).toBe(true);
    expect((await tab("Início")).props.accessibilityState.selected).toBe(false);
    await rendered.unmount();
  });

  it("TAB-01 opens directly on /profile with both tabs", async () => {
    const rendered = await open("/profile");
    expect(await screen.findByTestId("profile-screen")).toBeTruthy();
    expect((await tab("Perfil")).props.accessibilityState.selected).toBe(true);
    expect(await tab("Início")).toBeTruthy();
    await rendered.unmount();
  });

  it("TAB-02 hides the tab bar on the deck screen", async () => {
    const rendered = await open("/decks/abc");
    expect(await screen.findByText("Baralho")).toBeTruthy();
    expect(screen.queryByLabelText(/^Perfil, tab/)).toBeNull();
    await rendered.unmount();
  });

  it("TAB-02 hides the tab bar on the study screen", async () => {
    const rendered = await open("/study");
    expect(await screen.findByText("Sessão")).toBeTruthy();
    expect(screen.queryByLabelText(/^Perfil, tab/)).toBeNull();
    await rendered.unmount();
  });
});

import { router } from "expo-router";
import { act, fireEvent, screen } from "expo-router/testing-library";
import * as ReactNative from "react-native";
import { Alert, Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { darkColors } from "@/theme";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import StudyDeckRoute from "../../../app/decks/[deckId]/study";
import StudyAllRoute from "../../../app/study";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = {
  index: () => <Text>Início-home</Text>,
  study: StudyAllRoute,
  "decks/[deckId]/index": () => <Text>Baralho-home</Text>,
  "decks/[deckId]/study": StudyDeckRoute,
  "decks/[deckId]/cards/new": () => <Text>Editor-novo</Text>,
};
const DAY = 24 * 60 * 60 * 1000;

describe("StudyScreen empty", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  function seedDeck() {
    return createDeckRepository(realm).create({ name: "Inglês" });
  }
  function seedCard(deckId: string, dueDate: Date) {
    const card = createCardRepository(realm).create(deckId, { front: "f", back: "b" });
    realm.write(() => {
      realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!.dueDate = dueDate;
    });
  }
  const tomorrow = () => new Date(Date.now() + DAY);

  it("QUE-03 deck without due cards shows Nada para revisar hoje", async () => {
    const deck = seedDeck();
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}/study`);
    expect(await screen.findByText("Nada para revisar hoje")).toBeTruthy();
    await rendered.unmount();
  });

  it.each([
    [2, "Amanhã: 2 cartões"],
    [1, "Amanhã: 1 cartão"],
    [0, "Amanhã: nenhum cartão"],
  ])("EMP-01 texts and tomorrow badge with %i cards", async (n, badge) => {
    const deck = seedDeck();
    for (let i = 0; i < n; i++) seedCard(deck.id, tomorrow());
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}/study`);
    expect(await screen.findByText("Nada para revisar hoje")).toBeTruthy();
    expect(screen.getByText("Você está em dia! A memória também se fortalece no descanso.")).toBeTruthy();
    expect(await screen.findByText(badge)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sair da sessão" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Voltar ao início" })).toBeTruthy();
    await rendered.unmount();
  });

  it("EMP-02 deck session links to the card editor; /study has no link", async () => {
    const deck = seedDeck();
    let rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}/study`);
    await fireEvent.press(await screen.findByRole("button", { name: "Adicionar novos cartões" }));
    expect(rendered).toHavePathname(`/decks/${deck.id}/cards/new`);
    await rendered.unmount();

    rendered = await renderRouterWithProviders(routes, realm, "/study");
    expect(await screen.findByText("Nada para revisar hoje")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Adicionar novos cartões" })).toBeNull();
    await rendered.unmount();
  });

  it("EMP-03 close goes back without alert; Voltar ao início goes home", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const deck = seedDeck();
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}`);
    await act(async () => router.push(`/decks/${deck.id}/study`));
    await fireEvent.press(await screen.findByRole("button", { name: "Sair da sessão" }));
    expect(rendered).toHavePathname(`/decks/${deck.id}`);
    expect(alert).not.toHaveBeenCalled();

    await act(async () => router.push(`/decks/${deck.id}/study`));
    await fireEvent.press(await screen.findByRole("button", { name: "Voltar ao início" }));
    expect(rendered).toHavePathname("/");
    await rendered.unmount();
  });

  it("THM-01 uses the dark background in dark mode", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");
    const deck = seedDeck();
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}/study`);
    await screen.findByText("Nada para revisar hoje");
    expect(screen.getByTestId("study-screen")).toHaveStyle({ backgroundColor: darkColors.background });
    await rendered.unmount();
  });
});

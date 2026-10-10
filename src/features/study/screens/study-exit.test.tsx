import { router } from "expo-router";
import { act, fireEvent, screen } from "expo-router/testing-library";
import { Alert, BackHandler, Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import StudyDeckRoute from "../../../app/decks/[deckId]/study";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = {
  index: () => <Text>Início-home</Text>,
  "decks/[deckId]/index": () => <Text>Baralho-home</Text>,
  "decks/[deckId]/study": StudyDeckRoute,
};
const DAY = 24 * 60 * 60 * 1000;

describe("StudyScreen exit", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  function seed(fronts: string[]) {
    const deck = createDeckRepository(realm).create({ name: "Inglês" });
    fronts.forEach((front, i) => {
      const card = createCardRepository(realm).create(deck.id, { front, back: `${front}-verso` });
      realm.write(() => {
        realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!.dueDate = new Date(
          Date.now() - DAY + i,
        );
      });
    });
    return deck;
  }
  const close = async () => fireEvent.press(await screen.findByRole("button", { name: "Sair da sessão" }));
  const buttons = (spy: jest.SpyInstance) => spy.mock.calls[0][2] as { text: string; onPress?: () => void }[];

  it("EXT-01 close opens the confirmation alert", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const deck = seed(["a"]);
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}/study`);
    await close();
    expect(alert).toHaveBeenCalledWith("Sair da sessão?", "Seu progresso já foi salvo.", [
      expect.objectContaining({ text: "Continuar" }),
      expect.objectContaining({ text: "Sair" }),
    ]);
    await rendered.unmount();
  });

  it("EXT-02 Sair returns to the deck keeping the log; Continuar keeps the card", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const deck = seed(["a", "b"]);
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}`);
    await act(async () => router.push(`/decks/${deck.id}/study`));
    await fireEvent.press(await screen.findByRole("button", { name: "Mostrar resposta" }));
    await fireEvent.press(await screen.findByRole("button", { name: /^Bom, / }));
    expect(await screen.findByText("b")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Mostrar resposta" }));

    await close();
    await act(async () => buttons(alert)[0].onPress?.());
    expect(await screen.findByText("VERSO")).toBeTruthy();
    expect(screen.getByText("b")).toBeTruthy();

    await act(async () => buttons(alert)[1].onPress?.());
    expect(rendered).toHavePathname(`/decks/${deck.id}`);
    expect(realm.objects(ReviewLog).length).toBe(1);
    expect(screen.queryByText("Sessão concluída")).toBeNull();
    await rendered.unmount();
  });

  it("EXT-03 hardware back opens the alert while studying and is removed on unmount", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const remove = jest.fn();
    const add = jest.spyOn(BackHandler, "addEventListener").mockReturnValue({ remove });
    const deck = seed(["a"]);
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}/study`);
    await screen.findByText("FRENTE");
    expect(add).toHaveBeenCalledWith("hardwareBackPress", expect.any(Function));
    const handler = add.mock.calls[add.mock.calls.length - 1][1] as () => boolean;
    expect(handler()).toBe(true);
    expect(alert).toHaveBeenCalledWith("Sair da sessão?", "Seu progresso já foi salvo.", expect.any(Array));
    await rendered.unmount();
    expect(remove).toHaveBeenCalled();
  });

  it("EXT-03 no hardware back listener outside the studying phase", async () => {
    const add = jest.spyOn(BackHandler, "addEventListener").mockReturnValue({ remove: jest.fn() });
    const deck = seed(["a"]);
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}/study`);
    await fireEvent.press(await screen.findByRole("button", { name: "Mostrar resposta" }));
    await fireEvent.press(await screen.findByRole("button", { name: /^Bom, / }));
    expect(await screen.findByText("Sessão concluída")).toBeTruthy();
    const calls = add.mock.calls.length;
    const last = add.mock.results[calls - 1]?.value as { remove: jest.Mock };
    expect(last.remove).toHaveBeenCalled();
    await rendered.unmount();
  });
});

import { act, fireEvent, screen } from "expo-router/testing-library";
import { router } from "expo-router";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { i18n } from "@/lib/i18n";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import DeckRoute from "../../../app/decks/[deckId]/index";
import IndexRoute from "../../../app/(tabs)/index";
import NewDeckRoute from "../../../app/decks/new";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

const routes = {
  index: IndexRoute,
  "decks/new": NewDeckRoute,
  "decks/[deckId]/index": DeckRoute,
};

describe("deck screens per locale (I18NS-04, I18NS-05, I18NS-11)", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    i18n.locale = "pt-BR";
    jest.restoreAllMocks();
    realm.close();
  });

  function seedDeck(cardCount: number) {
    const deck = createDeckRepository(realm).create({ name: "Inglês" });
    for (let i = 0; i < cardCount; i += 1) {
      createCardRepository(realm).create(deck.id, { front: `f${i}`, back: `b${i}` });
    }
    return deck;
  }

  it.each([
    ["en", "Your decks", "1 deck", "Study all"],
    ["es", "Tus mazos", "1 mazo", "Estudiar todo"],
  ])("HomeScreen in %s", async (locale, title, count, studyAll) => {
    i18n.locale = locale;
    seedDeck(1);
    const rendered = await renderRouterWithProviders(routes, realm);
    expect(await screen.findByText(title)).toBeTruthy();
    expect(screen.getByText(count)).toBeTruthy();
    expect(screen.getByRole("button", { name: studyAll })).toBeTruthy();
    await rendered.unmount();
  });

  it.each([
    ["en", "Study · 3 cards", "Cards", "Home", "Deck options"],
    ["es", "Estudiar · 3 tarjetas", "Tarjetas", "Inicio", "Opciones del mazo"],
    ["pt-BR", "Estudar · 3 cartões", "Cartões", "Início", "Opções do baralho"],
  ])("DeckScreen in %s", async (locale, study, cardsTitle, home, options) => {
    i18n.locale = locale;
    const deck = seedDeck(3);
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}`);
    expect(await screen.findByRole("button", { name: study })).toBeTruthy();
    expect(await screen.findByText(cardsTitle)).toBeTruthy();
    expect(screen.getByRole("button", { name: home })).toBeTruthy();
    expect(screen.getByRole("button", { name: options })).toBeTruthy();
    await rendered.unmount();
  });

  it("DeckForm validation follows a locale switch between submits", async () => {
    const rendered = await renderRouterWithProviders(routes, realm, "/");
    await act(async () => router.push("/decks/new"));
    await fireEvent.press(await screen.findByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Dê um nome ao baralho.")).toBeTruthy();
    i18n.locale = "en";
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Give the deck a name.")).toBeTruthy();
    i18n.locale = "es";
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Ponle un nombre al mazo.")).toBeTruthy();
    await rendered.unmount();
  });
});

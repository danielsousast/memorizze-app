import { fireEvent, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { i18n } from "@/lib/i18n";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import StudyDeckRoute from "../../../app/decks/[deckId]/study";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = {
  index: () => <Text>home</Text>,
  "decks/[deckId]/study": StudyDeckRoute,
  "decks/[deckId]/cards/new": () => <Text>new</Text>,
};
const DAY = 24 * 60 * 60 * 1000;

describe("study screens per locale (I18NS-04, I18NS-06)", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    i18n.locale = "pt-BR";
    jest.restoreAllMocks();
    realm.close();
  });

  function seed(count: number) {
    const deck = createDeckRepository(realm).create({ name: "Inglês" });
    for (let i = 0; i < count; i += 1) {
      const card = createCardRepository(realm).create(deck.id, { front: `f${i}`, back: `b${i}` });
      realm.write(() => {
        realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!.dueDate = new Date(
          Date.now() - DAY + i,
        );
      });
    }
    return deck;
  }
  const open = (deckId: string) => renderRouterWithProviders(routes, realm, `/decks/${deckId}/study`);

  it.each([
    ["en", "Show answer", "FRONT", "Tap to see the answer", "How well did you remember?", "Good", "1 of 1", "Card 1 of 1"],
    ["es", "Mostrar respuesta", "FRENTE", "Toca para ver la respuesta", "¿Qué tan bien lo recordaste?", "Bien", "1 de 1", "Tarjeta 1 de 1"],
  ])("SessionView in %s", async (locale, show, front, tap, how, good, progress, a11y) => {
    i18n.locale = locale;
    const deck = seed(1);
    const rendered = await open(deck.id);
    expect(await screen.findByRole("button", { name: show })).toBeTruthy();
    expect(screen.getByText(front)).toBeTruthy();
    expect(screen.getByText(tap)).toBeTruthy();
    expect(screen.getByText(progress)).toBeTruthy();
    expect(screen.getByLabelText(a11y)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: show }));
    expect(await screen.findByText(how)).toBeTruthy();
    expect(screen.getByRole("button", { name: new RegExp(`^${good}, `) })).toBeTruthy();
    await rendered.unmount();
  });

  it.each([
    ["en", "Nothing to review today", "Back to home", "Add new cards", "Tomorrow: 1 card"],
    ["es", "Nada que repasar hoy", "Volver al inicio", "Agregar tarjetas nuevas", "Mañana: 1 tarjeta"],
  ])("EmptyView in %s", async (locale, title, home, add, badge) => {
    i18n.locale = locale;
    const deck = seed(0);
    const card = createCardRepository(realm).create(deck.id, { front: "f", back: "b" });
    realm.write(() => {
      realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!.dueDate = new Date(Date.now() + DAY);
    });
    const rendered = await open(deck.id);
    expect(await screen.findByText(title)).toBeTruthy();
    expect(screen.getByRole("button", { name: home })).toBeTruthy();
    expect(screen.getByRole("button", { name: add })).toBeTruthy();
    expect(screen.getByText(badge)).toBeTruthy();
    await rendered.unmount();
  });

  it.each([
    ["pt-BR", 1, "Sessão concluída", "1 cartão revisto", "Concluir"],
    ["pt-BR", 2, "Sessão concluída", "2 cartões revistos", "Concluir"],
    ["en", 1, "Session complete", "1 card reviewed", "Done"],
    ["en", 2, "Session complete", "2 cards reviewed", "Done"],
    ["es", 1, "Sesión completada", "1 tarjeta repasada", "Listo"],
    ["es", 2, "Sesión completada", "2 tarjetas repasadas", "Listo"],
  ])("SummaryView in %s with %i reviewed", async (locale, count, title, reviewed, done) => {
    i18n.locale = locale;
    const deck = seed(count);
    const rendered = await open(deck.id);
    for (let i = 0; i < count; i += 1) {
      await fireEvent.press(await screen.findByRole("button", { name: i18n.t("study.showAnswer") }));
      await fireEvent.press(
        await screen.findByRole("button", { name: new RegExp(`^${i18n.t("grade.2")}, `) }),
      );
    }
    expect(await screen.findByText(title)).toBeTruthy();
    expect(screen.getByText(reviewed)).toBeTruthy();
    expect(screen.getByRole("button", { name: done })).toBeTruthy();
    await rendered.unmount();
  });
});

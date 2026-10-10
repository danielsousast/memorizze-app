import { act, fireEvent, screen, within } from "expo-router/testing-library";
import { router } from "expo-router";
import * as ReactNative from "react-native";
import { Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { darkColors } from "@/theme";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import DeckRoute from "../../../app/decks/[deckId]/index";

// LOAD-01 needs a read that has not resolved yet; these flags hold a hook pending.
const hold = { deck: false, cards: false };
jest.mock("@/features/decks/usecases/use-deck", () => {
  const actual = jest.requireActual("@/features/decks/usecases/use-deck");
  return {
    useDeck: (id: string) =>
      hold.deck ? { isPending: true, data: undefined } : actual.useDeck(id),
  };
});
jest.mock("@/features/cards/usecases/use-cards", () => {
  const actual = jest.requireActual("@/features/cards/usecases/use-cards");
  return {
    useCards: (id: string) =>
      hold.cards ? { isPending: true, data: undefined } : actual.useCards(id),
  };
});

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

const routes = {
  index: () => <Text>Início-home</Text>,
  "decks/[deckId]/index": DeckRoute,
  "decks/[deckId]/cards/new": () => <Text>Editor-novo</Text>,
  "decks/[deckId]/edit": () => <Text>Form-editar</Text>,
  "cards/[cardId]/edit": () => <Text>Editor-editar</Text>,
};

const DAY = 24 * 60 * 60 * 1000;

describe("DeckScreen", () => {
  let realm: Realm;
  beforeEach(() => {
    hold.deck = false;
    hold.cards = false;
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  function seedDeck(name = "Inglês", description?: string) {
    return createDeckRepository(realm).create({ name, description });
  }

  type Schedule = { repetitions?: number; intervalDays?: number; dueDate?: Date };
  function seedCard(deckId: string, front: string, back: string, schedule: Schedule = {}) {
    const card = createCardRepository(realm).create(deckId, { front, back });
    realm.write(() => {
      const obj = realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!;
      Object.assign(obj, schedule);
    });
    return card;
  }

  const future = () => new Date(Date.now() + 10 * DAY);

  async function open(id: string) {
    return renderRouterWithProviders(routes, realm, `/decks/${id}`);
  }

  it("DECK-01 shows back link, options button, name and description", async () => {
    const deck = seedDeck("Inglês", "Vocabulário");
    const rendered = await open(deck.id);
    expect(await screen.findByText("Inglês")).toBeTruthy();
    expect(screen.getByText("Vocabulário")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Opções do baralho" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Início" })).toBeTruthy();
    await rendered.unmount();
  });

  it("DECK-01 back link goes to the home route", async () => {
    const deck = seedDeck();
    const rendered = await renderRouterWithProviders(routes, realm, "/");
    await act(async () => router.push(`/decks/${deck.id}`));
    await fireEvent.press(await screen.findByRole("button", { name: "Início" }));
    expect(rendered).toHavePathname("/");
    await rendered.unmount();
  });

  it("DECK-01 deck without description shows no description text", async () => {
    const deck = seedDeck("Inglês");
    const rendered = await open(deck.id);
    await screen.findByText("Inglês");
    expect(screen.queryByTestId("deck-description")).toBeNull();
    await rendered.unmount();
  });

  it("DECK-02 shows count, due and mature badges", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "a", "a"); // due now, new
    seedCard(deck.id, "b", "b", { repetitions: 4, intervalDays: 30, dueDate: future() });
    seedCard(deck.id, "c", "c", { repetitions: 1, intervalDays: 3, dueDate: future() });
    const rendered = await open(deck.id);
    expect(await screen.findByText("3 cartões")).toBeTruthy();
    expect(screen.getByText("1 para hoje")).toBeTruthy();
    expect(await screen.findByText("1 maduros")).toBeTruthy();
    await rendered.unmount();
  });

  it("DECK-02 omits due and mature badges when there are none", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "a", "a", { repetitions: 1, intervalDays: 3, dueDate: future() });
    const rendered = await open(deck.id);
    expect(await screen.findByText("1 cartão")).toBeTruthy();
    await screen.findByTestId("card-row");
    expect(screen.queryByText(/para hoje/)).toBeNull();
    expect(screen.queryByText(/maduros/)).toBeNull();
    await rendered.unmount();
  });

  it("DECK-03 lists newest first with joined back lines and stage badges", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "c1", "v1", { repetitions: 4, intervalDays: 30, dueDate: future() });
    seedCard(deck.id, "c2", "v2", { repetitions: 1, intervalDays: 3, dueDate: future() });
    seedCard(deck.id, "c3", "a\nb");
    const rendered = await open(deck.id);
    await screen.findByText("c3");
    const fronts = screen.getAllByTestId("card-front").map((n) => n.props.children);
    expect(fronts).toEqual(["c3", "c2", "c1"]);
    expect(screen.getByText("a b")).toBeTruthy();
    const stages = screen
      .getAllByTestId("card-row")
      .map((row) => within(row).getByText(/^(Novo|Aprendendo|Maduro)$/).props.children);
    expect(stages).toEqual(["Novo", "Aprendendo", "Maduro"]);
    await rendered.unmount();
  });

  it("DECK-04 search filters by front or back ignoring case and accents", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "forget", "esquecer");
    seedCard(deck.id, "easy", "fácil");
    seedCard(deck.id, "other", "outro");
    const rendered = await open(deck.id);
    const field = await screen.findByLabelText("Buscar cartões");
    const fronts = () => screen.getAllByTestId("card-front").map((n) => n.props.children);
    await fireEvent.changeText(field, "ESQUE");
    expect(fronts()).toEqual(["forget"]);
    await fireEvent.changeText(field, "facil");
    expect(fronts()).toEqual(["easy"]);
    await fireEvent.changeText(field, "  ");
    expect(fronts()).toEqual(["other", "easy", "forget"]);
    await fireEvent.changeText(field, "");
    expect(fronts()).toHaveLength(3);
    await rendered.unmount();
  });

  it("DECK-05 search without results shows not-found text", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "a", "b");
    const rendered = await open(deck.id);
    await fireEvent.changeText(await screen.findByLabelText("Buscar cartões"), "zzz");
    expect(screen.getByText("Nenhum cartão encontrado")).toBeTruthy();
    expect(screen.queryByText("Nenhum cartão ainda")).toBeNull();
    await rendered.unmount();
  });

  it("DECK-07 add card button opens the editor in create mode", async () => {
    const deck = seedDeck();
    const rendered = await open(deck.id);
    await fireEvent.press(await screen.findByRole("button", { name: "Adicionar cartão" }));
    expect(rendered).toHavePathname(`/decks/${deck.id}/cards/new`);
    await rendered.unmount();
  });

  it("DECK-08 pressing a card opens the editor in edit mode", async () => {
    const deck = seedDeck();
    const card = seedCard(deck.id, "a", "b");
    const rendered = await open(deck.id);
    await fireEvent.press(await screen.findByText("a"));
    expect(rendered).toHavePathname(`/cards/${card.id}/edit`);
    await rendered.unmount();
  });


  it("DECK-06 empty deck shows empty state and no search field", async () => {
    const deck = seedDeck();
    const rendered = await open(deck.id);
    expect(await screen.findByText("Nenhum cartão ainda")).toBeTruthy();
    expect(screen.queryByLabelText("Buscar cartões")).toBeNull();
    await rendered.unmount();
  });

  it.each(["xyz", "64b7f0000000000000000000"])("DECK-11 unknown id %s shows not found", async (id) => {
    const rendered = await renderRouterWithProviders(routes, realm, "/");
    await act(async () => router.push(`/decks/${id}`));
    expect(await screen.findByText("Baralho não encontrado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar ao início" }));
    expect(rendered).toHavePathname("/");
    await rendered.unmount();
  });

  it("PERF-01 renders fewer than 100 rows for 1000 cards", async () => {
    const deck = seedDeck();
    realm.write(() => {
      const obj = realm.objectForPrimaryKey(Deck, new Realm.BSON.ObjectId(deck.id))!;
      for (let i = 0; i < 1000; i++) {
        obj.cards.push(
          realm.create(Card, { front: `f${i}`, back: `b${i}`, createdAt: new Date(), dueDate: future() }),
        );
      }
    });
    const rendered = await open(deck.id);
    await screen.findByText("1000 cartões");
    const rows = (await screen.findAllByTestId("card-row")).length;
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThan(100);
    await rendered.unmount();
  });

  it("LOAD-01 shows neither not-found nor empty state while the deck read is pending", async () => {
    const deck = seedDeck();
    hold.deck = true;
    const rendered = await open(deck.id);
    expect(screen.queryByText("Baralho não encontrado")).toBeNull();
    expect(screen.queryByText("Nenhum cartão ainda")).toBeNull();
    await rendered.unmount();
  });

  it("LOAD-01 shows no empty state while the cards read is pending", async () => {
    const deck = seedDeck();
    hold.cards = true;
    const rendered = await open(deck.id);
    await screen.findByText("Inglês");
    expect(screen.queryByText("Nenhum cartão ainda")).toBeNull();
    await rendered.unmount();
  });

  it("THM-01 uses the dark background in dark mode", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");
    const deck = seedDeck();
    const rendered = await open(deck.id);
    await screen.findByText("Inglês");
    expect(screen.getByTestId("deck-screen")).toHaveStyle({
      backgroundColor: darkColors.background,
    });
    await rendered.unmount();
  });
});

import { fireEvent, screen } from "expo-router/testing-library";
import { StyleSheet, Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import DeckRoute from "../../../app/decks/[deckId]/index";
import DeckCardsRoute from "../../../app/decks/[deckId]/cards/index";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

const routes = {
  index: () => <Text>Início-home</Text>,
  "decks/[deckId]/index": DeckRoute,
  "decks/[deckId]/cards/index": DeckCardsRoute,
  "decks/[deckId]/cards/new": () => <Text>Editor-novo</Text>,
  "cards/[cardId]/edit": () => <Text>Editor-editar</Text>,
};

describe("DeckCardsScreen", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    realm.close();
  });

  const seedDeck = (name = "Inglês") => createDeckRepository(realm).create({ name });
  const seedCard = (deckId: string, front: string, back: string) =>
    createCardRepository(realm).create(deckId, { front, back });
  const open = (id: string) => renderRouterWithProviders(routes, realm, `/decks/${id}/cards`);
  const fronts = () => screen.getAllByTestId("card-front").map((n) => n.props.children);

  it("ALL-05 shows back link, add button, title, subtitle and search placeholder", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "a", "b");
    seedCard(deck.id, "c", "d");
    seedCard(deck.id, "e", "f");
    const rendered = await open(deck.id);
    expect(await screen.findByText("Todos os cartões")).toBeTruthy();
    expect(screen.getByText("Inglês · 3 cartões")).toBeTruthy();
    expect(await screen.findByPlaceholderText("Buscar na frente ou no verso")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Baralho" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Adicionar cartão" })).toBeTruthy();
    await rendered.unmount();
  });

  it("ALL-05 Adicionar cartão opens the editor in create mode", async () => {
    const deck = seedDeck();
    const rendered = await open(deck.id);
    await fireEvent.press(await screen.findByRole("button", { name: "Adicionar cartão" }));
    expect(rendered).toHavePathname(`/decks/${deck.id}/cards/new`);
    await rendered.unmount();
  });

  it("ALL-05 Baralho goes back to the deck screen", async () => {
    const deck = seedDeck();
    const rendered = await open(deck.id);
    await fireEvent.press(await screen.findByRole("button", { name: "Baralho" }));
    expect(rendered).toHavePathname(`/decks/${deck.id}`);
    await rendered.unmount();
  });

  it("ALL-06 lists every card newest first and a row opens the editor", async () => {
    const deck = seedDeck();
    let last = "";
    for (let i = 1; i <= 8; i++) last = seedCard(deck.id, `c${i}`, `v${i}`).id;
    const rendered = await open(deck.id);
    await screen.findByText("c8");
    expect(fronts()).toEqual(["c8", "c7", "c6", "c5", "c4", "c3", "c2", "c1"]);
    await fireEvent.press(screen.getByText("c8"));
    expect(rendered).toHavePathname(`/cards/${last}/edit`);
    await rendered.unmount();
  });

  it("ALL-07 search filters by front or back ignoring case and accents", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "forget", "esquecer");
    seedCard(deck.id, "easy", "fácil");
    seedCard(deck.id, "other", "outro");
    const rendered = await open(deck.id);
    const field = await screen.findByLabelText("Buscar cartões");
    await fireEvent.changeText(field, "ESQUE");
    expect(fronts()).toEqual(["forget"]);
    await fireEvent.changeText(field, "facil");
    expect(fronts()).toEqual(["easy"]);
    await fireEvent.changeText(field, "  ");
    expect(fronts()).toEqual(["other", "easy", "forget"]);
    await rendered.unmount();
  });

  it("ALL-08 no match shows Nenhum cartão encontrado", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "a", "b");
    const rendered = await open(deck.id);
    await fireEvent.changeText(await screen.findByLabelText("Buscar cartões"), "zzz");
    expect(screen.getByText("Nenhum cartão encontrado")).toBeTruthy();
    expect(screen.queryByText("Nenhum cartão ainda")).toBeNull();
    await rendered.unmount();
  });

  it("ALL-08 empty deck shows Nenhum cartão ainda and no search field", async () => {
    const deck = seedDeck();
    const rendered = await open(deck.id);
    expect(await screen.findByText("Nenhum cartão ainda")).toBeTruthy();
    expect(screen.queryByLabelText("Buscar cartões")).toBeNull();
    await rendered.unmount();
  });

  it("ALL-09 unknown deck shows not found with Voltar ao início", async () => {
    const rendered = await open("000000000000000000000000");
    expect(await screen.findByText("Baralho não encontrado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar ao início" }));
    expect(rendered).toHavePathname("/");
    await rendered.unmount();
  });

  it("ALL-10 renders fewer than 100 rows for 1000 cards", async () => {
    const deck = seedDeck();
    realm.write(() => {
      const obj = realm.objectForPrimaryKey(Deck, new Realm.BSON.ObjectId(deck.id))!;
      for (let i = 0; i < 1000; i++) {
        obj.cards.push(
          realm.create(Card, { front: `f${i}`, back: `b${i}`, createdAt: new Date(), dueDate: new Date() }),
        );
      }
    });
    const rendered = await open(deck.id);
    await screen.findByText("Inglês · 1000 cartões");
    const rows = (await screen.findAllByTestId("card-row")).length;
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThan(100);
    await rendered.unmount();
  });

  it("ALL-15 every button has role, label and a 44pt touch target", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "a", "b");
    const rendered = await open(deck.id);
    await screen.findByText("a");
    for (const name of ["Baralho", "Adicionar cartão"]) {
      const target = screen.getByRole("button", { name });
      const style = StyleSheet.flatten(target.props.style) ?? {};
      expect(target.props.accessibilityRole).toBe("button");
      expect(Math.max(style.minHeight ?? 0, Number(style.height ?? 0))).toBeGreaterThanOrEqual(44);
    }
    expect(screen.getByLabelText("Buscar cartões")).toBeTruthy();
    await rendered.unmount();
  });
});

import { act, fireEvent, screen } from "expo-router/testing-library";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import StudyDeckRoute from "../../../app/decks/[deckId]/study";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = { "decks/[deckId]/study": StudyDeckRoute };
const DAY = 24 * 60 * 60 * 1000;

describe("StudyScreen answering", () => {
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
    const cards = fronts.map((front, i) => {
      const card = createCardRepository(realm).create(deck.id, { front, back: `${front}-verso` });
      realm.write(() => {
        const obj = realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!;
        obj.dueDate = new Date(Date.now() - DAY + i);
      });
      return card;
    });
    return { deck, cards };
  }
  const open = (deckId: string) => renderRouterWithProviders(routes, realm, `/decks/${deckId}/study`);
  const reveal = async () => fireEvent.press(await screen.findByRole("button", { name: "Mostrar resposta" }));
  const grade = async (name: string) =>
    fireEvent.press(await screen.findByRole("button", { name: new RegExp(`^${name}, `) }));
  const logs = () => realm.objects(ReviewLog);

  it("ANS-01 Bom writes one ReviewLog grade 2 and repetitions 1", async () => {
    const { deck, cards } = seed(["a"]);
    const rendered = await open(deck.id);
    await reveal();
    await grade("Bom");
    expect(await screen.findByText("Sessão concluída")).toBeTruthy();
    expect(logs().length).toBe(1);
    expect(logs()[0].grade).toBe(2);
    const stored = realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(cards[0].id))!;
    expect(stored.repetitions).toBe(1);
    await rendered.unmount();
  });

  it("ANS-02 Errei sends the card to the end; it returns with Difícil, 1 dia", async () => {
    const { deck } = seed(["a", "b"]);
    const rendered = await open(deck.id);
    await reveal();
    await grade("Errei");
    expect(await screen.findByText("b")).toBeTruthy();
    expect(screen.getByText("1 de 2")).toBeTruthy();
    await reveal();
    await grade("Bom");
    expect(await screen.findByText("a")).toBeTruthy();
    await reveal();
    expect(screen.getByRole("button", { name: "Difícil, 1 dia" })).toBeTruthy();
    await rendered.unmount();
  });

  it("ANS-04 the next card shows FRENTE without VERSO", async () => {
    const { deck } = seed(["a", "b"]);
    const rendered = await open(deck.id);
    await reveal();
    await grade("Bom");
    expect(await screen.findByText("b")).toBeTruthy();
    expect(screen.getByText("FRENTE")).toBeTruthy();
    expect(screen.queryByText("VERSO")).toBeNull();
    await rendered.unmount();
  });

  it("ANS-06 two quick presses on Bom write one ReviewLog", async () => {
    const { deck } = seed(["a", "b"]);
    const rendered = await open(deck.id);
    await reveal();
    const bom = await screen.findByRole("button", { name: /^Bom, / });
    await act(async () => {
      fireEvent.press(bom);
      fireEvent.press(bom);
    });
    await screen.findByText("b");
    expect(logs().length).toBe(1);
    await rendered.unmount();
  });

  it("ANS-08 a failed write shows the error, keeps the back, and retry saves", async () => {
    const { deck } = seed(["a", "b"]);
    const rendered = await open(deck.id);
    await reveal();
    const write = realm.write.bind(realm);
    jest.spyOn(realm, "write").mockImplementationOnce(() => {
      throw new Error("disk full");
    });
    await grade("Bom");
    expect(await screen.findByText("Não foi possível salvar a resposta. Tente de novo.")).toBeTruthy();
    expect(screen.getByText("VERSO")).toBeTruthy();
    expect(screen.getByText("a-verso")).toBeTruthy();
    expect(screen.getByText("1 de 2")).toBeTruthy();
    expect(logs().length).toBe(0);
    jest.spyOn(realm, "write").mockImplementation(write);
    await grade("Bom");
    expect(await screen.findByText("b")).toBeTruthy();
    expect(logs().length).toBe(1);
    await rendered.unmount();
  });

  it("QUE-02 a card created during the session does not join the queue", async () => {
    const { deck } = seed(["a"]);
    const rendered = await open(deck.id);
    await screen.findByText("a");
    seed2(deck.id);
    await reveal();
    await grade("Bom");
    expect(await screen.findByText("Sessão concluída")).toBeTruthy();
    expect(screen.getByText("1 cartão revisto")).toBeTruthy();
    await rendered.unmount();
  });

  it("QUE-05 a card deleted during the session is skipped and counted", async () => {
    const { deck, cards } = seed(["a", "b"]);
    const rendered = await open(deck.id);
    await screen.findByText("a");
    realm.write(() => {
      realm.delete(realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(cards[1].id)));
    });
    await reveal();
    await grade("Bom");
    expect(await screen.findByText("Sessão concluída")).toBeTruthy();
    expect(screen.getByText("2 cartões revistos")).toBeTruthy();
    expect(logs().length).toBe(1);
    await rendered.unmount();
  });

  function seed2(deckId: string) {
    const card = createCardRepository(realm).create(deckId, { front: "novo", back: "x" });
    realm.write(() => {
      realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!.dueDate = new Date(Date.now() - DAY);
    });
  }
});

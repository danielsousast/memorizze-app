import { act, fireEvent, screen, within } from "expo-router/testing-library";
import { router } from "expo-router";
import * as ReactNative from "react-native";
import { Alert, StyleSheet, Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { darkColors } from "@/theme";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import DeckRoute from "../../../app/decks/[deckId]/index";
import DeckCardsRoute from "../../../app/decks/[deckId]/cards/index";

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
  "decks/[deckId]/cards/index": DeckCardsRoute,
  "decks/[deckId]/cards/new": () => <Text>Editor-novo</Text>,
  "decks/[deckId]/edit": () => <Text>Form-editar</Text>,
  "cards/[cardId]/edit": () => <Text>Editor-editar</Text>,
  "decks/[deckId]/study": () => <Text>Sessão-baralho</Text>,
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

  type Schedule = {
    repetitions?: number;
    intervalDays?: number;
    dueDate?: Date;
  };
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
    seedCard(deck.id, "b", "b", {
      repetitions: 4,
      intervalDays: 30,
      dueDate: future(),
    });
    seedCard(deck.id, "c", "c", {
      repetitions: 1,
      intervalDays: 3,
      dueDate: future(),
    });
    const rendered = await open(deck.id);
    expect(await screen.findByText("3 cartões")).toBeTruthy();
    expect(screen.getByText("1 para hoje")).toBeTruthy();
    expect(await screen.findByText("1 maduros")).toBeTruthy();
    await rendered.unmount();
  });

  it("DECK-02 omits due and mature badges when there are none", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "a", "a", {
      repetitions: 1,
      intervalDays: 3,
      dueDate: future(),
    });
    const rendered = await open(deck.id);
    expect(await screen.findByText("1 cartão")).toBeTruthy();
    await screen.findByTestId("card-row");
    expect(screen.queryByText(/para hoje/)).toBeNull();
    expect(screen.queryByText(/maduros/)).toBeNull();
    await rendered.unmount();
  });

  it("DECK-03 lists newest first with joined back lines and stage badges", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "c1", "v1", {
      repetitions: 4,
      intervalDays: 30,
      dueDate: future(),
    });
    seedCard(deck.id, "c2", "v2", {
      repetitions: 1,
      intervalDays: 3,
      dueDate: future(),
    });
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

  function seedMany(deckId: string, count: number) {
    for (let i = 1; i <= count; i++) seedCard(deckId, `c${i}`, `v${i}`);
  }
  const fronts = () => screen.getAllByTestId("card-front").map((n) => n.props.children);

  it("ALL-01 lists only the 5 newest cards, newest first", async () => {
    const deck = seedDeck();
    seedMany(deck.id, 7);
    const rendered = await open(deck.id);
    await screen.findByText("c7");
    expect(fronts()).toEqual(["c7", "c6", "c5", "c4", "c3"]);
    await rendered.unmount();
  });

  it("ALL-02 Ver todos appears only with more than 5 cards", async () => {
    const six = seedDeck("Seis");
    seedMany(six.id, 6);
    const rendered = await open(six.id);
    expect(await screen.findByRole("button", { name: "Ver todos" })).toBeTruthy();
    await rendered.unmount();

    const five = seedDeck("Cinco");
    seedMany(five.id, 5);
    const again = await open(five.id);
    await screen.findByText("c5");
    expect(screen.queryByRole("button", { name: "Ver todos" })).toBeNull();
    await again.unmount();
  });

  it("ALL-03 Ver todos opens the full list route", async () => {
    const deck = seedDeck();
    seedMany(deck.id, 6);
    const rendered = await open(deck.id);
    await fireEvent.press(await screen.findByRole("button", { name: "Ver todos" }));
    expect(rendered).toHavePathname(`/decks/${deck.id}/cards`);
    await rendered.unmount();
  });

  it("ALL-04 the deck screen has no search field", async () => {
    const deck = seedDeck();
    seedMany(deck.id, 8);
    const rendered = await open(deck.id);
    await screen.findByText("c8");
    expect(screen.queryByLabelText("Buscar cartões")).toBeNull();
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

  async function openMenu() {
    await fireEvent.press(await screen.findByRole("button", { name: "Opções do baralho" }));
  }

  function failWrites() {
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("boom");
    });
  }

  function cardOf(id: string) {
    return realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(id))!;
  }

  it("MENU-01 options sheet shows title, subtitle, actions and cancel", async () => {
    const deck = seedDeck("Inglês");
    seedCard(deck.id, "a", "b");
    seedCard(deck.id, "c", "d", { dueDate: new Date(Date.now() + 9 * DAY) });
    const rendered = await open(deck.id);
    await openMenu();
    expect(screen.getAllByText("Inglês").length).toBeGreaterThan(1);
    expect(screen.getByText("2 cartões · 1 para hoje")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Adicionar cartão" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Editar baralho" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Redefinir progresso" })).toBeTruthy();
    expect(screen.getByText("Todos os cartões voltam a ser novos")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Excluir baralho" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
    await rendered.unmount();
  });

  it("MENU-02 Adicionar cartão in the sheet opens the new-card editor", async () => {
    const deck = seedDeck();
    const rendered = await open(deck.id);
    await openMenu();
    const buttons = screen.getAllByRole("button", { name: "Adicionar cartão" });
    await fireEvent.press(buttons[buttons.length - 1]);
    expect(rendered).toHavePathname(`/decks/${deck.id}/cards/new`);
    await rendered.unmount();
  });

  it("MENU-03 Editar baralho in the sheet opens the form, there is no header edit button and no Alert is used", async () => {
    const deck = seedDeck();
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const rendered = await open(deck.id);
    await screen.findByRole("button", { name: "Opções do baralho" });
    expect(screen.queryByRole("button", { name: "Editar baralho" })).toBeNull();
    await openMenu();
    await fireEvent.press(screen.getByRole("button", { name: "Editar baralho" }));
    expect(rendered).toHavePathname(`/decks/${deck.id}/edit`);
    expect(alert).not.toHaveBeenCalled();
    await rendered.unmount();
  });

  it("RST-01 RST-02 reset zeroes scheduling, keeps ReviewLog and toasts", async () => {
    const deck = seedDeck();
    const card = seedCard(deck.id, "a", "b", {
      repetitions: 5,
      intervalDays: 20,
      dueDate: new Date(Date.now() + 20 * DAY),
    });
    realm.write(() => {
      realm.create(ReviewLog, {
        cardId: new Realm.BSON.ObjectId(card.id),
        deckId: new Realm.BSON.ObjectId(deck.id),
        grade: 3,
        reviewedAt: new Date(),
      });
    });
    const rendered = await open(deck.id);
    expect(await screen.findByText("Estudar")).toBeTruthy();
    await openMenu();
    await fireEvent.press(screen.getByRole("button", { name: "Redefinir progresso" }));
    expect(await screen.findByText("Progresso redefinido")).toBeTruthy();
    expect(await screen.findByText("Estudar · 1 cartão")).toBeTruthy();
    expect(cardOf(card.id).repetitions).toBe(0);
    expect(cardOf(card.id).intervalDays).toBe(0);
    expect(realm.objects(ReviewLog)).toHaveLength(1);
    await rendered.unmount();
  });

  it("MENU-04 a failed reset shows the error toast and keeps the data", async () => {
    const deck = seedDeck();
    const card = seedCard(deck.id, "a", "b", { repetitions: 5 });
    const rendered = await open(deck.id);
    await openMenu();
    failWrites();
    await fireEvent.press(screen.getByRole("button", { name: "Redefinir progresso" }));
    expect(await screen.findByText("Não foi possível redefinir o progresso")).toBeTruthy();
    expect(cardOf(card.id).repetitions).toBe(5);
    await rendered.unmount();
  });

  async function openDeleteDialog() {
    await openMenu();
    await fireEvent.press(screen.getByRole("button", { name: "Excluir baralho" }));
  }

  it.each([
    [2, "“Inglês” e seus 2 cartões serão apagados deste aparelho. Não dá para desfazer."],
    [1, "“Inglês” e seu único cartão serão apagados deste aparelho. Não dá para desfazer."],
    [0, "“Inglês” será apagado deste aparelho. Não dá para desfazer."],
  ])("DEL-01 confirmation dialog for %i cards", async (count, message) => {
    const deck = seedDeck("Inglês");
    for (let i = 0; i < count; i++) seedCard(deck.id, `f${i}`, `b${i}`);
    const rendered = await open(deck.id);
    await openDeleteDialog();
    expect(await screen.findByText("Excluir baralho?")).toBeTruthy();
    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Excluir baralho" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
    await rendered.unmount();
  });

  it("DEL-03 confirming deletes deck and cards, returns home and toasts", async () => {
    const deck = seedDeck("Inglês");
    seedCard(deck.id, "a", "b");
    const rendered = await renderRouterWithProviders(routes, realm, "/");
    await act(async () => router.push(`/decks/${deck.id}`));
    await openDeleteDialog();
    await screen.findByText("Excluir baralho?");
    const confirms = screen.getAllByRole("button", { name: "Excluir baralho" });
    await fireEvent.press(confirms[confirms.length - 1]);
    expect(await screen.findByText("Baralho excluído")).toBeTruthy();
    expect(rendered).toHavePathname("/");
    expect(screen.queryByText("Baralho não encontrado")).toBeNull();
    expect(realm.objects(Deck)).toHaveLength(0);
    expect(realm.objects(Card)).toHaveLength(0);
    await rendered.unmount();
  });

  it("DEL-02 cancelling leaves everything unchanged", async () => {
    const deck = seedDeck("Inglês");
    seedCard(deck.id, "a", "b");
    const rendered = await open(deck.id);
    await openDeleteDialog();
    await screen.findByText("Excluir baralho?");
    const cancels = screen.getAllByRole("button", { name: "Cancelar" });
    await fireEvent.press(cancels[cancels.length - 1]);
    expect(screen.queryByText("Excluir baralho?")).toBeNull();
    expect(rendered).toHavePathname(`/decks/${deck.id}`);
    expect(realm.objects(Deck)).toHaveLength(1);
    expect(realm.objects(Card)).toHaveLength(1);
    await rendered.unmount();
  });

  it("DEL-04 a failed delete keeps the screen and shows the error toast", async () => {
    const deck = seedDeck("Inglês");
    seedCard(deck.id, "a", "b");
    const rendered = await open(deck.id);
    await openDeleteDialog();
    await screen.findByText("Excluir baralho?");
    failWrites();
    const confirms = screen.getAllByRole("button", { name: "Excluir baralho" });
    await fireEvent.press(confirms[confirms.length - 1]);
    expect(await screen.findByText("Não foi possível excluir o baralho")).toBeTruthy();
    expect(rendered).toHavePathname(`/decks/${deck.id}`);
    expect(realm.objects(Deck)).toHaveLength(1);
    await rendered.unmount();
  });

  it("DECK-06 empty deck shows empty state and no search field", async () => {
    const deck = seedDeck();
    const rendered = await open(deck.id);
    expect(await screen.findByText("Nenhum cartão ainda")).toBeTruthy();
    expect(screen.queryByLabelText("Buscar cartões")).toBeNull();
    await rendered.unmount();
  });

  it.each(["xyz", "64b7f0000000000000000000"])(
    "DECK-11 unknown id %s shows not found",
    async (id) => {
      const rendered = await renderRouterWithProviders(routes, realm, "/");
      await act(async () => router.push(`/decks/${id}`));
      expect(await screen.findByText("Baralho não encontrado")).toBeTruthy();
      await fireEvent.press(screen.getByRole("button", { name: "Voltar ao início" }));
      expect(rendered).toHavePathname("/");
      await rendered.unmount();
    },
  );

  it("PERF-01 renders fewer than 100 rows for 1000 cards", async () => {
    const deck = seedDeck();
    realm.write(() => {
      const obj = realm.objectForPrimaryKey(Deck, new Realm.BSON.ObjectId(deck.id))!;
      for (let i = 0; i < 1000; i++) {
        obj.cards.push(
          realm.create(Card, {
            front: `f${i}`,
            back: `b${i}`,
            createdAt: new Date(),
            dueDate: future(),
          }),
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

  it("A11Y-01 every tappable has role, label and a 44pt touch target", async () => {
    const deck = seedDeck();
    seedMany(deck.id, 5);
    seedCard(deck.id, "to forget", "esquecer\nverbo");
    const rendered = await open(deck.id);
    await screen.findByText("to forget");
    const targets = [
      screen.getAllByTestId("card-row")[0],
      screen.getByRole("button", { name: "Ver todos" }),
      screen.getByRole("button", { name: "Início" }),
      screen.getByRole("button", { name: "Opções do baralho" }),
      screen.getByRole("button", { name: "Adicionar cartão" }),
    ];
    for (const target of targets) {
      expect(target.props.accessibilityRole).toBe("button");
      expect(target.props.accessibilityLabel).toBeTruthy();
      const style = StyleSheet.flatten(target.props.style) ?? {};
      const slop = target.props.hitSlop;
      const extra = (side: "top" | "bottom" | "left" | "right") =>
        typeof slop === "number" ? slop : (slop?.[side] ?? 0);
      const height =
        Math.max(style.minHeight ?? 0, Number(style.height ?? 0)) + extra("top") + extra("bottom");
      expect(height).toBeGreaterThanOrEqual(44);
      // Width is content-sized for rows and links; only check it where the style fixes it.
      const fixed = Math.max(style.minWidth ?? 0, Number(style.width ?? 0));
      if (fixed > 0) expect(fixed + extra("left") + extra("right")).toBeGreaterThanOrEqual(44);
    }
    expect(screen.getByLabelText("to forget, esquecer verbo")).toBeTruthy();
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

  it.each([
    [12, "Estudar · 12 cartões"],
    [1, "Estudar · 1 cartão"],
    [0, "Estudar"],
  ])("ENT-01 with %i due cards the button reads %s", async (due, label) => {
    const deck = seedDeck();
    for (let i = 0; i < due; i++) seedCard(deck.id, `f${i}`, `b${i}`);
    const rendered = await open(deck.id);
    expect(await screen.findByRole("button", { name: label })).toBeTruthy();
    await rendered.unmount();
  });

  it("ENT-01 shows Estudar for a deck without cards", async () => {
    const deck = seedDeck();
    const rendered = await open(deck.id);
    expect(await screen.findByRole("button", { name: "Estudar" })).toBeTruthy();
    await rendered.unmount();
  });

  it("ENT-03 tapping Estudar opens the deck session", async () => {
    const deck = seedDeck();
    seedCard(deck.id, "a", "b");
    const rendered = await open(deck.id);
    await fireEvent.press(await screen.findByRole("button", { name: "Estudar · 1 cartão" }));
    expect(rendered).toHavePathname(`/decks/${deck.id}/study`);
    await rendered.unmount();
  });
});

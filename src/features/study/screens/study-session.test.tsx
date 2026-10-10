import { router } from "expo-router";
import { act, fireEvent, screen } from "expo-router/testing-library";
import * as ReactNative from "react-native";
import { StyleSheet, Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { darkColors } from "@/theme";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import StudyDeckRoute from "../../../app/decks/[deckId]/study";
import StudyAllRoute from "../../../app/study";

// LOAD-01 needs a queue read that has not resolved yet.
const hold = { queue: false };
jest.mock("@/features/study/usecases/use-study-queue", () => {
  const actual = jest.requireActual("@/features/study/usecases/use-study-queue");
  return {
    useStudyQueue: (id?: string) =>
      hold.queue ? { isPending: true, data: undefined } : actual.useStudyQueue(id),
  };
});

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

const routes = {
  index: () => <Text>Início-home</Text>,
  study: StudyAllRoute,
  "decks/[deckId]/study": StudyDeckRoute,
};

const DAY = 24 * 60 * 60 * 1000;

describe("StudyScreen session", () => {
  let realm: Realm;
  beforeEach(() => {
    hold.queue = false;
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  type Srs = { repetitions?: number; intervalDays?: number; easeFactor?: number };
  function seedDeck(name = "Inglês") {
    return createDeckRepository(realm).create({ name });
  }
  function seedDue(deckId: string, front: string, back: string, srs: Srs = {}) {
    const card = createCardRepository(realm).create(deckId, { front, back });
    realm.write(() => {
      const obj = realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!;
      Object.assign(obj, { ...srs, dueDate: new Date(Date.now() - DAY) });
    });
    return card;
  }
  const open = (url: string) => renderRouterWithProviders(routes, realm, url);
  const labelsOf = () =>
    ["Errei", "Difícil", "Bom", "Fácil"].map(
      (g) => screen.getByRole("button", { name: new RegExp(`^${g}, `) }).props.accessibilityLabel,
    );

  it("SES-01 shows 1 de 3, an empty bar and the exit button", async () => {
    const deck = seedDeck();
    ["a", "b", "c"].forEach((f) => seedDue(deck.id, f, "x"));
    const rendered = await open(`/decks/${deck.id}/study`);
    expect(await screen.findByText("1 de 3")).toBeTruthy();
    expect(screen.getByRole("progressbar").props.accessibilityValue).toMatchObject({ now: 0, max: 3 });
    expect(screen.getByRole("button", { name: "Sair da sessão" })).toBeTruthy();
    await rendered.unmount();
  });

  it("SES-02 /study shows the deck name of the first card", async () => {
    const a = seedDeck("Deck A");
    const b = seedDeck("Deck B");
    seedDue(a.id, "fa", "x");
    seedDue(b.id, "fb", "x");
    const rendered = await open("/study");
    expect(await screen.findByText("Deck A")).toBeTruthy();
    await rendered.unmount();
  });

  it("SES-03 front shows FRENTE, text, hint and Mostrar resposta, no VERSO", async () => {
    const deck = seedDeck();
    seedDue(deck.id, "choose", "escolher");
    const rendered = await open(`/decks/${deck.id}/study`);
    expect(await screen.findByText("FRENTE")).toBeTruthy();
    expect(screen.getByText("choose")).toBeTruthy();
    expect(screen.getByText("Toque para ver a resposta")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mostrar resposta" })).toBeTruthy();
    expect(screen.queryByText("VERSO")).toBeNull();
    await rendered.unmount();
  });

  it("FLP-03 grade buttons appear at the start of the flip, before the back face", async () => {
    const deck = seedDeck();
    seedDue(deck.id, "choose", "escolher");
    await open(`/decks/${deck.id}/study`);
    await fireEvent.press(await screen.findByTestId("study-card"));
    expect(screen.getByText("Como foi lembrar?")).toBeTruthy();
    expect(screen.queryByText("VERSO")).toBeNull();
    expect(await screen.findByText("VERSO")).toBeTruthy();
  });

  it("SES-04 tapping the card or Mostrar resposta reveals the back", async () => {
    const deck = seedDeck();
    seedDue(deck.id, "choose", "escolher");
    const rendered = await open(`/decks/${deck.id}/study`);
    await fireEvent.press(await screen.findByTestId("study-card"));
    expect(await screen.findByText("VERSO")).toBeTruthy();
    expect(screen.getByText("escolher")).toBeTruthy();
    expect(screen.getByText("Como foi lembrar?")).toBeTruthy();
    await rendered.unmount();

    const again = await open(`/decks/${deck.id}/study`);
    await fireEvent.press(await screen.findByRole("button", { name: "Mostrar resposta" }));
    expect(await screen.findByText("VERSO")).toBeTruthy();
    expect(screen.getByText("Como foi lembrar?")).toBeTruthy();
    await again.unmount();
  });

  it("SES-05 answer buttons carry the schedule labels", async () => {
    const deck = seedDeck();
    seedDue(deck.id, "new", "x");
    let rendered = await open(`/decks/${deck.id}/study`);
    await fireEvent.press(await screen.findByTestId("study-card"));
    expect(labelsOf()).toEqual(["Errei, agora", "Difícil, 1 dia", "Bom, 1 dia", "Fácil, 1 dia"]);
    expect(screen.getAllByText("agora").length).toBe(1);
    await rendered.unmount();

    const other = seedDeck("Outro");
    seedDue(other.id, "old", "x", { repetitions: 2, intervalDays: 3, easeFactor: 2.5 });
    rendered = await open(`/decks/${other.id}/study`);
    await fireEvent.press(await screen.findByTestId("study-card"));
    expect(labelsOf()).toEqual(["Errei, agora", "Difícil, 4 dias", "Bom, 8 dias", "Fácil, 10 dias"]);
    await rendered.unmount();
  });

  it("SES-06 no answer buttons while the front is visible", async () => {
    const deck = seedDeck();
    seedDue(deck.id, "choose", "escolher");
    const rendered = await open(`/decks/${deck.id}/study`);
    await screen.findByText("FRENTE");
    for (const g of ["Errei", "Difícil", "Bom", "Fácil"]) {
      expect(screen.queryByRole("button", { name: new RegExp(`^${g}`) })).toBeNull();
    }
    await rendered.unmount();
  });

  it("A11Y-01 progress bar and tappables expose role, label and 44pt", async () => {
    const deck = seedDeck();
    ["a", "b", "c"].forEach((f) => seedDue(deck.id, f, "x"));
    const rendered = await open(`/decks/${deck.id}/study`);
    await fireEvent.press(await screen.findByTestId("study-card"));
    expect(screen.getByRole("progressbar").props.accessibilityLabel).toBe("Cartão 1 de 3");
    expect(screen.getByRole("button", { name: "Bom, 1 dia" })).toBeTruthy();
    const targets = [
      screen.getByRole("button", { name: "Sair da sessão" }),
      screen.getByTestId("study-card"),
      screen.getByRole("button", { name: "Errei, agora" }),
      screen.getByRole("button", { name: "Bom, 1 dia" }),
    ];
    for (const target of targets) {
      expect(target.props.accessibilityRole).toBe("button");
      expect(target.props.accessibilityLabel).toBeTruthy();
      const style = StyleSheet.flatten(target.props.style) ?? {};
      const slop = typeof target.props.hitSlop === "number" ? target.props.hitSlop : 0;
      const height = Math.max(style.minHeight ?? 0, Number(style.height ?? 0)) + 2 * slop;
      // The flexible study card has no fixed height; it fills the screen.
      if (target !== screen.getByTestId("study-card")) expect(height).toBeGreaterThanOrEqual(44);
    }
    await rendered.unmount();
  });

  it("QUE-04 unknown deck shows not found and Voltar ao início goes home", async () => {
    const rendered = await open("/");
    await act(async () => router.push("/decks/xyz/study"));
    expect(await screen.findByText("Baralho não encontrado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar ao início" }));
    expect(rendered).toHavePathname("/");
    await rendered.unmount();
  });

  it("LOAD-01 shows neither empty nor not-found while the queue is pending", async () => {
    hold.queue = true;
    const deck = seedDeck();
    const rendered = await open(`/decks/${deck.id}/study`);
    expect(screen.getByTestId("study-screen")).toBeTruthy();
    expect(screen.queryByText("Nada para revisar hoje")).toBeNull();
    expect(screen.queryByText("Baralho não encontrado")).toBeNull();
    await rendered.unmount();
  });

  it("THM-01 uses the dark background in dark mode", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");
    const deck = seedDeck();
    seedDue(deck.id, "choose", "escolher");
    const rendered = await open(`/decks/${deck.id}/study`);
    await screen.findByText("FRENTE");
    expect(screen.getByTestId("study-screen")).toHaveStyle({ backgroundColor: darkColors.background });
    await rendered.unmount();
  });
});

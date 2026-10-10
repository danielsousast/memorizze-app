import { router } from "expo-router";
import { act, fireEvent, screen } from "expo-router/testing-library";
import * as ReactNative from "react-native";
import { BackHandler, StyleSheet, Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { darkColors, lightColors } from "@/theme";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import DeckRoute from "../../../app/decks/[deckId]/index";
import StudyDeckRoute from "../../../app/decks/[deckId]/study";
import StudyAllRoute from "../../../app/study";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = {
  index: () => <Text>Início-home</Text>,
  study: StudyAllRoute,
  "decks/[deckId]/index": DeckRoute,
  "decks/[deckId]/study": StudyDeckRoute,
  "decks/[deckId]/cards/new": () => <Text>Editor-novo</Text>,
  "decks/[deckId]/edit": () => <Text>Form-editar</Text>,
  "cards/[cardId]/edit": () => <Text>Editor-editar</Text>,
};
const DAY = 24 * 60 * 60 * 1000;

describe("StudyScreen summary", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    realm.close();
  });

  function seed(count: number, mature = false) {
    const deck = createDeckRepository(realm).create({ name: "Inglês" });
    for (let i = 0; i < count; i += 1) {
      const card = createCardRepository(realm).create(deck.id, { front: `f${i}`, back: `b${i}` });
      realm.write(() => {
        realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!.dueDate = new Date(
          Date.now() - DAY + i,
        );
        if (mature) {
          const stored = realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!;
          stored.repetitions = 2;
          stored.intervalDays = 6;
        }
      });
    }
    return deck;
  }
  const open = (deckId: string) => renderRouterWithProviders(routes, realm, `/decks/${deckId}/study`);
  // Answers the cards in order; `before` runs just before the last answer (clock control).
  async function answer(names: string[], before?: () => void) {
    for (let i = 0; i < names.length; i += 1) {
      await fireEvent.press(await screen.findByRole("button", { name: "Mostrar resposta" }));
      const button = await screen.findByRole("button", { name: new RegExp(`^${names[i]}, `) });
      if (i === names.length - 1) before?.();
      await fireEvent.press(button);
      if (i < names.length - 1) await screen.findByText("FRENTE");
    }
    await screen.findByText("Sessão concluída");
  }
  const logYesterday = (deckId: string) =>
    realm.write(() => {
      realm.create(ReviewLog, {
        cardId: new Realm.BSON.ObjectId(),
        deckId: new Realm.BSON.ObjectId(deckId),
        grade: 2,
        reviewedAt: new Date(Date.now() - DAY),
      });
    });
  const fakeDateOnly = () =>
    jest.useFakeTimers({
      now: Date.now(),
      doNotFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "setImmediate",
        "clearImmediate",
        "nextTick",
        "queueMicrotask",
        "requestAnimationFrame",
        "cancelAnimationFrame",
        "requestIdleCallback",
        "cancelIdleCallback",
        "performance",
      ],
    });

  it("ANS-05 last answer shows the summary, back handler stops, back leaves the route", async () => {
    const add = jest.spyOn(BackHandler, "addEventListener");
    const deck = seed(1);
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}`);
    await act(async () => {
      router.push(`/decks/${deck.id}/study`);
    });
    await answer(["Bom"]);
    const subscriptions = add.mock.results.map((r) => r.value as { remove: jest.Mock | (() => void) });
    expect(subscriptions.length).toBeGreaterThan(0);
    // The listener was removed: pressing back falls through to the router.
    await act(async () => router.back());
    expect(rendered).toHavePathname(`/decks/${deck.id}`);
    expect(screen.queryByText("Sessão concluída")).toBeNull();
    await rendered.unmount();
  });

  it("SUM-01 shows the title and the encouragement", async () => {
    const deck = seed(1);
    const rendered = await open(deck.id);
    await answer(["Bom"]);
    expect(screen.getByText("Bom trabalho! Você revisou tudo o que vencia hoje.")).toBeTruthy();
    await rendered.unmount();
  });

  it("SUM-02 and SUM-03 show cards reviewed and accuracy", async () => {
    const deck = seed(2);
    const rendered = await open(deck.id);
    await answer(["Errei", "Bom", "Fácil"]);
    expect(screen.getByText("2 cartões revistos")).toBeTruthy();
    expect(screen.getByText("67% de acerto")).toBeTruthy();
    await rendered.unmount();
  });

  it("SUM-02 singular", async () => {
    const deck = seed(1);
    const rendered = await open(deck.id);
    await answer(["Bom"]);
    expect(screen.getByText("1 cartão revisto")).toBeTruthy();
    await rendered.unmount();
  });

  it.each([
    [true, "2 dias seguidos"],
    [false, "1 dia seguido"],
  ])("SUM-04 streak (yesterday logged: %s)", async (yesterday, text) => {
    const deck = seed(1);
    if (yesterday) logYesterday(deck.id);
    const rendered = await open(deck.id);
    await answer(["Bom"]);
    expect(await screen.findByText(text)).toBeTruthy();
    await rendered.unmount();
  });

  it.each([
    [160_000, "3 min de estudo"],
    [20_000, "< 1 min de estudo"],
  ])("SUM-05 counts, segmented bar and study time (%i ms)", async (elapsed, text) => {
    const deck = seed(2);
    fakeDateOnly();
    const rendered = await open(deck.id);
    await answer(["Errei", "Bom", "Fácil"], () => jest.setSystemTime(Date.now() + elapsed));
    expect(screen.getByText("Suas respostas")).toBeTruthy();
    expect(screen.getByText(text)).toBeTruthy();
    const counts = ["Errei", "Difícil", "Bom", "Fácil"].map((label) => {
      const value = screen.getByText(label).parent?.parent?.children.at(1);
      return typeof value === "object" && value !== null && "children" in value ? value.children.join("") : "";
    });
    expect(counts).toEqual(["1", "0", "1", "1"]);
    expect(screen.getAllByTestId(/^grade-segment-/)).toHaveLength(3);
    expect(screen.queryByTestId("grade-segment-1")).toBeNull();
    expect(screen.getByTestId("grade-segment-0")).toHaveStyle({
      backgroundColor: lightColors.grade.again.text,
    });
    await rendered.unmount();
  });

  it.each([
    [["Bom", "Bom", "Bom"], false, "Amanhã: 3 cartões para revisar"],
    [["Bom"], false, "Amanhã: 1 cartão para revisar"],
    [["Bom"], true, "Amanhã: nenhum cartão para revisar"],
  ])("SUM-06 tomorrow badge for %j (mature: %s)", async (grades, mature, text) => {
    const deck = seed(grades.length, mature);
    const rendered = await open(deck.id);
    await answer(grades);
    expect(await screen.findByText(text)).toBeTruthy();
    await rendered.unmount();
  });

  it("SUM-07 Concluir returns to the deck, or to the home", async () => {
    const deck = seed(1);
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}`);
    await act(async () => router.push(`/decks/${deck.id}/study`));
    await answer(["Bom"]);
    await fireEvent.press(screen.getByRole("button", { name: "Concluir" }));
    expect(rendered).toHavePathname(`/decks/${deck.id}`);
    await rendered.unmount();

    const home = await renderRouterWithProviders(routes, realm, "/");
    await act(async () => router.push("/study"));
    await screen.findByText("Nada para revisar hoje");
    await home.unmount();
  });

  it("ANS-07 the deck screen refreshes after the session", async () => {
    const deck = seed(2);
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}`);
    await fireEvent.press(await screen.findByRole("button", { name: "Estudar · 2 cartões" }));
    await answer(["Bom", "Bom"]);
    await fireEvent.press(screen.getByRole("button", { name: "Concluir" }));
    expect(await screen.findByRole("button", { name: "Estudar" })).toBeTruthy();
    expect(screen.queryByText("2 para hoje")).toBeNull();
    await rendered.unmount();
  });

  it("THM-01 uses the dark background", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");
    const deck = seed(1);
    const rendered = await open(deck.id);
    await answer(["Bom"]);
    const style = StyleSheet.flatten(screen.getByTestId("study-screen").props.style);
    expect(style.backgroundColor).toBe(darkColors.background);
    await rendered.unmount();
  });
});

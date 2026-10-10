import { act, fireEvent, screen } from "expo-router/testing-library";
import { BackHandler, StyleSheet, Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { createProfileRepository } from "@/features/profile/repository";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import StudyDeckRoute from "../../../app/decks/[deckId]/study";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = {
  index: () => <Text>Início-home</Text>,
  "decks/[deckId]/study": StudyDeckRoute,
};
const DAY = 24 * 60 * 60 * 1000;
const GOT_IT = "Entendi, vamos lá";

describe("StudyScreen first-session onboarding", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  function seed(count: number, tutorialSeen = false) {
    const profiles = createProfileRepository(realm);
    profiles.create("Ana");
    if (tutorialSeen) profiles.update({ studyTutorialSeen: true });
    const deck = createDeckRepository(realm).create({ name: "Inglês" });
    for (let i = 0; i < count; i++) {
      const card = createCardRepository(realm).create(deck.id, { front: `f${i}`, back: `v${i}` });
      realm.write(() => {
        realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(card.id))!.dueDate = new Date(
          Date.now() - DAY + i,
        );
      });
    }
    return deck;
  }
  const seen = () => createProfileRepository(realm).get()!.studyTutorialSeen;
  const open = (deckId: string) => renderRouterWithProviders(routes, realm, `/decks/${deckId}/study`);

  it("ONB-01 shows the sheet with every text over the first card", async () => {
    const deck = seed(1);
    const rendered = await open(deck.id);
    for (const text of [
      "SUA PRIMEIRA SESSÃO",
      "Como responder",
      "Depois de ver a resposta, diga como foi lembrar. O Memorizze usa isso para decidir quando o cartão volta.",
      "Errei",
      "Não lembrei. Volta em instantes.",
      "Difícil",
      "Lembrei com esforço. Volta logo.",
      "Bom",
      "Lembrei bem. Intervalo normal.",
      "Fácil",
      "Sabia na hora. Demora mais a voltar.",
      "Seja honesto: errar faz parte e ajuda a fixar.",
    ]) {
      expect(await screen.findByText(text)).toBeTruthy();
    }
    expect(screen.getByRole("button", { name: GOT_IT })).toBeTruthy();
    expect(screen.getByText("f0")).toBeTruthy();
    await rendered.unmount();
  });

  it("ONB-02 and ONB-08 the button closes the sheet, keeps the card and saves the flag", async () => {
    const deck = seed(1);
    const rendered = await open(deck.id);
    await fireEvent.press(await screen.findByRole("button", { name: GOT_IT }));
    expect(screen.queryByText("Como responder")).toBeNull();
    expect(screen.getByText("f0")).toBeTruthy();
    expect(seen()).toBe(true);
    await rendered.unmount();

    const again = await open(deck.id);
    await screen.findByText("FRENTE");
    expect(screen.queryByText("Como responder")).toBeNull();
    await again.unmount();
  });

  it("ONB-08 the backdrop and the Android back close the sheet and save the flag", async () => {
    const deck = seed(1);
    const rendered = await open(deck.id);
    await fireEvent.press(await screen.findByTestId("overlay-backdrop"));
    expect(screen.queryByText("Como responder")).toBeNull();
    expect(seen()).toBe(true);
    await rendered.unmount();

    realm.write(() => {
      realm.objects(Profile)[0].studyTutorialSeen = false;
    });
    const second = await open(deck.id);
    await act(async () => fireEvent(await screen.findByTestId("overlay-modal"), "requestClose"));
    expect(screen.queryByText("Como responder")).toBeNull();
    expect(seen()).toBe(true);
    await second.unmount();
  });

  it("ONB-03 no sheet when the flag is true, the queue is empty or the session ends", async () => {
    const deck = seed(1, true);
    const rendered = await open(deck.id);
    await fireEvent.press(await screen.findByRole("button", { name: "Mostrar resposta" }));
    await fireEvent.press(await screen.findByRole("button", { name: /^Bom, / }));
    expect(await screen.findByText("Sessão concluída")).toBeTruthy();
    expect(screen.queryByText("Como responder")).toBeNull();
    await rendered.unmount();

    realm.write(() => {
      realm.objects(Profile)[0].studyTutorialSeen = false;
    });
    const bare = createDeckRepository(realm).create({ name: "Vazio" });
    const empty = await open(bare.id);
    await screen.findByText("Nada para revisar hoje");
    expect(screen.queryByText("Como responder")).toBeNull();
    await empty.unmount();
  });

  it("ONB-05 the sheet closes even when saving the flag fails", async () => {
    const deck = seed(1);
    const rendered = await open(deck.id);
    const button = await screen.findByRole("button", { name: GOT_IT });
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("disk full");
    });
    await fireEvent.press(button);
    expect(screen.queryByText("Como responder")).toBeNull();
    expect(screen.getByText("f0")).toBeTruthy();
    jest.restoreAllMocks();
    expect(seen()).toBe(false);
    await rendered.unmount();
  });

  it("ONB-06 with the sheet open the back handler does not open the exit dialog", async () => {
    const add = jest.spyOn(BackHandler, "addEventListener").mockReturnValue({ remove: jest.fn() });
    const deck = seed(1);
    const rendered = await open(deck.id);
    await screen.findByText("Como responder");
    await act(async () => {
      add.mock.calls.forEach(([, handler]) => (handler as () => boolean)());
    });
    expect(screen.queryByText("Sair da sessão?")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: GOT_IT }));
    const handler = add.mock.calls[add.mock.calls.length - 1][1] as () => boolean;
    await act(async () => {
      handler();
    });
    expect(await screen.findByText("Sair da sessão?")).toBeTruthy();
    await rendered.unmount();
  });

  it("ONB-07 the button is accessible and the title is a header", async () => {
    const deck = seed(1);
    const rendered = await open(deck.id);
    const button = await screen.findByRole("button", { name: GOT_IT });
    expect(StyleSheet.flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(screen.getByRole("header", { name: "Como responder" })).toBeTruthy();
    await rendered.unmount();
  });
});

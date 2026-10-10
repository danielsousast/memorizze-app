import { act, fireEvent, screen, waitFor, within } from "expo-router/testing-library";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { cardStage, stageLabel } from "@/domain/stage";
import { useCards } from "@/features/cards";
import { createRandom } from "@/testing/random";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import { CardEditorScreen } from "./card-editor-screen";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

function NewCardRoute() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  return <CardEditorScreen deckId={deckId} />;
}

// Stub for the deck detail route, which T6 builds: shows the first (newest) row.
function DeckStub() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { data } = useCards(deckId);
  const first = data ? [...data].reverse()[0] : undefined;
  return (
    <>
      <Text>deck-stub</Text>
      {first ? <Text>{first.front}</Text> : null}
      {first ? <Text>{stageLabel[cardStage(first)]}</Text> : null}
    </>
  );
}

const routes = {
  "decks/[deckId]/index": DeckStub,
  "decks/[deckId]/cards/new": NewCardRoute,
};

describe("CardEditorScreen (create)", () => {
  let realm: Realm;
  let deckId: string;

  beforeEach(() => {
    realm = openTestRealm(models);
    const deck = realm.write(() =>
      realm.create(Deck, { name: "Inglês", createdAt: new Date(), cards: [] }),
    );
    deckId = deck._id.toHexString();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  const url = () => `/decks/${deckId}/cards/new`;
  const cardCount = () => realm.objects(Card).length;
  const fill = async (front: string, back: string) => {
    await fireEvent.changeText(screen.getByLabelText("Frente"), front);
    await fireEvent.changeText(screen.getByLabelText("Verso"), back);
  };
  const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));

  it("EDT-01 shows the create form", async () => {
    const rendered = await renderRouterWithProviders(routes, realm, url());
    expect(await screen.findByText("Novo cartão")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
    expect(screen.getByText("IN")).toBeTruthy();
    expect(screen.getByText("Inglês")).toBeTruthy();
    expect(screen.getByLabelText("Frente").props.multiline).toBe(true);
    expect(screen.getByLabelText("Verso").props.multiline).toBe(true);
    expect(screen.getByText("Pergunta ou termo")).toBeTruthy();
    expect(screen.getByText("Resposta")).toBeTruthy();
    expect(screen.getByText("Uma ideia por cartão deixa a revisão mais rápida.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Salvar e criar outro" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Excluir cartão" })).toBeNull();
    await rendered.unmount();
  });

  it("EDT-02 Salvar stores the card and returns to the deck with it on top as Novo", async () => {
    const rendered = await renderRouterWithProviders(routes, realm, url());
    await screen.findByText("Novo cartão");
    await fill("forget", "esquecer");
    await press("Salvar");
    await waitFor(() => expect(rendered).toHavePathname(`/decks/${deckId}`));
    expect(cardCount()).toBe(1);
    expect(realm.objects(Card)[0].front).toBe("forget");
    expect(await screen.findByText("forget")).toBeTruthy();
    expect(screen.getByText("Novo")).toBeTruthy();
    await rendered.unmount();
  });

  it("EDT-03 Salvar e criar outro keeps the Editor open with empty fields", async () => {
    const rendered = await renderRouterWithProviders(routes, realm, url());
    await screen.findByText("Novo cartão");
    await fill("a", "b");
    await press("Salvar e criar outro");
    await waitFor(() => expect(cardCount()).toBe(1));
    expect(rendered).toHavePathname(url());
    expect(screen.getByLabelText("Frente").props.value).toBe("");
    expect(screen.getByLabelText("Verso").props.value).toBe("");
    await rendered.unmount();
  });

  it("EDT-06 Cancelar writes nothing; line breaks in the back are stored as typed", async () => {
    const rendered = await renderRouterWithProviders(routes, realm, url());
    await screen.findByText("Novo cartão");
    await fill("x", "y");
    await press("Cancelar");
    await waitFor(() => expect(rendered).not.toHavePathname(url()));
    expect(cardCount()).toBe(0);
    await rendered.unmount();

    const again = await renderRouterWithProviders(routes, realm, url());
    await screen.findByText("Novo cartão");
    await fill("q", "a\nb");
    await press("Salvar");
    await waitFor(() => expect(cardCount()).toBe(1));
    expect(realm.objects(Card)[0].back).toBe("a\nb");
    await again.unmount();
  });

  it("EDT-07 shows the empty-field messages, keeps the text and stays", async () => {
    const rendered = await renderRouterWithProviders(routes, realm, url());
    await screen.findByText("Novo cartão");
    await fill("", "resposta");
    await press("Salvar");
    expect(await screen.findByText("Escreva a frente do cartão.")).toBeTruthy();
    expect(screen.getByLabelText("Verso").props.value).toBe("resposta");
    expect(rendered).toHavePathname(url());

    await fill("pergunta", "   ");
    await press("Salvar");
    expect(await screen.findByText("Escreva o verso do cartão.")).toBeTruthy();
    expect(screen.queryByText("Escreva a frente do cartão.")).toBeNull();
    expect(screen.getByLabelText("Frente").props.value).toBe("pergunta");
    expect(rendered).toHavePathname(url());
    expect(cardCount()).toBe(0);
    await rendered.unmount();
  });

  it("EDT-08 double press stores one card and both buttons are disabled while pending", async () => {
    const rendered = await renderRouterWithProviders(routes, realm, url());
    await screen.findByText("Novo cartão");
    await fill("a", "b");
    const save = screen.getByRole("button", { name: "Salvar" });
    // Hold the mutation in its pending state by deferring the cache invalidation.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    jest.spyOn(rendered.queryClient, "invalidateQueries").mockReturnValue(gate);
    await fireEvent.press(save);
    await waitFor(() => expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled());
    expect(screen.getByRole("button", { name: "Salvar e criar outro" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    release();
    await waitFor(() => expect(rendered).toHavePathname(`/decks/${deckId}`));
    expect(cardCount()).toBe(1);
    await rendered.unmount();
  });

  it("EDT-08 two presses in the same act store a single card", async () => {
    const rendered = await renderRouterWithProviders(routes, realm, url());
    await screen.findByText("Novo cartão");
    await fill("a", "b");
    const save = screen.getByRole("button", { name: "Salvar" });
    const { onClick: onPress } = save.props;
    await act(async () => {
      onPress();
      onPress();
    });
    await waitFor(() => expect(rendered).toHavePathname(`/decks/${deckId}`));
    expect(cardCount()).toBe(1);
    await rendered.unmount();
  });

  it("EDT-09 unknown deck shows Baralho não encontrado with Voltar", async () => {
    const rendered = await renderRouterWithProviders(
      routes,
      realm,
      "/decks/000000000000000000000000/cards/new",
    );
    expect(await screen.findByText("Baralho não encontrado")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
    await rendered.unmount();
  });

  it("ERR-01 a generic write failure shows the message and stays in the Editor", async () => {
    const rendered = await renderRouterWithProviders(routes, realm, url());
    await screen.findByText("Novo cartão");
    await fill("a", "b");
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("disk full");
    });
    await press("Salvar");
    expect(await screen.findByText("Não foi possível salvar. Tente de novo.")).toBeTruthy();
    expect(rendered).toHavePathname(url());
    expect(screen.getByLabelText("Frente").props.value).toBe("a");
    await rendered.unmount();
  });
});

function EditCardRoute() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  return <CardEditorScreen cardId={cardId} />;
}

// Stub for the deck detail route (T6 builds the real one): lists every card front.
function DeckListStub() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { data } = useCards(deckId);
  return (
    <>
      <Text>deck-stub</Text>
      {(data ?? []).map((c) => (
        <Text key={c.id}>{`row:${c.front}`}</Text>
      ))}
    </>
  );
}

const editRoutes = {
  "decks/[deckId]/index": DeckListStub,
  "cards/[cardId]/edit": EditCardRoute,
};

describe("CardEditorScreen (edit)", () => {
  let realm: Realm;
  let deckId: string;
  let cardId: string;
  const due = new Date(2026, 9, 20, 0, 0, 0, 0);

  beforeEach(() => {
    realm = openTestRealm(models);
    const deck = realm.write(() =>
      realm.create(Deck, { name: "Inglês", createdAt: new Date(), cards: [] }),
    );
    deckId = deck._id.toHexString();
    const card = realm.write(() => {
      const c = realm.create(Card, {
        front: "forget",
        back: "esquecer",
        easeFactor: 1.9,
        intervalDays: 6,
        repetitions: 3,
        lapses: 1,
        dueDate: due,
        createdAt: new Date(),
      });
      deck.cards.push(c);
      return c;
    });
    cardId = card._id.toHexString();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  const editUrl = () => `/cards/${cardId}/edit`;
  const stored = () => realm.objectForPrimaryKey(Card, new Realm.BSON.ObjectId(cardId));
  // Opens the deck first so the Editor is a real modal on top of it.
  const openEditor = async () => {
    const rendered = await renderRouterWithProviders(editRoutes, realm, `/decks/${deckId}`);
    await screen.findByText("deck-stub");
    await act(async () => {
      router.push(editUrl() as never);
    });
    await screen.findByText("Editar cartão");
    return rendered;
  };
  const fill = async (front: string, back: string) => {
    await fireEvent.changeText(screen.getByLabelText("Frente"), front);
    await fireEvent.changeText(screen.getByLabelText("Verso"), back);
  };
  const dialog = () => within(screen.getByTestId("overlay-modal"));
  const pressDialog = (name: string) => fireEvent.press(dialog().getByRole("button", { name }));
  const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));

  it("EDT-04 shows the prefilled edit form and Salvar updates the text and closes", async () => {
    const rendered = await openEditor();
    expect(rendered).toHavePathname(editUrl());
    expect(screen.getByLabelText("Frente").props.value).toBe("forget");
    expect(screen.getByLabelText("Verso").props.value).toBe("esquecer");
    expect(screen.getByRole("button", { name: "Excluir cartão" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Salvar e criar outro" })).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("Verso"), "esquecer de algo");
    await press("Salvar");
    await waitFor(() => expect(rendered).toHavePathname(`/decks/${deckId}`));
    expect(stored()?.back).toBe("esquecer de algo");
    expect(stored()?.front).toBe("forget");
    await rendered.unmount();
  });

  it("ALL-11 Excluir cartão asks for confirmation; Excluir removes the card and closes", async () => {
    const rendered = await openEditor();
    await press("Excluir cartão");
    expect(dialog().getByText("Excluir cartão?")).toBeTruthy();
    expect(dialog().getByText("Esta ação não pode ser desfeita.")).toBeTruthy();
    expect(dialog().getByRole("button", { name: "Cancelar" })).toBeTruthy();

    await pressDialog("Excluir");
    await waitFor(() => expect(rendered).toHavePathname(`/decks/${deckId}`));
    expect(stored()).toBeNull();
    await waitFor(() => expect(screen.queryByText("row:forget")).toBeNull());
    expect(screen.queryByText("Cartão não encontrado")).toBeNull();
    await rendered.unmount();
  });

  it("ALL-12 Cancelar in the confirmation leaves the card intact", async () => {
    const rendered = await openEditor();
    await press("Excluir cartão");
    await pressDialog("Cancelar");
    expect(screen.queryByText("Excluir cartão?")).toBeNull();
    expect(stored()).not.toBeNull();
    expect(rendered).toHavePathname(editUrl());
    await rendered.unmount();
  });

  it("EDT-05 no NotFound flash while a successful delete closes the Editor", async () => {
    const rendered = await openEditor();
    await press("Excluir cartão");
    // Keep the Editor mounted after the delete so any flash would be observable.
    jest.spyOn(router, "back").mockImplementation(() => {});
    await pressDialog("Excluir");
    await waitFor(() => expect(stored()).toBeNull());
    expect(screen.queryByText("Cartão não encontrado")).toBeNull();
    await rendered.unmount();
  });

  it("ALL-14 (EDT-08) Salvar and Excluir cartão are disabled while the delete is pending", async () => {
    const rendered = await openEditor();
    await press("Excluir cartão");
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    jest.spyOn(rendered.queryClient, "invalidateQueries").mockReturnValue(gate);
    await pressDialog("Excluir");
    await waitFor(() => expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled());
    expect(screen.getByRole("button", { name: "Excluir cartão" })).toBeDisabled();
    await act(async () => release());
    await waitFor(() => expect(rendered).toHavePathname(`/decks/${deckId}`));
    await rendered.unmount();
  });

  it("ERR-01 edit mode: a write failure on save shows the generic message and stays", async () => {
    const rendered = await openEditor();
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("disk full");
    });
    await fireEvent.changeText(screen.getByLabelText("Verso"), "outro");
    await press("Salvar");
    expect(await screen.findByText("Não foi possível salvar. Tente de novo.")).toBeTruthy();
    expect(rendered).toHavePathname(editUrl());
    expect(stored()?.back).toBe("esquecer");
    await rendered.unmount();
  });

  it("ALL-13 (ERR-01) edit mode: a write failure on delete shows the delete message and keeps the card", async () => {
    const rendered = await openEditor();
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("disk full");
    });
    await press("Excluir cartão");
    await pressDialog("Excluir");
    expect(await screen.findByText("Não foi possível excluir. Tente de novo.")).toBeTruthy();
    expect(screen.queryByText("Excluir cartão?")).toBeNull();
    expect(rendered).toHavePathname(editUrl());
    expect(stored()).not.toBeNull();
    await rendered.unmount();
  });

  it("EDT-09 unknown card shows Cartão não encontrado with Voltar", async () => {
    const rendered = await renderRouterWithProviders(
      editRoutes,
      realm,
      "/cards/000000000000000000000000/edit",
    );
    expect(await screen.findByText("Cartão não encontrado")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
    await rendered.unmount();
  });

  it("INV-01 20 random edits through the Editor never change the scheduling fields", async () => {
    const random = createRandom(20261009);
    const words = ["alfa", "beta", "gama", "olá\nmundo", "ção", "x", "  espaço  ", "z9"];
    const text = () =>
      Array.from({ length: 1 + Math.floor(random.next() * 4) }, () => random.pick(words)).join(" ");
    const scheduling = () => {
      const c = stored()!;
      return {
        easeFactor: c.easeFactor,
        intervalDays: c.intervalDays,
        repetitions: c.repetitions,
        lapses: c.lapses,
        dueDate: c.dueDate.getTime(),
      };
    };
    const expected = {
      easeFactor: 1.9,
      intervalDays: 6,
      repetitions: 3,
      lapses: 1,
      dueDate: due.getTime(),
    };
    expect(scheduling()).toEqual(expected);

    for (let i = 0; i < 20; i++) {
      const rendered = await openEditor();
      const front = `${text()}-${i}`;
      const back = `${text()}-${i}`;
      await fill(front, back);
      await press("Salvar");
      await waitFor(() => expect(rendered).toHavePathname(`/decks/${deckId}`));
      expect(stored()?.front).toBe(front.trim());
      expect(scheduling()).toEqual(expected);
      await rendered.unmount();
    }
  });
});

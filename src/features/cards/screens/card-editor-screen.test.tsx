import { act, fireEvent, screen, waitFor } from "expo-router/testing-library";
import { Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { cardStage, stageLabel } from "@/domain/stage";
import { useCards } from "@/features/cards";
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
    await act(async () => {
      fireEvent.press(save);
      fireEvent.press(save);
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

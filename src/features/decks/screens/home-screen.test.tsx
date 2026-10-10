import { act, fireEvent, screen, waitFor, within } from "expo-router/testing-library";
import { StyleSheet, Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { formatLongDate } from "@/domain/dates";
import { createCardRepository } from "@/features/cards/repository";
import { createDeckRepository } from "@/features/decks/repository";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";
import { darkColors } from "@/theme";

import IndexRoute from "../../../app/(tabs)/index";

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(),
  __esModule: true,
}));
jest.mock("../usecases/use-decks", () => {
  const actual = jest.requireActual("../usecases/use-decks");
  return { useDecks: jest.fn(actual.useDecks) };
});

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

const routes = {
  index: IndexRoute,
  "decks/new": () => <Text>Form</Text>,
  "decks/[deckId]/index": () => <Text>Detalhe</Text>,
  study: () => <Text>Sessão-geral</Text>,
};

const day = 24 * 60 * 60 * 1000;

describe("HomeScreen", () => {
  let realm: Realm;
  const scheme = () =>
    jest.requireMock("react-native/Libraries/Utilities/useColorScheme").default as jest.Mock;
  beforeEach(() => {
    scheme().mockReturnValue("light");
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  const decks = () => createDeckRepository(realm);
  const cards = () => createCardRepository(realm);
  /** Pushes every card of the deck into the future so it is not due today. */
  function postpone() {
    realm.write(() => {
      for (const card of realm.objects(Card)) card.dueDate = new Date(Date.now() + 5 * day);
    });
  }

  it("HOME-01 shows today's long date and the greeting", async () => {
    const rendered = await renderRouterWithProviders(routes, realm);
    expect(screen.getByText(formatLongDate(new Date()))).toBeTruthy();
    expect(screen.getByText("Olá")).toBeTruthy();
    await rendered.unmount();
  });

  it("HOME-02 lists decks in creation order with the section count", async () => {
    decks().create({ name: "Inglês" });
    decks().create({ name: "Física" });
    const rendered = await renderRouterWithProviders(routes, realm);
    expect(await screen.findByText("Seus baralhos")).toBeTruthy();
    expect(screen.getByText("2 baralhos")).toBeTruthy();
    const names = screen.getAllByText(/^(Inglês|Física)$/).map((n) => n.props.children);
    expect(names).toEqual(["Inglês", "Física"]);
    await rendered.unmount();
  });

  it("HOME-02 uses the singular for one deck", async () => {
    decks().create({ name: "Inglês" });
    const rendered = await renderRouterWithProviders(routes, realm);
    expect(await screen.findByText("1 baralho")).toBeTruthy();
    await rendered.unmount();
  });

  it("HOME-03 shows initials, one-line name and card count", async () => {
    const deck = decks().create({ name: "Inglês" });
    cards().create(deck.id, { front: "a", back: "b" });
    const rendered = await renderRouterWithProviders(routes, realm);
    expect(await screen.findByText("IN")).toBeTruthy();
    expect(screen.getByText("Inglês").props.numberOfLines).toBe(1);
    expect(
      within(screen.getByRole("button", { name: /^Inglês/ })).getByText("1 cartão"),
    ).toBeTruthy();
    await rendered.unmount();
  });

  it("HOME-04 shows the due badge, Em dia, or nothing", async () => {
    const english = decks().create({ name: "Inglês" });
    const physics = decks().create({ name: "Física" });
    decks().create({ name: "Vazio" });
    cards().create(english.id, { front: "a", back: "b" });
    cards().create(english.id, { front: "c", back: "d" });
    cards().create(physics.id, { front: "e", back: "f" });
    realm.write(() => {
      const future = realm.objects(Card).filtered("front == 'e'")[0];
      future.dueDate = new Date(Date.now() + 5 * day);
    });
    const rendered = await renderRouterWithProviders(routes, realm);
    expect(await screen.findByText("2 hoje")).toBeTruthy();
    expect(screen.getByText("Em dia")).toBeTruthy();
    expect(screen.queryAllByText(/hoje$|^Em dia$/)).toHaveLength(2);
    await rendered.unmount();
  });

  it("HOME-05 opens the deck on press", async () => {
    const deck = decks().create({ name: "Inglês" });
    const rendered = await renderRouterWithProviders(routes, realm);
    await fireEvent.press(await screen.findByRole("button", { name: /^Inglês/ }));
    await waitFor(() => expect(rendered).toHavePathname(`/decks/${deck.id}`));
    await rendered.unmount();
  });

  it("HOME-06 shows the empty state without a FAB and opens the create form", async () => {
    const rendered = await renderRouterWithProviders(routes, realm);
    expect(await screen.findByText("Nenhum baralho ainda")).toBeTruthy();
    expect(
      screen.getByText(
        "Crie seu primeiro baralho e adicione alguns cartões. Cinco minutos por dia já fazem diferença.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Criar baralho" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Criar primeiro baralho" }));
    await waitFor(() => expect(rendered).toHavePathname("/decks/new"));
    await rendered.unmount();
  });

  it("HOME-07 FAB opens the create form when decks exist", async () => {
    decks().create({ name: "Inglês" });
    const rendered = await renderRouterWithProviders(routes, realm);
    await fireEvent.press(await screen.findByRole("button", { name: "Criar baralho" }));
    await waitFor(() => expect(rendered).toHavePathname("/decks/new"));
    expect(screen.queryByText("Nenhum baralho ainda")).toBeNull();
    await rendered.unmount();
  });

  it("A11Y-02 reads each item as a single labelled element", async () => {
    const english = decks().create({ name: "Inglês" });
    cards().create(english.id, { front: "a", back: "b" });
    const rendered = await renderRouterWithProviders(routes, realm);
    expect(await screen.findByLabelText("Inglês, 1 cartão, 1 para hoje")).toBeTruthy();
    await act(async () => postpone());
    await rendered.queryClient.invalidateQueries();
    expect(await screen.findByLabelText("Inglês, 1 cartão, em dia")).toBeTruthy();
    await rendered.unmount();
  });

  it("THM-01 paints the dark background in dark mode", async () => {
    scheme().mockReturnValue("dark");
    const rendered = await renderRouterWithProviders(routes, realm);
    await screen.findByText("Nenhum baralho ainda");
    const root = screen.getByTestId("home-screen");
    expect(StyleSheet.flatten(root.props.style).backgroundColor).toBe(darkColors.background);
    await rendered.unmount();
  });

  it("LOAD-01 does not flash the empty state while decks load", async () => {
    const { useDecks } = jest.requireMock("../usecases/use-decks") as {
      useDecks: jest.Mock;
    };
    const real = useDecks.getMockImplementation();
    useDecks.mockImplementation(() => ({ isPending: true, data: undefined }));
    const rendered = await renderRouterWithProviders(routes, realm);
    expect(screen.getByText("Olá")).toBeTruthy();
    expect(screen.queryByText("Nenhum baralho ainda")).toBeNull();
    useDecks.mockImplementation(real);
    await rendered.unmount();
  });

  it("ENT-02 shows Estudar tudo with the summed due count", async () => {
    const a = decks().create({ name: "A" });
    const b = decks().create({ name: "B" });
    cards().create(a.id, { front: "1", back: "1" });
    cards().create(a.id, { front: "2", back: "2" });
    for (const n of ["3", "4", "5"]) cards().create(b.id, { front: n, back: n });
    const rendered = await renderRouterWithProviders(routes, realm);
    expect(await screen.findByRole("button", { name: "Estudar tudo" })).toBeTruthy();
    expect(within(screen.getByTestId("study-all")).getByText("5 cartões")).toBeTruthy();
    await rendered.unmount();
  });

  it("ENT-02 singular badge for one due card", async () => {
    const a = decks().create({ name: "A" });
    cards().create(a.id, { front: "1", back: "1" });
    const rendered = await renderRouterWithProviders(routes, realm);
    await screen.findByRole("button", { name: "Estudar tudo" });
    expect(within(screen.getByTestId("study-all")).getByText("1 cartão")).toBeTruthy();
    await rendered.unmount();
  });

  it("ENT-02 no badge when nothing is due", async () => {
    const a = decks().create({ name: "A" });
    cards().create(a.id, { front: "1", back: "1" });
    postpone();
    const rendered = await renderRouterWithProviders(routes, realm);
    await screen.findByRole("button", { name: "Estudar tudo" });
    expect(within(screen.getByTestId("study-all")).queryByText(/cartão|cartões/)).toBeNull();
    await rendered.unmount();
  });

  it("ENT-02 no button without decks", async () => {
    const rendered = await renderRouterWithProviders(routes, realm);
    await screen.findByText("Nenhum baralho ainda");
    expect(screen.queryByRole("button", { name: "Estudar tudo" })).toBeNull();
    await rendered.unmount();
  });

  it("ENT-03 tapping Estudar tudo opens /study", async () => {
    decks().create({ name: "A" });
    const rendered = await renderRouterWithProviders(routes, realm);
    await fireEvent.press(await screen.findByRole("button", { name: "Estudar tudo" }));
    expect(rendered).toHavePathname("/study");
    await rendered.unmount();
  });
});

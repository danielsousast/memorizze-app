import { act, fireEvent, screen, waitFor } from "expo-router/testing-library";
import { router } from "expo-router";
import { Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { createDeckRepository } from "@/features/decks/repository";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import EditDeckRoute from "../../../app/decks/[deckId]/edit";
import NewDeckRoute from "../../../app/decks/new";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

const routes = {
  index: () => <Text>Início</Text>,
  "decks/new": NewDeckRoute,
  "decks/[deckId]/index": () => <Text>Detalhe</Text>,
  "decks/[deckId]/edit": EditDeckRoute,
};

describe("DeckFormScreen", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  async function openNew() {
    const rendered = await renderRouterWithProviders(routes, realm, "/");
    await act(async () => router.push("/decks/new"));
    await screen.findByText("Novo baralho");
    return rendered;
  }

  async function openEdit(id: string) {
    const rendered = await renderRouterWithProviders(routes, realm, "/");
    await act(async () => router.push(`/decks/${id}/edit`));
    return rendered;
  }

  const names = () => realm.objects(Deck).map((d) => d.name);

  it("DFM-01 shows the create form", async () => {
    const rendered = await openNew();
    expect(screen.getByLabelText("Nome")).toBeTruthy();
    expect(screen.getByLabelText("Descrição")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeTruthy();
    expect(rendered).toHavePathname("/decks/new");
    await rendered.unmount();
  });

  it("DFM-02 saves a trimmed name, opens the new deck and back returns home", async () => {
    const rendered = await openNew();
    await fireEvent.changeText(screen.getByLabelText("Nome"), " Inglês ");
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(names()).toEqual(["Inglês"]));
    const id = realm.objects(Deck)[0]._id.toHexString();
    await waitFor(() => expect(rendered).toHavePathname(`/decks/${id}`));
    expect(await screen.findByText("Detalhe")).toBeTruthy();
    await act(async () => router.back());
    expect(rendered).toHavePathname("/");
    await rendered.unmount();
  });

  it("DFM-03 edits name and clears description, returning to the deck", async () => {
    const deck = createDeckRepository(realm).create({ name: "Inglês", description: "Vocabulário" });
    const rendered = await renderRouterWithProviders(routes, realm, `/decks/${deck.id}`);
    await act(async () => router.push(`/decks/${deck.id}/edit`));
    expect(await screen.findByText("Editar baralho")).toBeTruthy();
    expect(screen.getByDisplayValue("Inglês")).toBeTruthy();
    expect(screen.getByDisplayValue("Vocabulário")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Nome"), "English");
    await fireEvent.changeText(screen.getByLabelText("Descrição"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(rendered).toHavePathname(`/decks/${deck.id}`));
    const saved = realm.objects(Deck)[0];
    expect(saved.name).toBe("English");
    expect(saved.description ?? undefined).toBeUndefined();
    await rendered.unmount();
  });

  it("DFM-04 Cancelar closes without saving", async () => {
    const rendered = await openNew();
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Rascunho");
    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(rendered).toHavePathname("/"));
    expect(realm.objects(Deck)).toHaveLength(0);
    await rendered.unmount();
  });

  it("DFM-05 shows field errors by code and keeps the typed text", async () => {
    createDeckRepository(realm).create({ name: "Inglês" });
    const rendered = await openNew();
    await fireEvent.changeText(screen.getByLabelText("Nome"), "  ");
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Dê um nome ao baralho.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Descrição"), "texto");
    await fireEvent.changeText(screen.getByLabelText("Nome"), "inglês");
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Já existe um baralho com esse nome.")).toBeTruthy();
    expect(screen.getByDisplayValue("inglês")).toBeTruthy();
    expect(screen.getByDisplayValue("texto")).toBeTruthy();
    expect(rendered).toHavePathname("/decks/new");
    expect(realm.objects(Deck)).toHaveLength(1);
    await rendered.unmount();
  });

  it("DFM-06 two presses in one act save a single deck", async () => {
    const rendered = await openNew();
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Física");
    const { onClick: onPress } = screen.getByRole("button", { name: "Salvar" }).props;
    const write = jest.spyOn(realm, "write");
    await act(async () => {
      onPress();
      onPress();
    });
    await waitFor(() => expect(rendered).not.toHavePathname("/decks/new"));
    expect(realm.objects(Deck)).toHaveLength(1);
    expect(write).toHaveBeenCalledTimes(1);
    // The duplicate-name rule would reject a second attempt before it writes, so
    // count the mutations themselves: the busy guard must stop the second one.
    expect(rendered.queryClient.getMutationCache().getAll()).toHaveLength(1);
    expect(screen.queryByText("Já existe um baralho com esse nome.")).toBeNull();
    await rendered.unmount();
  });

  it("DFM-06 disables Salvar while the write is pending", async () => {
    const rendered = await openNew();
    // The mutation stays pending until onSuccess's invalidation settles; hold it open.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    jest.spyOn(rendered.queryClient, "invalidateQueries").mockReturnValue(gate);
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Física");
    const { onClick } = screen.getByRole("button", { name: "Salvar" }).props;
    await act(async () => {
      onClick();
    });
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(realm.objects(Deck)).toHaveLength(1);
    await act(async () => release());
    await waitFor(() => expect(rendered).not.toHavePathname("/decks/new"));
    await rendered.unmount();
  });

  it("DFM-07 shows not found for a missing deck", async () => {
    const rendered = await openEdit("64b7f0f0f0f0f0f0f0f0f0f0");
    expect(await screen.findByText("Baralho não encontrado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    await waitFor(() => expect(rendered).toHavePathname("/"));
    await rendered.unmount();
  });

  it("ERR-01 shows a generic error and stays on the form", async () => {
    const rendered = await openNew();
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("boom");
    });
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Física");
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Não foi possível salvar. Tente de novo.")).toBeTruthy();
    expect(rendered).toHavePathname("/decks/new");
    await rendered.unmount();
  });
});

import { act, fireEvent, screen, waitFor } from "expo-router/testing-library";
import { StyleSheet } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import WelcomeRoute from "../../../app/welcome";

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = { welcome: WelcomeRoute };

describe("WelcomeScreen", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  const open = () => renderRouterWithProviders(routes, realm, "/welcome");
  const profiles = () => realm.objects(Profile);

  it("WEL-01 shows brand, copy, badges, field and button; illustration is hidden", async () => {
    const rendered = await open();
    expect(screen.getByText("Memorizze")).toBeTruthy();
    expect(screen.getByText("Lembre mais, estudando menos.")).toBeTruthy();
    expect(
      screen.getByText("Flashcards com repetição espaçada. Poucos minutos por dia, no seu ritmo."),
    ).toBeTruthy();
    expect(screen.getByText("100% offline")).toBeTruthy();
    expect(screen.getByText("Sem login")).toBeTruthy();
    expect(screen.getByText("Dados só no aparelho")).toBeTruthy();
    expect(screen.getByLabelText("Como podemos te chamar?")).toBeTruthy();
    expect(screen.getByPlaceholderText("Seu nome ou apelido")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Começar" })).toBeTruthy();
    const art = screen.getByTestId("welcome-illustration", { includeHiddenElements: true });
    expect(art.props.accessibilityElementsHidden).toBe(true);
    expect(screen.queryByTestId("welcome-illustration")).toBeNull();
    await rendered.unmount();
  });

  it("WEL-03 blank name shows an error and creates no profile", async () => {
    const rendered = await open();
    await fireEvent.changeText(screen.getByLabelText("Como podemos te chamar?"), "   ");
    await fireEvent.press(screen.getByRole("button", { name: "Começar" }));
    expect(await screen.findByText("Digite seu nome.")).toBeTruthy();
    expect(profiles()).toHaveLength(0);
    await rendered.unmount();
  });

  it("WEL-04 the field accepts at most 30 characters", async () => {
    const rendered = await open();
    expect(screen.getByLabelText("Como podemos te chamar?").props.maxLength).toBe(30);
    await rendered.unmount();
  });

  it("WEL-02 creates the profile with the trimmed name", async () => {
    const rendered = await open();
    await fireEvent.changeText(screen.getByLabelText("Como podemos te chamar?"), "  Marina ");
    await fireEvent.press(screen.getByRole("button", { name: "Começar" }));
    await waitFor(() => expect(profiles()).toHaveLength(1));
    expect(profiles()[0].name).toBe("Marina");
    await rendered.unmount();
  });

  it("WEL-06 two presses in one act create a single profile", async () => {
    const rendered = await open();
    await fireEvent.changeText(screen.getByLabelText("Como podemos te chamar?"), "Marina");
    const { onClick: onPress } = screen.getByRole("button", { name: "Começar" }).props;
    await act(async () => {
      onPress();
      onPress();
    });
    await waitFor(() => expect(profiles()).toHaveLength(1));
    expect(rendered.queryClient.getMutationCache().getAll()).toHaveLength(1);
    await rendered.unmount();
  });

  it("ERR-01 shows a generic error, creates nothing and stays on the screen", async () => {
    const rendered = await open();
    jest.spyOn(realm, "write").mockImplementation(() => {
      throw new Error("boom");
    });
    await fireEvent.changeText(screen.getByLabelText("Como podemos te chamar?"), "Marina");
    await fireEvent.press(screen.getByRole("button", { name: "Começar" }));
    expect(await screen.findByText("Não foi possível salvar. Tente de novo.")).toBeTruthy();
    expect(profiles()).toHaveLength(0);
    expect(rendered).toHavePathname("/welcome");
    await rendered.unmount();
  });

  it("A11Y-01 Começar is a labelled button with a touch target of at least 44", async () => {
    const rendered = await open();
    const button = screen.getByRole("button", { name: "Começar" });
    expect(StyleSheet.flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(44);
    await rendered.unmount();
  });
});

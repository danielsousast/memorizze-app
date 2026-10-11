import { act, fireEvent, screen, waitFor } from "expo-router/testing-library";
import { StyleSheet } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import { buildBackup } from "@/domain/backup";
import { pickBackupText } from "@/features/backup/files";
import { RootStack } from "@/navigation/root-stack";

import WelcomeRoute from "../../../app/welcome";

jest.mock("@/features/backup/files");

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

  it("WEL-01 shows brand, copy, field and button; illustration is hidden", async () => {
    const rendered = await open();
    expect(screen.getByText("Memorizze")).toBeTruthy();
    expect(screen.getByText("Lembre mais, estudando menos.")).toBeTruthy();
    expect(
      screen.getByText("Flashcards com repetição espaçada. Poucos minutos por dia, no seu ritmo."),
    ).toBeTruthy();
    expect(screen.queryByText("100% offline")).toBeNull();
    expect(screen.queryByText("Sem login")).toBeNull();
    expect(screen.queryByText("Dados só no aparelho")).toBeNull();
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

  describe("import from a backup", () => {
    const ID = (n: number) => n.toString(16).padStart(24, "0");
    const fileText = () =>
      JSON.stringify(
        buildBackup(
          {
            profile: {
              id: ID(1),
              name: "Bia",
              dailyGoal: 12,
              createdAt: "2026-01-01T00:00:00.000Z",
              studyTutorialSeen: true,
              themePreference: "system",
              newCardsPerDay: 10,
            },
            decks: [{ id: ID(2), name: "A", description: null, createdAt: "2026-01-02T00:00:00.000Z" }],
            cards: [],
            reviewLogs: [],
          },
          new Date(2026, 9, 10),
        ),
      );
    const pickMock = jest.mocked(pickBackupText);
    const openEntry = () =>
      renderRouterWithProviders({ ...routes, index: () => null }, realm, "/welcome", {
        navigator: RootStack,
      });

    beforeEach(() => {
      pickMock.mockReset().mockResolvedValue(null);
    });

    it("BKP-15 shows the link, and a valid file opens the confirmation", async () => {
      pickMock.mockResolvedValue(fileText());
      const rendered = await open();
      await fireEvent.press(screen.getByRole("button", { name: "Já tenho um backup" }));

      expect(pickMock).toHaveBeenCalledTimes(1);
      expect(
        await screen.findByText("Substituir 1 baralho, 0 cartões e 0 revisões pelos do arquivo?"),
      ).toBeTruthy();
      expect(profiles()).toHaveLength(0);
      await rendered.unmount();
    });

    it("BKP-26 confirming with no profile creates the file's profile and goes to Início", async () => {
      pickMock.mockResolvedValue(fileText());
      const rendered = await openEntry();
      await fireEvent.press(await screen.findByRole("button", { name: "Já tenho um backup" }));
      await fireEvent.press(await screen.findByRole("button", { name: "Substituir" }));

      await waitFor(() => expect(rendered).toHavePathname("/"));
      expect(profiles()).toHaveLength(1);
      expect(profiles()[0].name).toBe("Bia");
      expect(realm.objects(Deck)).toHaveLength(1);
      await rendered.unmount();
    });

    it("BKP-14 cancelling the dialog stays on the welcome screen", async () => {
      pickMock.mockResolvedValue(fileText());
      const rendered = await openEntry();
      await fireEvent.press(await screen.findByRole("button", { name: "Já tenho um backup" }));
      await fireEvent.press(await screen.findByRole("button", { name: "Cancelar" }));

      expect(rendered).toHavePathname("/welcome");
      expect(profiles()).toHaveLength(0);
      await rendered.unmount();
    });
  });
});

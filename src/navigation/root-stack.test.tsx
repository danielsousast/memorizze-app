import { router } from "expo-router";
import { act, fireEvent, screen, waitFor } from "expo-router/testing-library";
import { useQueryClient } from "@tanstack/react-query";
import { Appearance, Text } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import HomeRoute from "../app/(tabs)/index";
import TabsLayout from "../app/(tabs)/_layout";
import ProfileRoute from "../app/(tabs)/profile";
import SettingsRoute from "../app/settings";
import WelcomeRoute from "../app/welcome";
import { deleteBackupFile, shareBackupFile, writeBackupFile } from "../features/backup/files";
import { RootStack } from "./root-stack";

jest.mock("../features/backup/files");

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];

function stub(label: string) {
  const Stub = () => <Text>{label}</Text>;
  Stub.displayName = `Stub(${label})`;
  return Stub;
}

function PendingProfileStack() {
  const client = useQueryClient();
  client.setQueryDefaults(["profile"], { queryFn: () => new Promise(() => {}) });
  return <RootStack />;
}
const routes = {
  "(tabs)/_layout": TabsLayout,
  "(tabs)/index": HomeRoute,
  "(tabs)/profile": ProfileRoute,
  welcome: WelcomeRoute,
  "decks/new": stub("Novo"),
  "decks/[deckId]/edit": stub("Editar"),
  "decks/[deckId]/cards/new": stub("Novo cartão"),
  "cards/[cardId]/edit": stub("Editar cartão"),
  "edit-name": stub("Editar nome"),
  settings: SettingsRoute,
  study: stub("Estudo"),
  "decks/[deckId]/index": stub("Baralho"),
  "decks/[deckId]/study": stub("Estudo do baralho"),
};

describe("RootStack", () => {
  let realm: Realm;
  beforeEach(() => {
    realm = openTestRealm(models);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    realm.close();
  });

  const open = (url = "/") =>
    renderRouterWithProviders(routes, realm, url, { navigator: RootStack });
  const addProfile = () =>
    realm.write(() => {
      realm.create(Profile, { name: "Ana", dailyGoal: 20, createdAt: new Date() });
    });

  it("ENT-01 opens the welcome screen without a profile", async () => {
    const rendered = await open();
    expect(await screen.findByText("Começar")).toBeTruthy();
    expect(rendered).toHavePathname("/welcome");
    await rendered.unmount();
  });

  it("ENT-02 opens the home screen with a profile", async () => {
    addProfile();
    const rendered = await open();
    expect(await screen.findByTestId("home-screen")).toBeTruthy();
    expect(rendered).toHavePathname("/");
    expect(screen.queryByText("Começar")).toBeNull();
    await rendered.unmount();
  });

  it("ENT-03 shows neither screen while the profile is pending", async () => {
    // The profile query never resolves, so the read stays pending.
    const pending = await renderRouterWithProviders(routes, realm, "/", {
      navigator: PendingProfileStack,
    });
    expect(screen.queryByText("Começar")).toBeNull();
    expect(screen.queryByTestId("home-screen")).toBeNull();
    await pending.unmount();
  });

  it("WEL-02 creating the profile replaces welcome with home; back does not reopen it", async () => {
    const rendered = await open();
    await fireEvent.changeText(await screen.findByLabelText("Como podemos te chamar?"), "Ana");
    await fireEvent.press(screen.getByRole("button", { name: "Começar" }));
    expect(await screen.findByTestId("home-screen")).toBeTruthy();
    expect(rendered).toHavePathname("/");
    expect(realm.objects(Profile)).toHaveLength(1);
    expect(router.canGoBack()).toBe(false);
    expect(screen.queryByText("Começar")).toBeNull();
    expect(screen.getByTestId("home-screen")).toBeTruthy();
    await rendered.unmount();
  });

  it("WEL-05 with a profile, pushing /welcome does not show the welcome screen", async () => {
    addProfile();
    const rendered = await open();
    await screen.findByTestId("home-screen");
    await act(async () => {
      try {
        router.push("/welcome");
      } catch {
        // an unmatched protected route may throw; either way it must not render
      }
    });
    await waitFor(() => expect(screen.queryByText("Começar")).toBeNull());
    await rendered.unmount();
  });

  it.each([
    ["/study", "Estudo"],
    ["/decks/abc", "Baralho"],
    ["/decks/abc/study", "Estudo do baralho"],
  ])("without a profile, a deep link to %s opens the welcome screen instead", async (url, label) => {
    const rendered = await open(url);
    expect(await screen.findByText("Começar")).toBeTruthy();
    expect(screen.queryByText(label)).toBeNull();
    await rendered.unmount();
  });

  it.each([
    ["/study", "Estudo"],
    ["/decks/abc", "Baralho"],
    ["/decks/abc/study", "Estudo do baralho"],
  ])("with a profile, %s still renders", async (url, label) => {
    addProfile();
    const rendered = await open(url);
    expect(await screen.findByText(label)).toBeTruthy();
    await rendered.unmount();
  });

  describe("settings", () => {
    it("SET-03 without a profile a deep link to /settings opens the welcome screen", async () => {
      const rendered = await open("/settings");
      expect(await screen.findByText("Começar")).toBeTruthy();
      expect(screen.queryByText("Ajustes")).toBeNull();
      await rendered.unmount();
    });

    it("SET-03 with a profile /settings renders", async () => {
      addProfile();
      const rendered = await open("/settings");
      expect(await screen.findByText("Ajustes")).toBeTruthy();
      await rendered.unmount();
    });

    it("THM-05 Sair returns the theme to the system and removes the preference", async () => {
      const spy = jest.spyOn(Appearance, "setColorScheme");
      realm.write(() => {
        realm.create(Profile, { name: "Ana", createdAt: new Date(), themePreference: "dark" });
      });
      const rendered = await open("/profile");
      await waitFor(() => expect(spy).toHaveBeenLastCalledWith("dark"));
      await fireEvent.press(await screen.findByRole("button", { name: "Sair" }));
      await fireEvent.press(await screen.findByRole("button", { name: "Apagar e sair" }));
      expect(await screen.findByText("Começar")).toBeTruthy();
      expect(spy).toHaveBeenLastCalledWith("unspecified");
      expect(realm.objects(Profile)).toHaveLength(0);
      await rendered.unmount();
    });
  });

  describe("theme", () => {
    it("THM-04 applies the saved theme on the first render with a profile", async () => {
      const spy = jest.spyOn(Appearance, "setColorScheme");
      realm.write(() => {
        realm.create(Profile, { name: "Ana", createdAt: new Date(), themePreference: "dark" });
      });
      const rendered = await open();
      await screen.findByTestId("home-screen");
      expect(spy).toHaveBeenCalledWith("dark");
      await rendered.unmount();
    });

    it("THM-03 Automático hands the theme back to the system", async () => {
      const spy = jest.spyOn(Appearance, "setColorScheme");
      addProfile();
      const rendered = await open();
      await screen.findByTestId("home-screen");
      expect(spy).toHaveBeenLastCalledWith("unspecified");
      expect(spy).not.toHaveBeenCalledWith("light");
      await rendered.unmount();
    });

    it("THM-05 without a profile the system theme is used", async () => {
      const spy = jest.spyOn(Appearance, "setColorScheme");
      const rendered = await open();
      await screen.findByText("Começar");
      expect(spy).toHaveBeenLastCalledWith("unspecified");
      await rendered.unmount();
    });
  });

  describe("sign out", () => {
    const signOutButton = () => screen.findByRole("button", { name: "Sair" });

    it("SOUT-01 SOUT-02 shows the confirmation with the real counts", async () => {
      addProfile();
      realm.write(() => {
        realm.create(Deck, { name: "D", createdAt: new Date() });
        realm.create(Card, { front: "f", back: "b", dueDate: new Date(), createdAt: new Date() });
      });
      const rendered = await open("/profile");
      await fireEvent.press(await signOutButton());
      expect(await screen.findByText("Sair e apagar dados?")).toBeTruthy();
      expect(screen.getByText(/seus 1 baralho, 1 cartão e todo o histórico/)).toBeTruthy();
      await rendered.unmount();
    });

    it("SOUT-05 cancel keeps the data", async () => {
      addProfile();
      const rendered = await open("/profile");
      await fireEvent.press(await signOutButton());
      await fireEvent.press(await screen.findByRole("button", { name: "Cancelar" }));
      expect(realm.objects(Profile).length).toBe(1);
      expect(rendered).toHavePathname("/profile");
      await rendered.unmount();
    });

    it("SOUT-03 confirming wipes everything and returns to the welcome screen", async () => {
      addProfile();
      realm.write(() => {
        realm.create(Deck, { name: "D", createdAt: new Date() });
      });
      const rendered = await open("/profile");
      await fireEvent.press(await signOutButton());
      await fireEvent.press(await screen.findByRole("button", { name: "Apagar e sair" }));
      expect(await screen.findByText("Começar")).toBeTruthy();
      expect(rendered).toHavePathname("/welcome");
      expect(realm.objects(Profile).length).toBe(0);
      expect(realm.objects(Deck).length).toBe(0);
      await rendered.unmount();
    });

    it("SOUT-04 a failed wipe keeps the data and shows a toast", async () => {
      addProfile();
      jest.spyOn(realm, "deleteAll").mockImplementation(() => {
        throw new Error("boom");
      });
      const rendered = await open("/profile");
      await fireEvent.press(await signOutButton());
      await fireEvent.press(await screen.findByRole("button", { name: "Apagar e sair" }));
      expect(await screen.findByText("Não foi possível apagar os dados.")).toBeTruthy();
      expect(screen.queryByText("Sair e apagar dados?")).toBeNull();
      expect(realm.objects(Profile).length).toBe(1);
      expect(rendered).toHavePathname("/profile");
      await rendered.unmount();
    });

    describe("backup first", () => {
      const URI = "file:///cache/backups/memorizze.json";
      const backupRow = () => screen.findByRole("button", { name: "Fazer backup antes" });

      beforeEach(() => {
        jest.mocked(writeBackupFile).mockReturnValue(URI);
        jest.mocked(shareBackupFile).mockResolvedValue(undefined);
        jest.mocked(deleteBackupFile).mockReturnValue(undefined);
      });

      it("SOUT-06 shows the backup row", async () => {
        addProfile();
        const rendered = await open("/profile");
        await fireEvent.press(await signOutButton());
        expect(await backupRow()).toBeTruthy();
        await rendered.unmount();
      });

      it("SOUT-07 exports, records the date and reopens the dialog without deleting", async () => {
        addProfile();
        realm.write(() => {
          realm.create(Deck, { name: "D", createdAt: new Date() });
        });
        const rendered = await open("/profile");
        await fireEvent.press(await signOutButton());
        await fireEvent.press(await backupRow());
        await waitFor(() => expect(jest.mocked(shareBackupFile)).toHaveBeenCalledWith(URI));
        await waitFor(() => expect(realm.objects(Profile)[0].lastBackupAt).toBeTruthy());
        expect(await screen.findByText("Sair e apagar dados?")).toBeTruthy();
        expect(realm.objects(Profile)).toHaveLength(1);
        expect(realm.objects(Deck)).toHaveLength(1);
        await rendered.unmount();
      });

      it("SOUT-08 a failed export keeps the dialog closed, shows a toast and keeps the data", async () => {
        addProfile();
        jest.mocked(shareBackupFile).mockRejectedValue(new Error("boom"));
        const rendered = await open("/profile");
        await fireEvent.press(await signOutButton());
        await fireEvent.press(await backupRow());
        expect(await screen.findByText("Não foi possível exportar.")).toBeTruthy();
        expect(screen.queryByText("Sair e apagar dados?")).toBeNull();
        expect(realm.objects(Profile)[0].lastBackupAt).toBeNull();
        expect(realm.objects(Profile)).toHaveLength(1);
        await rendered.unmount();
      });
    });
  });
});

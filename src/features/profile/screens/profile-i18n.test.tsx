import { fireEvent, screen } from "expo-router/testing-library";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { replaceMessage, type BackupFile } from "@/domain/backup";
import { pickBackupText } from "@/features/backup/files";
import { i18n } from "@/lib/i18n";
import { resetFakeScheduler } from "@/testing/notifications";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import BackupRoute from "../../../app/backup";
import ProfileRoute from "../../../app/(tabs)/profile";
import SettingsRoute from "../../../app/settings";
import WelcomeRoute from "../../../app/welcome";

jest.mock("@/features/backup/files");
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.2.3" } },
}));
jest.mock("@/lib/notifications", () => jest.requireActual("@/testing/notifications").notificationsModuleMock);

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = {
  profile: ProfileRoute,
  settings: SettingsRoute,
  backup: BackupRoute,
  welcome: WelcomeRoute,
};
const pickMock = jest.mocked(pickBackupText);

describe("profile, settings, welcome and backup per locale (I18NS-04..06, I18NS-11)", () => {
  let realm: Realm;
  beforeEach(() => {
    resetFakeScheduler({ permission: "granted" });
    pickMock.mockReset().mockResolvedValue(null);
    realm = openTestRealm(models);
  });
  afterEach(() => {
    i18n.locale = "pt-BR";
    jest.restoreAllMocks();
    realm.close();
  });

  function seedProfile() {
    realm.write(() => {
      realm.create(Profile, { name: "Ana", createdAt: new Date(2026, 2, 15) });
    });
  }
  const open = (url: string) => renderRouterWithProviders(routes, realm, url);

  it.each([
    ["en", "Profile", "Settings", "Studying since March 2026", "Daily goal", "Sign out", "Your cards"],
    ["es", "Perfil", "Ajustes", "Estudiando desde marzo de 2026", "Meta diaria", "Salir", "Tus tarjetas"],
  ])("ProfileScreen in %s", async (locale, title, gear, since, goal, signOut, cards) => {
    i18n.locale = locale;
    seedProfile();
    const rendered = await open("/profile");
    expect(await screen.findByRole("header", { name: title })).toBeTruthy();
    expect(screen.getByRole("button", { name: gear })).toBeTruthy();
    expect(await screen.findByText(since)).toBeTruthy();
    expect(screen.getByText(goal)).toBeTruthy();
    expect(screen.getByRole("button", { name: signOut })).toBeTruthy();
    expect(await screen.findByText(cards)).toBeTruthy();
    await rendered.unmount();
  });

  it.each([
    ["en", "Settings", "Appearance", "Theme", "Daily reminder", "Backup and restore", "Memorizze 1.2.3"],
    ["es", "Ajustes", "Apariencia", "Tema", "Recordatorio diario", "Copia de seguridad y restauración", "Memorizze 1.2.3"],
  ])("SettingsScreen in %s", async (locale, title, appearance, theme, reminder, backup, version) => {
    i18n.locale = locale;
    seedProfile();
    const rendered = await open("/settings");
    expect(await screen.findByRole("header", { name: title })).toBeTruthy();
    expect(screen.getByText(appearance)).toBeTruthy();
    expect(screen.getAllByText(theme).length).toBeGreaterThan(0);
    expect(screen.getByText(reminder)).toBeTruthy();
    expect(screen.getByText(backup)).toBeTruthy();
    expect(screen.getByText(version)).toBeTruthy();
    await rendered.unmount();
  });

  it.each([
    ["en", "Remember more, study less.", "Get started", "I already have a backup", "Your name or nickname", "Next review in 4 days"],
    ["es", "Recuerda más, estudiando menos.", "Comenzar", "Ya tengo una copia de seguridad", "Tu nombre o apodo", "Próximo repaso en 4 días"],
  ])("WelcomeScreen in %s", async (locale, headline, start, haveBackup, placeholder, next) => {
    i18n.locale = locale;
    const rendered = await open("/welcome");
    expect(await screen.findByText(headline)).toBeTruthy();
    expect(screen.getByRole("button", { name: start })).toBeTruthy();
    expect(screen.getByRole("button", { name: haveBackup })).toBeTruthy();
    expect(screen.getByPlaceholderText(placeholder)).toBeTruthy();
    expect(screen.getByText(next, { includeHiddenElements: true })).toBeTruthy();
    await rendered.unmount();
  });

  it("BackupScreen in es", async () => {
    i18n.locale = "es";
    seedProfile();
    const rendered = await open("/backup");
    expect(await screen.findByRole("header", { name: "Copia de seguridad" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Exportar copia" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Importar copia" })).toBeTruthy();
    expect(screen.getByText("Aún no hay copias de seguridad")).toBeTruthy();
    expect(screen.getByText("mazos")).toBeTruthy();
    expect(screen.getByText("tarjetas")).toBeTruthy();
    expect(screen.getByText("repasos")).toBeTruthy();
    await rendered.unmount();
  });

  it("BackupScreen interpolates counts and the last-backup date in en (I18NS-05)", async () => {
    i18n.locale = "en";
    seedProfile();
    const today = new Date();
    const previous = new Date(2026, 9, 3, 9, 0);
    realm.write(() => {
      const profile = realm.objects(Profile)[0];
      profile.lastBackupAt = today;
      profile.previousBackupAt = previous;
      realm.create(Deck, { name: "Spanish", createdAt: new Date(), cards: [] });
      realm.create(Deck, { name: "French", createdAt: new Date(), cards: [] });
    });
    const rendered = await open("/backup");
    expect(await screen.findByRole("header", { name: "Backup" })).toBeTruthy();
    const hh = String(today.getHours()).padStart(2, "0");
    const mm = String(today.getMinutes()).padStart(2, "0");
    expect(await screen.findByText(`Backed up today, ${hh}:${mm}`)).toBeTruthy();
    expect(screen.getByText("Previous: October 3")).toBeTruthy();
    expect(screen.getByText("decks")).toBeTruthy();
    expect(screen.getByText("cards")).toBeTruthy();
    expect(screen.getByText("reviews")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export backup" })).toBeTruthy();
    expect(screen.getByText(/^Creates the file memorizze-\d{4}-\d{2}-\d{2}\.json$/)).toBeTruthy();
    await rendered.unmount();
  });

  it("I18NS-11 the invalid-file error follows the locale at the moment of use", async () => {
    seedProfile();
    pickMock.mockResolvedValue("not a backup");
    const rendered = await open("/backup");
    expect(await screen.findByRole("button", { name: "Importar backup" })).toBeTruthy();
    i18n.locale = "en";
    await fireEvent.press(screen.getByRole("button", { name: "Importar backup" }));
    expect(await screen.findByText("Invalid file. Choose a Memorizze backup.")).toBeTruthy();
    await rendered.unmount();
  });
});

describe("backup summary per locale (I18NS-06)", () => {
  afterEach(() => {
    i18n.locale = "pt-BR";
  });

  const file = (decks: number) =>
    ({
      decks: Array.from({ length: decks }, (_, i) => ({ id: String(i) })),
      cards: [{ id: "c" }],
      reviewLogs: [{ id: "r" }],
    }) as unknown as BackupFile;

  it.each([
    ["pt-BR", "Substituir 1 baralho, 1 cartão e 1 revisão pelos do arquivo?", "Substituir 2 baralhos, 1 cartão e 1 revisão pelos do arquivo?"],
    ["en", "Replace 1 deck, 1 card and 1 review with the ones in the file?", "Replace 2 decks, 1 card and 1 review with the ones in the file?"],
    ["es", "¿Reemplazar 1 mazo, 1 tarjeta y 1 repaso por los del archivo?", "¿Reemplazar 2 mazos, 1 tarjeta y 1 repaso por los del archivo?"],
  ])("%s with one and two decks", (locale, one, two) => {
    i18n.locale = locale;
    expect(replaceMessage(file(1))).toBe(one);
    expect(replaceMessage(file(2))).toBe(two);
  });
});

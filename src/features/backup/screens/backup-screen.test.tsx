import { act, fireEvent, screen, waitFor } from "expo-router/testing-library";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import BackupRoute from "../../../app/backup";
import SettingsRoute from "../../../app/settings";
import { deleteBackupFile, shareBackupFile, writeBackupFile } from "../files";

jest.mock("../files");

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = { backup: BackupRoute, settings: SettingsRoute };
const NOW = new Date(2026, 9, 10, 16, 4);
const URI = "file:///cache/backups/memorizze-2026-10-10.json";

const writeMock = jest.mocked(writeBackupFile);
const shareMock = jest.mocked(shareBackupFile);
const deleteMock = jest.mocked(deleteBackupFile);

describe("BackupScreen", () => {
  let realm: Realm;

  beforeEach(() => {
    // Only Date is frozen; timers stay real so React Query and the toast keep working.
    jest.useFakeTimers({
      now: NOW,
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
        "performance",
      ],
    });
    writeMock.mockReset().mockReturnValue(URI);
    shareMock.mockReset().mockResolvedValue(undefined);
    deleteMock.mockReset();
    realm = openTestRealm(models);
    realm.write(() => {
      realm.create(Profile, { name: "Ana", createdAt: new Date(2026, 2, 15) });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    realm.close();
  });

  const open = (url = "/backup") => renderRouterWithProviders(routes, realm, url);
  const profile = () => realm.objects(Profile)[0];

  it("BKP-06 shows the title, the back link, the two actions and their hints", async () => {
    const rendered = await open();
    expect(await screen.findByRole("header", { name: "Backup" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ajustes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Exportar backup" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Importar backup" })).toBeTruthy();
    expect(screen.getByText("Gera o arquivo memorizze-2026-10-10.json")).toBeTruthy();
    expect(screen.getByText("Substitui os dados atuais pelos do arquivo.")).toBeTruthy();
    await rendered.unmount();
  });

  it("BKP-07 shows no backup yet, then today's backup with the previous one", async () => {
    let rendered = await open();
    expect(await screen.findByText("Nenhum backup ainda")).toBeTruthy();
    expect(screen.queryByText(/Anterior:/)).toBeNull();
    await rendered.unmount();

    realm.write(() => {
      profile().lastBackupAt = new Date(2026, 9, 10, 16, 4);
      profile().previousBackupAt = new Date(2026, 9, 2, 9, 0);
    });
    rendered = await open();
    expect(await screen.findByText("Backup feito hoje, 16:04")).toBeTruthy();
    expect(screen.getByText("Anterior: 2 de outubro")).toBeTruthy();
    await rendered.unmount();
  });

  it("BKP-08 shows the real counts with a thousands separator", async () => {
    realm.write(() => {
      const deck = realm.create(Deck, { name: "D", createdAt: new Date(), cards: [] });
      const card = realm.create(Card, { front: "f", back: "b", dueDate: new Date(), createdAt: new Date() });
      deck.cards.push(card);
      realm.create(Deck, { name: "E", createdAt: new Date(), cards: [] });
      for (let i = 0; i < 3418; i++) {
        realm.create(ReviewLog, { cardId: card._id, deckId: deck._id, grade: 2, reviewedAt: new Date() });
      }
    });
    const rendered = await open();
    expect(await screen.findByText("3.418")).toBeTruthy();
    expect(screen.getByText("revisões")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    await rendered.unmount();
  });

  it("BKP-01 BKP-04 exports, shares the file, stamps the dates and offers to share again", async () => {
    const previous = new Date(2026, 9, 2, 9, 0);
    realm.write(() => {
      profile().lastBackupAt = previous;
    });
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Exportar backup" }));

    await waitFor(() => expect(screen.getByText("Backup exportado")).toBeTruthy());
    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(writeMock.mock.calls[0][0]).toBe("memorizze-2026-10-10.json");
    expect(JSON.parse(writeMock.mock.calls[0][1]).profile.name).toBe("Ana");
    expect(shareMock).toHaveBeenCalledWith(URI);
    expect(profile().lastBackupAt).toEqual(NOW);
    expect(profile().previousBackupAt).toEqual(previous);
    expect(await screen.findByText("Backup feito hoje, 16:04")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Compartilhar" }));
    expect(shareMock).toHaveBeenCalledTimes(2);
    expect(shareMock).toHaveBeenLastCalledWith(URI);
    await rendered.unmount();
  });

  it("BKP-23 exports a database without decks", async () => {
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Exportar backup" }));
    await waitFor(() => expect(screen.getByText("Backup exportado")).toBeTruthy());
    const file = JSON.parse(writeMock.mock.calls[0][1]);
    expect(file.decks).toEqual([]);
    expect(file.cards).toEqual([]);
    await rendered.unmount();
  });

  it("BKP-21 a failed share shows the error, keeps the dates and deletes the temp file", async () => {
    shareMock.mockRejectedValue(new Error("sheet unavailable"));
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Exportar backup" }));

    expect(await screen.findByText("Não foi possível exportar.")).toBeTruthy();
    expect(profile().lastBackupAt).toBeNull();
    expect(deleteMock).toHaveBeenCalledWith(URI);
    await rendered.unmount();
  });

  it("BKP-21 a failed write shows the error and does not touch the dates", async () => {
    writeMock.mockImplementation(() => {
      throw new Error("disk full");
    });
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Exportar backup" }));

    expect(await screen.findByText("Não foi possível exportar.")).toBeTruthy();
    expect(profile().lastBackupAt).toBeNull();
    expect(shareMock).not.toHaveBeenCalled();
    await rendered.unmount();
  });

  it("BKP-22 both buttons are disabled while exporting", async () => {
    let finish: () => void = () => undefined;
    shareMock.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const rendered = await open();
    await fireEvent.press(await screen.findByRole("button", { name: "Exportar backup" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Exportar backup", disabled: true })).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: "Importar backup", disabled: true })).toBeTruthy();

    await act(async () => finish());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Exportar backup", disabled: false })).toBeTruthy(),
    );
    await rendered.unmount();
  });

  it("BKP-09 Ajustes shows the last backup and opens the screen", async () => {
    realm.write(() => {
      profile().lastBackupAt = new Date(2026, 9, 2, 9, 0);
    });
    const rendered = await open("/settings");
    const row = await screen.findByRole("button", { name: "Backup e restauração" });
    expect(row).toBeTruthy();
    expect(await screen.findByText("Último backup: 2 de outubro")).toBeTruthy();

    await fireEvent.press(row);
    await waitFor(() => expect(rendered).toHavePathname("/backup"));
    await rendered.unmount();
  });

  it("BKP-09 Ajustes says there is no backup yet", async () => {
    const rendered = await open("/settings");
    expect(await screen.findByText("Nenhum backup ainda")).toBeTruthy();
    await rendered.unmount();
  });
});

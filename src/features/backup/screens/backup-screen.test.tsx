import { act, fireEvent, screen, waitFor } from "expo-router/testing-library";
import { Appearance } from "react-native";
import Realm from "realm";

import { Card, Deck, Profile, ReviewLog } from "@/db";
import { openTestRealm } from "@/testing/realm";
import { renderRouterWithProviders } from "@/testing/router";

import BackupRoute from "../../../app/backup";
import SettingsRoute from "../../../app/settings";
import { RootStack } from "@/navigation/root-stack";
import { buildBackup, type BackupFile } from "@/domain/backup";

import { deleteBackupFile, pickBackupText, shareBackupFile, writeBackupFile } from "../files";

jest.mock("../files");

const models = [Profile, Deck, Card, ReviewLog] as unknown as Realm.ObjectClass[];
const routes = { backup: BackupRoute, settings: SettingsRoute };
const NOW = new Date(2026, 9, 10, 16, 4);
const URI = "file:///cache/backups/memorizze-2026-10-10.json";

const writeMock = jest.mocked(writeBackupFile);
const shareMock = jest.mocked(shareBackupFile);
const deleteMock = jest.mocked(deleteBackupFile);
const pickMock = jest.mocked(pickBackupText);

const ID = (n: number) => n.toString(16).padStart(24, "0");

function backupFile(overrides: Partial<BackupFile> = {}): BackupFile {
  const base = buildBackup(
    {
      profile: {
        id: ID(1),
        name: "Bia",
        dailyGoal: 12,
        createdAt: "2026-01-01T00:00:00.000Z",
        studyTutorialSeen: true,
        themePreference: "dark",
        newCardsPerDay: 5,
      },
      decks: [
        { id: ID(2), name: "A", description: null, createdAt: "2026-01-02T00:00:00.000Z" },
        { id: ID(3), name: "B", description: "desc", createdAt: "2026-01-03T00:00:00.000Z" },
      ],
      cards: [
        { id: ID(4), deckId: ID(2), front: "f", back: "b", easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0, dueDate: "2026-01-04T00:00:00.000Z", createdAt: "2026-01-04T00:00:00.000Z" },
      ],
      reviewLogs: [
        { id: ID(5), cardId: ID(4), deckId: ID(2), grade: 2, reviewedAt: "2026-01-05T00:00:00.000Z" },
      ],
    },
    NOW,
  );
  return { ...base, ...overrides };
}

const fileText = (overrides?: Partial<BackupFile>) => JSON.stringify(backupFile(overrides));

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
    pickMock.mockReset().mockResolvedValue(null);
    realm = openTestRealm(models);
    realm.write(() => {
      realm.create(Profile, { name: "Ana", createdAt: new Date(2026, 2, 15) });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  describe("import", () => {
    const REPLACE = "Substituir 2 baralhos, 1 cartão e 1 revisão pelos do arquivo?";
    const decksNow = () => realm.objects(Deck).map((deck) => deck.name);

    async function pickAndConfirm() {
      await fireEvent.press(await screen.findByRole("button", { name: "Importar backup" }));
      await screen.findByText(REPLACE);
    }

    it("BKP-10 opens the picker", async () => {
      const rendered = await open();
      await fireEvent.press(await screen.findByRole("button", { name: "Importar backup" }));
      await waitFor(() => expect(pickMock).toHaveBeenCalledTimes(1));
      await rendered.unmount();
    });

    it("BKP-25 asks to replace with the counts of the file, before touching the data", async () => {
      pickMock.mockResolvedValue(fileText());
      const rendered = await open();
      await pickAndConfirm();
      expect(screen.getByRole("button", { name: "Substituir" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
      expect(profile().name).toBe("Ana");
      await rendered.unmount();
    });

    it("BKP-11 BKP-13 confirming replaces everything and refreshes the screen", async () => {
      realm.write(() => {
        profile().lastBackupAt = new Date(2026, 9, 2);
        realm.create(Deck, { name: "Velho", createdAt: new Date(), cards: [] });
      });
      pickMock.mockResolvedValue(fileText());
      const rendered = await open();
      await pickAndConfirm();
      await fireEvent.press(screen.getByRole("button", { name: "Substituir" }));

      expect(await screen.findByText("Backup restaurado")).toBeTruthy();
      expect(realm.objects(Profile)).toHaveLength(1);
      expect(profile().name).toBe("Bia");
      expect(decksNow().sort()).toEqual(["A", "B"]);
      expect(realm.objects(Card)).toHaveLength(1);
      expect(realm.objects(ReviewLog)).toHaveLength(1);
      expect(profile().lastBackupAt).toBeNull();
      expect(await screen.findByText("Nenhum backup ainda")).toBeTruthy();
      expect(screen.queryByText(REPLACE)).toBeNull();
      await rendered.unmount();
    });

    it("BKP-12 applies the theme of the file right away", async () => {
      const setScheme = jest.spyOn(Appearance, "setColorScheme").mockImplementation(() => undefined);
      pickMock.mockResolvedValue(fileText());
      const rendered = await renderRouterWithProviders({ index: () => null, ...routes }, realm, "/backup", {
        navigator: RootStack,
      });
      await pickAndConfirm();
      await fireEvent.press(screen.getByRole("button", { name: "Substituir" }));

      await waitFor(() => expect(setScheme).toHaveBeenLastCalledWith("dark"));
      await rendered.unmount();
    });

    it("BKP-14 a cancelled picker changes nothing and shows no error", async () => {
      const rendered = await open();
      await fireEvent.press(await screen.findByRole("button", { name: "Importar backup" }));
      await waitFor(() => expect(pickMock).toHaveBeenCalled());
      expect(screen.queryByText(/Arquivo inválido/)).toBeNull();
      expect(profile().name).toBe("Ana");
      await rendered.unmount();
    });

    it("BKP-14 Cancelar in the dialog keeps every record", async () => {
      realm.write(() => {
        realm.create(Deck, { name: "Velho", createdAt: new Date(), cards: [] });
      });
      pickMock.mockResolvedValue(fileText());
      const rendered = await open();
      await pickAndConfirm();
      await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

      await waitFor(() => expect(screen.queryByText(REPLACE)).toBeNull());
      expect(profile().name).toBe("Ana");
      expect(decksNow()).toEqual(["Velho"]);
      expect(screen.queryByText("Backup restaurado")).toBeNull();
      await rendered.unmount();
    });

    it.each([
      ["not JSON", "isto não é json"],
      ["another app", JSON.stringify({ ...backupFile(), app: "outro" })],
      ["a dangling deck", JSON.stringify({ ...backupFile(), cards: [{ ...backupFile().cards[0], deckId: ID(9) }] })],
    ])("BKP-16 %s shows the invalid-file toast and leaves the data intact", async (_name, text) => {
      realm.write(() => {
        realm.create(Deck, { name: "Velho", createdAt: new Date(), cards: [] });
      });
      pickMock.mockResolvedValue(text);
      const rendered = await open();
      await fireEvent.press(await screen.findByRole("button", { name: "Importar backup" }));

      expect(await screen.findByText("Arquivo inválido. Escolha um backup do Memorizze.")).toBeTruthy();
      expect(screen.queryByText(/Substituir/)).toBeNull();
      expect(profile().name).toBe("Ana");
      expect(decksNow()).toEqual(["Velho"]);
      await rendered.unmount();
    });

    it("BKP-17 a newer version shows its own toast and leaves the data intact", async () => {
      pickMock.mockResolvedValue(JSON.stringify({ ...backupFile(), version: 2 }));
      const rendered = await open();
      await fireEvent.press(await screen.findByRole("button", { name: "Importar backup" }));

      expect(await screen.findByText("Este backup é de uma versão mais nova do app.")).toBeTruthy();
      expect(profile().name).toBe("Ana");
      await rendered.unmount();
    });

    it("BKP-20 a file over the limit shows the invalid-file toast", async () => {
      pickMock.mockRejectedValue(new Error("BACKUP_TOO_LARGE"));
      const rendered = await open();
      await fireEvent.press(await screen.findByRole("button", { name: "Importar backup" }));

      expect(await screen.findByText("Arquivo inválido. Escolha um backup do Memorizze.")).toBeTruthy();
      await rendered.unmount();
    });

    it("BKP-18 a failing transaction shows the error and leaves the data intact", async () => {
      realm.write(() => {
        realm.create(Deck, { name: "Velho", createdAt: new Date(), cards: [] });
      });
      pickMock.mockResolvedValue(fileText());
      const rendered = await open();
      await pickAndConfirm();
      jest.spyOn(realm, "write").mockImplementation(() => {
        throw new Error("disk error");
      });
      await fireEvent.press(screen.getByRole("button", { name: "Substituir" }));

      expect(await screen.findByText("Não foi possível restaurar. Seus dados não foram alterados.")).toBeTruthy();
      jest.restoreAllMocks();
      expect(profile().name).toBe("Ana");
      expect(decksNow()).toEqual(["Velho"]);
      await rendered.unmount();
    });

    it("BKP-22 both buttons are disabled while the picker is open", async () => {
      let finish: (text: string | null) => void = () => undefined;
      pickMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      const rendered = await open();
      await fireEvent.press(await screen.findByRole("button", { name: "Importar backup" }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Importar backup", disabled: true })).toBeTruthy(),
      );
      expect(screen.getByRole("button", { name: "Exportar backup", disabled: true })).toBeTruthy();

      await act(async () => finish(null));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Importar backup", disabled: false })).toBeTruthy(),
      );
      await rendered.unmount();
    });
  });
});

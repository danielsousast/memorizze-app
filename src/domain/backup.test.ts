import { createRandom } from "../testing/random";
import {
  BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  backupFileName,
  backupStatusLabel,
  buildBackup,
  formatCount,
  previousBackupLabel,
  settingsBackupSubtitle,
  parseBackup,
  replaceMessage,
  type BackupFile,
  type BackupSnapshot,
} from "./backup";

const HEX = "0123456789abcdef";

function hexId(random: ReturnType<typeof createRandom>): string {
  let id = "";
  for (let i = 0; i < 24; i++) id += HEX[Math.floor(random.next() * 16)];
  return id;
}

const NASTY_TEXT = ["", "Olá, ação — çãõ", "linha 1\nlinha 2", 'aspas "duplas" e \'simples\'', "😀 emoji", "\\ barra"];

function randomIso(random: ReturnType<typeof createRandom>): string {
  const limits = ["1970-01-01T00:00:00.000Z", "9999-12-31T23:59:59.999Z"];
  if (random.next() < 0.1) return random.pick(limits);
  return new Date(Math.floor(random.next() * 4e12)).toISOString();
}

function randomSnapshot(seed: number): BackupSnapshot {
  const random = createRandom(seed);
  const deckCount = Math.floor(random.next() * 4);
  const decks = Array.from({ length: deckCount }, () => ({
    id: hexId(random),
    name: random.pick(NASTY_TEXT),
    description: random.next() < 0.5 ? null : random.pick(NASTY_TEXT),
    createdAt: randomIso(random),
  }));
  const cards =
    deckCount === 0
      ? []
      : Array.from({ length: Math.floor(random.next() * 8) }, () => ({
          id: hexId(random),
          deckId: random.pick(decks).id,
          front: random.pick(NASTY_TEXT),
          back: random.pick(NASTY_TEXT),
          easeFactor: 1.3 + random.next() * 2,
          intervalDays: Math.floor(random.next() * 400),
          repetitions: Math.floor(random.next() * 20),
          lapses: Math.floor(random.next() * 5),
          dueDate: randomIso(random),
          createdAt: randomIso(random),
        }));
  const reviewLogs =
    cards.length === 0
      ? []
      : Array.from({ length: Math.floor(random.next() * 12) }, () => {
          const card = random.pick(cards);
          return {
            id: hexId(random),
            cardId: card.id,
            deckId: card.deckId,
            grade: Math.floor(random.next() * 4),
            reviewedAt: randomIso(random),
          };
        });
  return {
    profile: {
      id: hexId(random),
      name: "Ana",
      dailyGoal: Math.floor(random.next() * 100),
      createdAt: randomIso(random),
      studyTutorialSeen: random.next() < 0.5,
      themePreference: random.pick(["system", "light", "dark"]),
      newCardsPerDay: random.pick([0, 5, 10, 20, 30, 50]),
    },
    decks,
    cards,
    reviewLogs,
  };
}

const EXPORTED_AT = new Date("2026-10-10T19:04:00.000Z");

function validFile(): BackupFile {
  return buildBackup(
    {
      profile: {
        id: "aaaaaaaaaaaaaaaaaaaaaaaa",
        name: "Ana",
        dailyGoal: 20,
        createdAt: "2026-01-01T00:00:00.000Z",
        studyTutorialSeen: false,
        themePreference: "system",
        newCardsPerDay: 10,
      },
      decks: [{ id: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "Inglês", description: null, createdAt: "2026-01-02T00:00:00.000Z" }],
      cards: [
        {
          id: "cccccccccccccccccccccccc",
          deckId: "bbbbbbbbbbbbbbbbbbbbbbbb",
          front: "a",
          back: "b",
          easeFactor: 2.5,
          intervalDays: 0,
          repetitions: 0,
          lapses: 0,
          dueDate: "2026-01-03T00:00:00.000Z",
          createdAt: "2026-01-03T00:00:00.000Z",
        },
      ],
      reviewLogs: [
        {
          id: "dddddddddddddddddddddddd",
          cardId: "cccccccccccccccccccccccc",
          deckId: "bbbbbbbbbbbbbbbbbbbbbbbb",
          grade: 2,
          reviewedAt: "2026-01-04T00:00:00.000Z",
        },
      ],
    },
    EXPORTED_AT,
  );
}

function mutated(change: (file: Record<string, any>) => void): string {
  const file = JSON.parse(JSON.stringify(validFile()));
  change(file);
  return JSON.stringify(file);
}

describe("backup domain", () => {
  it("BKP-02 builds the JSON with app, version, exportedAt and the four lists", () => {
    const snapshot = randomSnapshot(1);
    const file = JSON.parse(JSON.stringify(buildBackup(snapshot, EXPORTED_AT)));
    expect(file.app).toBe("memorizze");
    expect(file.version).toBe(BACKUP_VERSION);
    expect(file.exportedAt).toBe("2026-10-10T19:04:00.000Z");
    expect(file.profile).toEqual(snapshot.profile);
    expect(file.decks).toEqual(snapshot.decks);
    expect(file.cards).toEqual(snapshot.cards);
    expect(file.reviewLogs).toEqual(snapshot.reviewLogs);
  });

  it("BKP-02 writes 24-hex ids and a deckId on every card", () => {
    const file = validFile();
    for (const item of [file.profile, ...file.decks, ...file.cards, ...file.reviewLogs]) {
      expect(item.id).toMatch(/^[0-9a-f]{24}$/);
    }
    expect(file.cards[0].deckId).toBe(file.decks[0].id);
  });

  it("BKP-01 names the file by local date", () => {
    expect(backupFileName(new Date(2026, 9, 10, 23, 59))).toBe("memorizze-2026-10-10.json");
    expect(backupFileName(new Date(2026, 0, 5, 0, 0))).toBe("memorizze-2026-01-05.json");
  });

  it("BKP-20 limits the file to 20 MB", () => {
    expect(MAX_BACKUP_BYTES).toBe(20 * 1024 * 1024);
  });

  it("accepts a valid file", () => {
    const result = parseBackup(JSON.stringify(validFile()));
    expect(result).toEqual({ ok: true, backup: validFile() });
  });

  it("BKP-16 rejects text that is not JSON, another app, or a missing profile", () => {
    expect(parseBackup("not json")).toEqual({ ok: false, reason: "invalid" });
    expect(parseBackup("null")).toEqual({ ok: false, reason: "invalid" });
    expect(parseBackup("[]")).toEqual({ ok: false, reason: "invalid" });
    expect(parseBackup(mutated((f) => (f.app = "outro")))).toEqual({ ok: false, reason: "invalid" });
    expect(parseBackup(mutated((f) => delete f.profile))).toEqual({ ok: false, reason: "invalid" });
  });

  it("BKP-17 reports a newer version for any integer above 1", () => {
    expect(parseBackup(mutated((f) => (f.version = 2)))).toEqual({ ok: false, reason: "newer" });
    expect(parseBackup(mutated((f) => (f.version = 0)))).toEqual({ ok: false, reason: "invalid" });
    expect(parseBackup(mutated((f) => (f.version = "1")))).toEqual({ ok: false, reason: "invalid" });
  });

  const invalidCases: [string, (f: Record<string, any>) => void][] = [
    ["profile name empty", (f) => (f.profile.name = "")],
    ["profile name with 31 characters", (f) => (f.profile.name = "a".repeat(31))],
    ["profile name not a string", (f) => (f.profile.name = 5)],
    ["repeated deck id", (f) => f.decks.push({ ...f.decks[0] })],
    ["repeated card id", (f) => f.cards.push({ ...f.cards[0] })],
    ["repeated review id", (f) => f.reviewLogs.push({ ...f.reviewLogs[0] })],
    ["non-hex id", (f) => (f.decks[0].id = "z".repeat(24))],
    ["short id", (f) => (f.profile.id = "abc")],
    ["uppercase hex id", (f) => (f.cards[0].id = "A".repeat(24))],
    ["invalid date", (f) => (f.decks[0].createdAt = "ontem")],
    ["date without Z", (f) => (f.cards[0].dueDate = "2026-01-03T00:00:00")],
    ["impossible date", (f) => (f.cards[0].dueDate = "2026-13-45T00:00:00.000Z")],
    ["invalid exportedAt", (f) => (f.exportedAt = "x")],
    ["grade 4", (f) => (f.reviewLogs[0].grade = 4)],
    ["grade -1", (f) => (f.reviewLogs[0].grade = -1)],
    ["grade fractional", (f) => (f.reviewLogs[0].grade = 1.5)],
    ["card with missing deck", (f) => (f.cards[0].deckId = "e".repeat(24))],
    ["review with missing card", (f) => (f.reviewLogs[0].cardId = "e".repeat(24))],
    ["review with missing deck", (f) => (f.reviewLogs[0].deckId = "e".repeat(24))],
    ["negative intervalDays", (f) => (f.cards[0].intervalDays = -1)],
    ["negative repetitions", (f) => (f.cards[0].repetitions = -1)],
    ["negative lapses", (f) => (f.cards[0].lapses = -1)],
    ["fractional intervalDays", (f) => (f.cards[0].intervalDays = 1.5)],
    ["easeFactor 1.2", (f) => (f.cards[0].easeFactor = 1.2)],
    ["easeFactor as string", (f) => (f.cards[0].easeFactor = "2.5")],
    ["null easeFactor (NaN serialized)", (f) => (f.cards[0].easeFactor = null)],
    ["negative dailyGoal", (f) => (f.profile.dailyGoal = -1)],
    ["unknown theme", (f) => (f.profile.themePreference = "sepia")],
    ["unknown new cards limit", (f) => (f.profile.newCardsPerDay = 7)],
    ["studyTutorialSeen not boolean", (f) => (f.profile.studyTutorialSeen = "yes")],
    ["card front not a string", (f) => (f.cards[0].front = 1)],
    ["deck description a number", (f) => (f.decks[0].description = 1)],
    ["decks not an array", (f) => (f.decks = {})],
    ["cards missing", (f) => delete f.cards],
    ["reviewLogs missing", (f) => delete f.reviewLogs],
    ["deck entry null", (f) => (f.decks[0] = null)],
  ];

  it.each(invalidCases)("BKP-19 rejects %s", (_name, change) => {
    expect(parseBackup(mutated(change))).toEqual({ ok: false, reason: "invalid" });
  });

  it("BKP-19 rejects a non-finite number written as text", () => {
    const text = JSON.stringify(validFile()).replace('"easeFactor":2.5', '"easeFactor":NaN');
    expect(parseBackup(text)).toEqual({ ok: false, reason: "invalid" });
  });

  it("BKP-19 accepts a deck without description and a card-less backup", () => {
    const withoutDescription = parseBackup(mutated((f) => delete f.decks[0].description));
    expect(withoutDescription.ok).toBe(true);
    const empty = parseBackup(
      mutated((f) => {
        f.decks = [];
        f.cards = [];
        f.reviewLogs = [];
      }),
    );
    expect(empty.ok).toBe(true);
  });

  it("INV-02 round-trips 200 random snapshots through JSON", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const snapshot = randomSnapshot(seed);
      const built = buildBackup(snapshot, EXPORTED_AT);
      expect(parseBackup(JSON.stringify(built))).toEqual({ ok: true, backup: built });
    }
  });

  it("INV-04 rejects any file whose reference was mutated and accepts the rest", () => {
    const random = createRandom(7);
    let mutations = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const file = JSON.parse(JSON.stringify(buildBackup(randomSnapshot(seed), EXPORTED_AT)));
      const targets: [Record<string, any>[], string][] = [
        [file.cards, "deckId"],
        [file.reviewLogs, "cardId"],
        [file.reviewLogs, "deckId"],
      ];
      const candidates = targets.filter(([list]) => list.length > 0);
      if (candidates.length === 0 || random.next() < 0.3) {
        expect(parseBackup(JSON.stringify(file)).ok).toBe(true);
        continue;
      }
      const [list, key] = random.pick(candidates);
      random.pick(list)[key] = hexId(random);
      mutations++;
      expect(parseBackup(JSON.stringify(file))).toEqual({ ok: false, reason: "invalid" });
    }
    expect(mutations).toBeGreaterThan(50);
  });
});

describe("backup labels", () => {
  const now = new Date(2026, 9, 10, 18, 0);

  it("BKP-07 labels today with the time, other days with the date, none without a backup", () => {
    expect(backupStatusLabel(new Date(2026, 9, 10, 16, 4), now)).toBe("Backup feito hoje, 16:04");
    expect(backupStatusLabel(new Date(2026, 9, 10, 9, 5), now)).toBe("Backup feito hoje, 09:05");
    expect(backupStatusLabel(new Date(2026, 9, 2, 16, 4), now)).toBe("Backup feito em 2 de outubro");
    expect(backupStatusLabel(new Date(2025, 9, 10, 16, 4), now)).toBe("Backup feito em 10 de outubro");
    expect(backupStatusLabel(null, now)).toBe("Nenhum backup ainda");
  });

  it("BKP-07 shows the previous backup line only when there is one", () => {
    expect(previousBackupLabel(new Date(2026, 9, 2))).toBe("Anterior: 2 de outubro");
    expect(previousBackupLabel(null)).toBeNull();
  });

  it("BKP-09 settings subtitle", () => {
    expect(settingsBackupSubtitle(new Date(2026, 9, 2, 8))).toBe("Último backup: 2 de outubro");
    expect(settingsBackupSubtitle(null)).toBe("Nenhum backup ainda");
  });

  it("BKP-08 counts use a dot as the thousands separator", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(492)).toBe("492");
    expect(formatCount(3418)).toBe("3.418");
    expect(formatCount(1234567)).toBe("1.234.567");
  });
});

describe("replaceMessage", () => {
  const file = (decks: number, cards: number, logs: number) =>
    ({ decks: Array(decks), cards: Array(cards), reviewLogs: Array(logs) }) as unknown as BackupFile;

  it("BKP-25 counts what the file holds", () => {
    expect(replaceMessage(file(2, 10, 30))).toBe(
      "Substituir 2 baralhos, 10 cartões e 30 revisões pelos do arquivo?",
    );
  });

  it("BKP-25 uses the singular and the thousands separator", () => {
    expect(replaceMessage(file(1, 1, 3418))).toBe(
      "Substituir 1 baralho, 1 cartão e 3.418 revisões pelos do arquivo?",
    );
    expect(replaceMessage(file(0, 0, 1))).toBe(
      "Substituir 0 baralhos, 0 cartões e 1 revisão pelos do arquivo?",
    );
  });
});

import { formatDayMonth } from "./dates";
import { isNewCardsLimit, parseTheme, type ThemePreference } from "./preferences";

export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

const APP_ID = "memorizze";
const NAME_MAX = 30;
const MIN_EASE_FACTOR = 1.3;
const ID_PATTERN = /^[0-9a-f]{24}$/;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export type BackupProfile = {
  id: string;
  name: string;
  dailyGoal: number;
  createdAt: string;
  studyTutorialSeen: boolean;
  themePreference: ThemePreference;
  /** 0 = no limit, as stored in Realm. */
  newCardsPerDay: number;
};

export type BackupDeck = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export type BackupCard = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueDate: string;
  createdAt: string;
};

export type BackupReviewLog = {
  id: string;
  cardId: string;
  deckId: string;
  grade: number;
  reviewedAt: string;
};

export type BackupSnapshot = {
  profile: BackupProfile;
  decks: BackupDeck[];
  cards: BackupCard[];
  reviewLogs: BackupReviewLog[];
};

export type BackupFile = BackupSnapshot & {
  app: typeof APP_ID;
  version: number;
  exportedAt: string;
};

export type ParsedBackup =
  | { ok: true; backup: BackupFile }
  | { ok: false; reason: "invalid" | "newer" };

export function buildBackup(snapshot: BackupSnapshot, exportedAt: Date): BackupFile {
  return {
    app: APP_ID,
    version: BACKUP_VERSION,
    exportedAt: exportedAt.toISOString(),
    profile: snapshot.profile,
    decks: snapshot.decks,
    cards: snapshot.cards,
    reviewLogs: snapshot.reviewLogs,
  };
}

export function backupFileName(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `memorizze-${date.getFullYear()}-${month}-${day}.json`;
}

export const NO_BACKUP_LABEL = "Nenhum backup ainda";

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function backupStatusLabel(last: Date | null, now: Date): string {
  if (!last) return NO_BACKUP_LABEL;
  if (isSameLocalDay(last, now)) return `Backup feito hoje, ${pad(last.getHours())}:${pad(last.getMinutes())}`;
  return `Backup feito em ${formatDayMonth(last)}`;
}

export function previousBackupLabel(previous: Date | null): string | null {
  return previous ? `Anterior: ${formatDayMonth(previous)}` : null;
}

export function settingsBackupSubtitle(last: Date | null): string {
  return last ? `Último backup: ${formatDayMonth(last)}` : NO_BACKUP_LABEL;
}

// Thousands separator by hand (pt-BR "3.418"): same result on Hermes and Jest, no Intl.
export function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function plural(n: number, one: string, many: string): string {
  return `${formatCount(n)} ${n === 1 ? one : many}`;
}

export function replaceMessage(backup: BackupFile): string {
  const decks = plural(backup.decks.length, "baralho", "baralhos");
  const cards = plural(backup.cards.length, "cartão", "cartões");
  const reviews = plural(backup.reviewLogs.length, "revisão", "revisões");
  return `Substituir ${decks}, ${cards} e ${reviews} pelos do arquivo?`;
}

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && ISO_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isText(value: unknown): value is string {
  return typeof value === "string";
}

function profileFrom(raw: unknown): BackupProfile | null {
  if (!isRecord(raw)) return null;
  const { id, name, dailyGoal, createdAt, studyTutorialSeen, themePreference, newCardsPerDay } = raw;
  if (!isId(id) || !isText(name) || name.length < 1 || name.length > NAME_MAX) return null;
  if (!isCount(dailyGoal) || !isIsoDate(createdAt) || typeof studyTutorialSeen !== "boolean") return null;
  if (typeof themePreference !== "string" || parseTheme(themePreference) !== themePreference) return null;
  if (typeof newCardsPerDay !== "number") return null;
  if (newCardsPerDay !== 0 && !isNewCardsLimit(newCardsPerDay)) return null;
  return { id, name, dailyGoal, createdAt, studyTutorialSeen, themePreference, newCardsPerDay };
}

function deckFrom(raw: unknown): BackupDeck | null {
  if (!isRecord(raw)) return null;
  const { id, name, description, createdAt } = raw;
  if (!isId(id) || !isText(name) || !isIsoDate(createdAt)) return null;
  if (description !== undefined && description !== null && !isText(description)) return null;
  return { id, name, description: description ?? null, createdAt };
}

function cardFrom(raw: unknown): BackupCard | null {
  if (!isRecord(raw)) return null;
  const { id, deckId, front, back, easeFactor, intervalDays, repetitions, lapses, dueDate, createdAt } = raw;
  if (!isId(id) || !isId(deckId) || !isText(front) || !isText(back)) return null;
  if (typeof easeFactor !== "number" || !Number.isFinite(easeFactor) || easeFactor < MIN_EASE_FACTOR) return null;
  if (!isCount(intervalDays) || !isCount(repetitions) || !isCount(lapses)) return null;
  if (!isIsoDate(dueDate) || !isIsoDate(createdAt)) return null;
  return { id, deckId, front, back, easeFactor, intervalDays, repetitions, lapses, dueDate, createdAt };
}

function reviewLogFrom(raw: unknown): BackupReviewLog | null {
  if (!isRecord(raw)) return null;
  const { id, cardId, deckId, grade, reviewedAt } = raw;
  if (!isId(id) || !isId(cardId) || !isId(deckId) || !isIsoDate(reviewedAt)) return null;
  if (typeof grade !== "number" || !Number.isInteger(grade) || grade < 0 || grade > 3) return null;
  return { id, cardId, deckId, grade, reviewedAt };
}

/** Maps every entry; `null` when the list is malformed, an entry is invalid or an id repeats. */
function listFrom<T extends { id: string }>(raw: unknown, read: (entry: unknown) => T | null): T[] | null {
  if (!Array.isArray(raw)) return null;
  const items: T[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const item = read(entry);
    if (item === null || seen.has(item.id)) return null;
    seen.add(item.id);
    items.push(item);
  }
  return items;
}

const INVALID = { ok: false, reason: "invalid" } as const;

export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return INVALID;
  }
  if (!isRecord(raw) || raw.app !== APP_ID) return INVALID;
  const { version } = raw;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) return INVALID;
  if (version > BACKUP_VERSION) return { ok: false, reason: "newer" };

  const profile = profileFrom(raw.profile);
  const decks = listFrom(raw.decks, deckFrom);
  const cards = listFrom(raw.cards, cardFrom);
  const reviewLogs = listFrom(raw.reviewLogs, reviewLogFrom);
  if (!profile || !decks || !cards || !reviewLogs || !isIsoDate(raw.exportedAt)) return INVALID;

  const deckIds = new Set(decks.map((deck) => deck.id));
  const cardIds = new Set(cards.map((card) => card.id));
  if (!cards.every((card) => deckIds.has(card.deckId))) return INVALID;
  if (!reviewLogs.every((log) => cardIds.has(log.cardId) && deckIds.has(log.deckId))) return INVALID;

  return {
    ok: true,
    backup: { app: APP_ID, version, exportedAt: raw.exportedAt, profile, decks, cards, reviewLogs },
  };
}

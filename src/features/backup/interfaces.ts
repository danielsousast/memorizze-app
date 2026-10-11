import type { BackupFile, BackupSnapshot } from "@/domain/backup";

export type BackupCounts = { decks: number; cards: number; reviewLogs: number };

export type LastBackup = { last: Date | null; previous: Date | null };

export type BackupErrorCode =
  | "BACKUP_INVALID"
  | "BACKUP_NEWER"
  | "BACKUP_TOO_LARGE"
  | "BACKUP_RESTORE_FAILED"
  | "BACKUP_EXPORT_FAILED";

export type BackupRepository = {
  counts(): BackupCounts;
  lastBackup(): LastBackup;
  snapshot(): BackupSnapshot;
  /** Moves `lastBackupAt` to `previousBackupAt` and stamps `at` as the new last backup. */
  markBackedUp(at: Date): void;
  /** All or nothing: replaces profile, decks, cards and review logs in one transaction. */
  restore(backup: BackupFile): void;
};

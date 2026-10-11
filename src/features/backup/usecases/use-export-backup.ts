import { useMutation } from "@tanstack/react-query";

import { backupFileName, buildBackup } from "@/domain/backup";
import { AppError } from "@/domain/errors";

import { deleteBackupFile, shareBackupFile, writeBackupFile } from "../files";
import type { BackupErrorCode } from "../interfaces";
import { useBackupRepository } from "../repository";

export type ExportedBackup = { uri: string; at: Date };

/** Writes and shares the file; the caller then records the backup date (BKP-04). */
export function useExportBackup() {
  const repository = useBackupRepository();
  return useMutation<ExportedBackup, AppError<BackupErrorCode>, void>({
    mutationFn: async () => {
      const at = new Date();
      const json = JSON.stringify(buildBackup(repository.snapshot(), at));
      let uri: string | undefined;
      try {
        uri = writeBackupFile(backupFileName(at), json);
        await shareBackupFile(uri);
      } catch {
        if (uri) deleteBackupFile(uri);
        throw new AppError<BackupErrorCode>("BACKUP_EXPORT_FAILED");
      }
      return { uri, at };
    },
  });
}

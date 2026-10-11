import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { BackupFile } from "@/domain/backup";
import type { AppError } from "@/domain/errors";

import type { BackupErrorCode } from "../interfaces";
import { useBackupRepository } from "../repository";

export function useRestoreBackup() {
  const repository = useBackupRepository();
  const queryClient = useQueryClient();
  return useMutation<void, AppError<BackupErrorCode>, BackupFile>({
    mutationFn: async (backup) => repository.restore(backup),
    // Every cached read is stale after a restore; the profile read also re-applies the
    // restored theme (BKP-12) and releases the welcome guard (AD-004).
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

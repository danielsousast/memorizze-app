import { useQuery } from "@tanstack/react-query";

import { useBackupRepository } from "../repository";
import { backupKeys } from "./keys";

export function useLastBackup() {
  const repository = useBackupRepository();
  return useQuery({
    queryKey: backupKeys.last,
    queryFn: async () => repository.lastBackup(),
  });
}

import { useQuery } from "@tanstack/react-query";

import { useBackupRepository } from "../repository";
import { backupKeys } from "./keys";

export function useBackupCounts() {
  const repository = useBackupRepository();
  return useQuery({
    queryKey: backupKeys.counts,
    queryFn: async () => repository.counts(),
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useBackupRepository } from "../repository";
import { backupKeys } from "./keys";

export function useMarkBackedUp() {
  const repository = useBackupRepository();
  const queryClient = useQueryClient();
  return useMutation<void, Error, Date>({
    mutationFn: async (at) => repository.markBackedUp(at),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: backupKeys.all }),
  });
}

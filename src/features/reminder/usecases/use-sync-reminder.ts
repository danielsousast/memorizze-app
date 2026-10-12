import { useMutation, useQueryClient } from "@tanstack/react-query";

import { profileKeys } from "@/features/profile";

import { useReminderRepository } from "../repository";

export function useSyncReminder() {
  const repository = useReminderRepository();
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, void>({
    mutationFn: async () => repository.sync(),
    // Only a sync that rewrote the saved reminder makes the cached profile stale.
    onSuccess: (changed) => {
      if (changed) return queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

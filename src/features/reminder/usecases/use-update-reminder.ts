import { useMutation, useQueryClient } from "@tanstack/react-query";

import { profileKeys } from "@/features/profile";

import type { ReminderInput, ReminderOutcome } from "../interfaces";
import { useReminderRepository } from "../repository";

export function useUpdateReminder() {
  const repository = useReminderRepository();
  const queryClient = useQueryClient();
  return useMutation<ReminderOutcome, Error, ReminderInput>({
    mutationFn: async (input) => repository.apply(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  });
}

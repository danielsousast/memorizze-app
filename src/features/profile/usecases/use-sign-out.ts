import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useProfileRepository } from "../repository";

export function useSignOut() {
  const repository = useProfileRepository();
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => repository.wipe(),
    // Every cached read is stale after a wipe; the empty profile read sends the app
    // back to the welcome screen (AD-004).
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AppError } from "@/domain/errors";

import type { DeckErrorCode } from "../interfaces";
import { useDeckRepository } from "../repository";
import { deckKeys } from "./keys";

// Resetting changes card scheduling, so deck due counts and card queries are stale.
export function useResetDeckProgress() {
  const repository = useDeckRepository();
  const queryClient = useQueryClient();
  return useMutation<void, AppError<DeckErrorCode>, string>({
    mutationFn: async (id) => repository.resetProgress(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: deckKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["cards"] }),
      ]),
  });
}

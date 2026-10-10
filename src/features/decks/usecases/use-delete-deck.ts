import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AppError } from "@/domain/errors";

import type { DeckErrorCode } from "../interfaces";
import { useDeckRepository } from "../repository";
import { deckKeys } from "./keys";

// Deleting a deck also deletes its cards, so card queries are stale too.
export function useDeleteDeck() {
  const repository = useDeckRepository();
  const queryClient = useQueryClient();
  return useMutation<void, AppError<DeckErrorCode>, string>({
    mutationFn: async (id) => repository.remove(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: deckKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["cards"] }),
      ]),
  });
}

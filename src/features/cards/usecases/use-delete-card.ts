import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AppError } from "@/domain/errors";

import type { CardErrorCode } from "../interfaces";
import { useCardRepository } from "../repository";
import { cardKeys } from "./keys";

// A deleted card changes its deck's cardCount, so deck queries are stale too.
export function useDeleteCard() {
  const repository = useCardRepository();
  const queryClient = useQueryClient();
  return useMutation<void, AppError<CardErrorCode>, string>({
    mutationFn: async (id) => repository.remove(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: cardKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["decks"] }),
      ]),
  });
}

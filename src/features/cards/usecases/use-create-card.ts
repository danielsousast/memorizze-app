import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AppError } from "@/domain/errors";

import type { Card, CardErrorCode, CardInput } from "../interfaces";
import { useCardRepository } from "../repository";
import { cardKeys } from "./keys";

// A new card changes its deck's cardCount, so deck queries are stale too.
export function useCreateCard() {
  const repository = useCardRepository();
  const queryClient = useQueryClient();
  return useMutation<
    Card,
    AppError<CardErrorCode>,
    { deckId: string; input: CardInput }
  >({
    mutationFn: async ({ deckId, input }) => repository.create(deckId, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: cardKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["decks"] }),
      ]),
  });
}

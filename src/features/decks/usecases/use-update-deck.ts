import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AppError } from "@/domain/errors";

import type { Deck, DeckErrorCode, DeckInput } from "../interfaces";
import { useDeckRepository } from "../repository";
import { deckKeys } from "./keys";

export function useUpdateDeck() {
  const repository = useDeckRepository();
  const queryClient = useQueryClient();
  return useMutation<
    Deck,
    AppError<DeckErrorCode>,
    { id: string; input: DeckInput }
  >({
    mutationFn: async ({ id, input }) => repository.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deckKeys.all }),
  });
}

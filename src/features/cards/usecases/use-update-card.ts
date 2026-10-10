import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AppError } from "@/domain/errors";

import type { Card, CardErrorCode, CardInput } from "../interfaces";
import { useCardRepository } from "../repository";
import { cardKeys } from "./keys";

export function useUpdateCard() {
  const repository = useCardRepository();
  const queryClient = useQueryClient();
  return useMutation<
    Card,
    AppError<CardErrorCode>,
    { id: string; input: Partial<CardInput> }
  >({
    mutationFn: async ({ id, input }) => repository.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardKeys.all }),
  });
}

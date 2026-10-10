import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AppError } from "@/domain/errors";
import type { Grade } from "@/domain/schedule";
import { cardKeys } from "@/features/cards";
import { profileKeys } from "@/features/profile";

import type { StudyCard, StudyErrorCode } from "../interfaces";
import { useStudyRepository } from "../repository";
import { studyKeys } from "./keys";

export function useAnswerCard() {
  const repository = useStudyRepository();
  const queryClient = useQueryClient();
  return useMutation<StudyCard, AppError<StudyErrorCode>, { cardId: string; grade: Grade }>({
    mutationFn: async ({ cardId, grade }) => repository.answer(cardId, grade),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: cardKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["decks"] }),
        queryClient.invalidateQueries({ queryKey: studyKeys.all }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      ]),
  });
}

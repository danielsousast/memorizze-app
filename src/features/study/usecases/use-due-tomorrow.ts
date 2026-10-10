import { useQuery } from "@tanstack/react-query";

import { useStudyRepository } from "../repository";
import { studyKeys } from "./keys";

export function useDueTomorrow(deckId?: string) {
  const repository = useStudyRepository();
  return useQuery({
    queryKey: studyKeys.tomorrow(deckId),
    queryFn: async () => repository.countDueTomorrow(deckId),
    gcTime: 0,
  });
}

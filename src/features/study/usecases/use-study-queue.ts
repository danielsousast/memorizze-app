import { useQuery } from "@tanstack/react-query";

import { useStudyRepository } from "../repository";
import { studyKeys } from "./keys";

// gcTime 0: every session opens on a fresh snapshot (QUE-01).
export function useStudyQueue(deckId?: string) {
  const repository = useStudyRepository();
  return useQuery({
    queryKey: studyKeys.queue(deckId),
    queryFn: async () => repository.queue(deckId),
    gcTime: 0,
  });
}

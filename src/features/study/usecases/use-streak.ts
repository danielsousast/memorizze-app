import { useQuery } from "@tanstack/react-query";

import { useStudyRepository } from "../repository";
import { studyKeys } from "./keys";

export function useStreak() {
  const repository = useStudyRepository();
  return useQuery({
    queryKey: studyKeys.streak,
    queryFn: async () => repository.currentStreak(),
    gcTime: 0,
  });
}

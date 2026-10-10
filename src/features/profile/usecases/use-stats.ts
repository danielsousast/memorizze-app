import { useQuery } from "@tanstack/react-query";

import { useProfileRepository } from "../repository";
import { profileKeys } from "./keys";

export function useStats() {
  const repository = useProfileRepository();
  return useQuery({
    queryKey: profileKeys.stats,
    queryFn: async () => repository.stats(),
  });
}

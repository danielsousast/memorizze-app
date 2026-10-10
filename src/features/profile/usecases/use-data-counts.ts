import { useQuery } from "@tanstack/react-query";

import { useProfileRepository } from "../repository";
import { profileKeys } from "./keys";

export function useDataCounts() {
  const repository = useProfileRepository();
  return useQuery({
    queryKey: profileKeys.counts,
    queryFn: async () => repository.dataCounts(),
  });
}

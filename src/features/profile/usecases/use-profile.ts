import { useQuery } from "@tanstack/react-query";

import { useProfileRepository } from "../repository";
import { profileKeys } from "./keys";

export function useProfile() {
  const repository = useProfileRepository();
  return useQuery({
    queryKey: profileKeys.profile,
    queryFn: async () => repository.get(),
  });
}

import { useQuery } from "@tanstack/react-query";

import { useProfileRepository } from "../repository";
import { profileKeys } from "./keys";

export function useReviewsToday() {
  const repository = useProfileRepository();
  return useQuery({
    queryKey: profileKeys.reviewsToday,
    queryFn: async () => repository.countReviewsToday(),
  });
}

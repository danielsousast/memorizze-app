import { useQuery } from "@tanstack/react-query";

import { useCardRepository } from "../repository";
import { cardKeys } from "./keys";

export function useCard(id: string) {
  const repository = useCardRepository();
  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: async () => repository.getById(id),
  });
}

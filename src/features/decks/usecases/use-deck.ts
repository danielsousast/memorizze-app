import { useQuery } from "@tanstack/react-query";

import { useDeckRepository } from "../repository";
import { deckKeys } from "./keys";

export function useDeck(id: string) {
  const repository = useDeckRepository();
  return useQuery({
    queryKey: deckKeys.detail(id),
    queryFn: async () => repository.getById(id),
  });
}

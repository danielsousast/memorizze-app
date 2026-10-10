import { useQuery } from "@tanstack/react-query";

import { useDeckRepository } from "../repository";
import { deckKeys } from "./keys";

export function useDecks() {
  const repository = useDeckRepository();
  return useQuery({
    queryKey: deckKeys.all,
    queryFn: async () => repository.list(),
  });
}

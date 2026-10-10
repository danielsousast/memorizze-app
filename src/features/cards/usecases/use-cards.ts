import { useQuery } from "@tanstack/react-query";

import { useCardRepository } from "../repository";
import { cardKeys } from "./keys";

export function useCards(deckId: string) {
  const repository = useCardRepository();
  return useQuery({
    queryKey: cardKeys.byDeck(deckId),
    queryFn: async () => repository.listByDeck(deckId),
  });
}

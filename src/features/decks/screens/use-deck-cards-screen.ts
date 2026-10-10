import { router } from "expo-router";
import { useCallback, useState } from "react";

import { newestFirst } from "@/domain/cards-list";
import { matches } from "@/domain/text";
import { useCards } from "@/features/cards";
import type { Deck } from "@/features/decks";

export function useDeckCardsScreen(deck: Deck) {
  const { data: cards } = useCards(deck.id);
  const [query, setQuery] = useState("");
  const all = cards ? newestFirst(cards) : undefined;
  const rows = all ? all.filter((c) => matches(query, c.front, c.back)) : [];

  const goBack = useCallback(() => {
    router.dismissTo(`/decks/${deck.id}`);
  }, [deck.id]);

  const addCard = useCallback(() => {
    router.push(`/decks/${deck.id}/cards/new`);
  }, [deck.id]);

  return { all, rows, query, setQuery, goBack, addCard };
}

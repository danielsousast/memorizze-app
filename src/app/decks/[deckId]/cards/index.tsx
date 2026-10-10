import { useLocalSearchParams } from "expo-router";

import { DeckCardsScreen } from "@/features/decks/screens/deck-cards-screen";

export default function DeckCardsRoute() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  return <DeckCardsScreen deckId={deckId} />;
}

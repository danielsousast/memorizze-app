import { useLocalSearchParams } from "expo-router";

import { DeckScreen } from "@/features/decks/screens/deck-screen";

export default function DeckRoute() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  return <DeckScreen deckId={deckId} />;
}

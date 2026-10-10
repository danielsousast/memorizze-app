import { useLocalSearchParams } from "expo-router";

import { DeckFormScreen } from "@/features/decks/screens/deck-form-screen";

export default function EditDeckRoute() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  return <DeckFormScreen deckId={deckId} />;
}

import { useLocalSearchParams } from "expo-router";

import { CardEditorScreen } from "@/features/cards/screens/card-editor-screen";

export default function NewCardRoute() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  return <CardEditorScreen deckId={deckId} />;
}

import { useLocalSearchParams } from "expo-router";

import { CardEditorScreen } from "@/features/cards/screens/card-editor-screen";

export default function EditCardRoute() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  return <CardEditorScreen cardId={cardId} />;
}

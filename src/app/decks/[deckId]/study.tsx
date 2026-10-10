import { useLocalSearchParams } from "expo-router";

import { StudyScreen } from "@/features/study/screens/study-screen";

export default function StudyDeckRoute() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  return <StudyScreen deckId={deckId} />;
}

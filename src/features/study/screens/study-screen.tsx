import { router } from "expo-router";

import { NotFound } from "@/components/not-found";
import { Screen } from "@/components/screen";

import { useStudyQueue } from "../index";
import { SessionView } from "./session-view";

type Props = { deckId?: string };

function goHome() {
  router.dismissTo("/");
}

export function StudyScreen({ deckId }: Props) {
  const { data: queue, isPending } = useStudyQueue(deckId);
  // LOAD-01: only the frame until the queue is read.
  if (isPending) return <Screen testID="study-screen">{null}</Screen>;
  if (queue === null || queue === undefined) {
    return (
      <Screen testID="study-screen">
        <NotFound title="Baralho não encontrado" actionLabel="Voltar ao início" onAction={goHome} />
      </Screen>
    );
  }
  // Empty queue (phase `empty`) arrives in T10.
  if (queue.length === 0) return <Screen testID="study-screen">{null}</Screen>;
  return (
    <Screen testID="study-screen">
      <SessionView cards={queue} />
    </Screen>
  );
}

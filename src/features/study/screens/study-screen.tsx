import { router } from "expo-router";
import { useState } from "react";

import { NotFound } from "@/components/not-found";
import { Screen } from "@/components/screen";

import { useStudyQueue } from "../index";
import { EmptyView } from "./empty-view";
import { SessionView } from "./session-view";

type Props = { deckId?: string };

function goHome() {
  router.dismissTo("/");
}

export function StudyScreen({ deckId }: Props) {
  const { data, isPending } = useStudyQueue(deckId);
  // QUE-02: the queue is a snapshot; later refetches (after answers) must not replace it.
  const [queue, setQueue] = useState(data);
  if (queue === undefined && data !== undefined) setQueue(data);
  // LOAD-01: only the frame until the queue is read.
  if (isPending) return <Screen testID="study-screen">{null}</Screen>;
  if (queue === null || queue === undefined) {
    return (
      <Screen testID="study-screen">
        <NotFound title="Baralho não encontrado" actionLabel="Voltar ao início" onAction={goHome} />
      </Screen>
    );
  }
  if (queue.length === 0) {
    return (
      <Screen testID="study-screen">
        <EmptyView deckId={deckId} />
      </Screen>
    );
  }
  return (
    <Screen testID="study-screen">
      <SessionView cards={queue} />
    </Screen>
  );
}

import { router } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";

import { PREVIEW_LIMIT, newestFirst, previewCards } from "@/domain/cards-list";
import { plural } from "@/domain/text";
import { cardStage } from "@/domain/stage";
import { useCards } from "@/features/cards";
import type { Deck, useDeleteDeck } from "@/features/decks";

import { deleteDeckMessage } from "./deck-messages";

export function goHome() {
  router.dismissTo("/");
}

export function useDeckScreen(deck: Deck, remove: ReturnType<typeof useDeleteDeck>) {
  const { data: cards } = useCards(deck.id);
  const all = cards ? newestFirst(cards) : undefined;
  const rows = cards ? previewCards(cards) : [];
  const showAll = (cards?.length ?? 0) > PREVIEW_LIMIT;
  const matureCount = cards ? cards.filter((c) => cardStage(c) === "mature").length : 0;
  const studyLabel =
    deck.dueCount > 0 ? `Estudar · ${plural(deck.dueCount, "cartão", "cartões")}` : "Estudar";

  const deleteDeck = useCallback(() => {
    remove.mutate(deck.id, { onSuccess: goHome });
  }, [remove, deck.id]);

  const confirmDelete = useCallback(() => {
    Alert.alert(`Excluir “${deck.name}”?`, deleteDeckMessage(deck.cardCount), [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: deleteDeck },
    ]);
  }, [deck.name, deck.cardCount, deleteDeck]);

  const openOptions = useCallback(() => {
    Alert.alert(deck.name, undefined, [
      { text: "Editar baralho", onPress: () => router.push(`/decks/${deck.id}/edit`) },
      { text: "Excluir baralho", style: "destructive", onPress: confirmDelete },
      { text: "Cancelar", style: "cancel" },
    ]);
  }, [deck.name, deck.id, confirmDelete]);

  const study = useCallback(() => {
    router.push(`/decks/${deck.id}/study`);
  }, [deck.id]);

  const seeAll = useCallback(() => {
    router.push(`/decks/${deck.id}/cards`);
  }, [deck.id]);

  const addCard = useCallback(() => {
    router.push(`/decks/${deck.id}/cards/new`);
  }, [deck.id]);

  return {
    all,
    rows,
    showAll,
    seeAll,
    matureCount,
    studyLabel,
    study,
    addCard,
    openOptions,
    goHome,
  };
}

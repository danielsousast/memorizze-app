import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import type { SheetAction } from "@/components/bottom-sheet";
import { useToast } from "@/components/toast-provider";
import { PREVIEW_LIMIT, newestFirst, previewCards } from "@/domain/cards-list";
import { plural } from "@/domain/text";
import { cardStage } from "@/domain/stage";
import { useCards } from "@/features/cards";
import { useResetDeckProgress, type Deck, type useDeleteDeck } from "@/features/decks";

import { deckSheetSubtitle, deleteDeckMessage } from "./deck-messages";

const RESET_DONE = "Progresso redefinido";
const RESET_ERROR = "Não foi possível redefinir o progresso";
const DELETE_DONE = "Baralho excluído";
const DELETE_ERROR = "Não foi possível excluir o baralho";

export function goHome() {
  router.dismissTo("/");
}

export function useDeckScreen(deck: Deck, remove: ReturnType<typeof useDeleteDeck>) {
  const { data: cards } = useCards(deck.id);
  const reset = useResetDeckProgress();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const all = cards ? newestFirst(cards) : undefined;
  const rows = cards ? previewCards(cards) : [];
  const showAll = (cards?.length ?? 0) > PREVIEW_LIMIT;
  const matureCount = cards ? cards.filter((c) => cardStage(c) === "mature").length : 0;
  const studyLabel =
    deck.dueCount > 0 ? `Estudar · ${plural(deck.dueCount, "cartão", "cartões")}` : "Estudar";

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const cancelDelete = useCallback(() => setDeleteOpen(false), []);

  const addCard = useCallback(() => {
    router.push(`/decks/${deck.id}/cards/new`);
  }, [deck.id]);

  const editDeck = useCallback(() => {
    router.push(`/decks/${deck.id}/edit`);
  }, [deck.id]);

  const resetProgress = useCallback(() => {
    reset.mutate(deck.id, {
      onSuccess: () => toast.show({ message: RESET_DONE }),
      onError: () => toast.show({ message: RESET_ERROR }),
    });
  }, [reset, deck.id, toast]);

  const askDelete = useCallback(() => setDeleteOpen(true), []);

  // The dialog is a Modal and covers the toast, so it closes before the delete starts.
  const confirmDelete = useCallback(() => {
    setDeleteOpen(false);
    remove.mutate(deck.id, {
      onSuccess: () => {
        toast.show({ message: DELETE_DONE });
        goHome();
      },
      onError: () => toast.show({ message: DELETE_ERROR }),
    });
  }, [remove, deck.id, toast]);

  const sheetActions = useMemo<SheetAction[]>(
    () => [
      { label: "Adicionar cartão", icon: "plus", onPress: addCard },
      {
        label: "Redefinir progresso",
        subtitle: "Todos os cartões voltam a ser novos",
        icon: "reset",
        onPress: resetProgress,
      },
      { label: "Excluir baralho", icon: "trash", destructive: true, onPress: askDelete },
    ],
    [addCard, resetProgress, askDelete],
  );
  const sheetSubtitle = deckSheetSubtitle(deck.cardCount, deck.dueCount);
  const deleteMessage = deleteDeckMessage(deck.name, deck.cardCount);

  const study = useCallback(() => {
    router.push(`/decks/${deck.id}/study`);
  }, [deck.id]);

  const seeAll = useCallback(() => {
    router.push(`/decks/${deck.id}/cards`);
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
    editDeck,
    menuOpen,
    openMenu,
    closeMenu,
    sheetActions,
    sheetSubtitle,
    deleteOpen,
    deleteMessage,
    confirmDelete,
    cancelDelete,
    goHome,
  };
}

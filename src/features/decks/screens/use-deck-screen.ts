import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import type { SheetAction } from "@/components/bottom-sheet";
import { useToast } from "@/components/toast-provider";
import { PREVIEW_LIMIT, newestFirst, previewCards } from "@/domain/cards-list";
import { cardStage } from "@/domain/stage";
import { t } from "@/lib/i18n";
import { useCards } from "@/features/cards";
import { useResetDeckProgress, type Deck, type useDeleteDeck } from "@/features/decks";

import { deckSheetSubtitle, deleteDeckMessage } from "./deck-messages";

export function goHome() {
  router.dismissTo("/");
}

function studyButtonLabel(dueCount: number): string {
  if (dueCount <= 0) return t("deck.detail.study");
  return t("deck.detail.studyDue", { cards: t("plurals.card", { count: dueCount }) });
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
  const studyLabel = studyButtonLabel(deck.dueCount);

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
      onSuccess: () => toast.show({ message: t("deck.detail.resetDone") }),
      onError: () => toast.show({ message: t("deck.detail.resetFailed") }),
    });
  }, [reset, deck.id, toast]);

  const askDelete = useCallback(() => setDeleteOpen(true), []);

  // The dialog is a Modal and covers the toast, so it closes before the delete starts.
  const confirmDelete = useCallback(() => {
    setDeleteOpen(false);
    remove.mutate(deck.id, {
      onSuccess: () => {
        toast.show({ message: t("deck.detail.deleteDone") });
        goHome();
      },
      onError: () => toast.show({ message: t("deck.detail.deleteFailed") }),
    });
  }, [remove, deck.id, toast]);

  const sheetActions = useMemo<SheetAction[]>(
    () => [
      { label: t("deck.detail.addCard"), icon: "plus", onPress: addCard },
      { label: t("deck.detail.edit"), icon: "pencil", onPress: editDeck },
      {
        label: t("deck.detail.reset"),
        subtitle: t("deck.detail.resetHint"),
        icon: "reset",
        onPress: resetProgress,
      },
      { label: t("deck.detail.delete"), icon: "trash", destructive: true, onPress: askDelete },
    ],
    [addCard, editDeck, resetProgress, askDelete],
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

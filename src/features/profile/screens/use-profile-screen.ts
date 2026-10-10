import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { canStep, stepGoal } from "@/domain/goal";
import { signOutMessage } from "@/domain/labels";

import { useDataCounts } from "../usecases/use-data-counts";
import { useProfile } from "../usecases/use-profile";
import { useReviewsToday } from "../usecases/use-reviews-today";
import { useSignOut } from "../usecases/use-sign-out";
import { useStats } from "../usecases/use-stats";
import { useUpdateProfile } from "../usecases/use-update-profile";
import { GENERIC_ERROR } from "./name-errors";

const SIGN_OUT_ERROR = "Não foi possível apagar os dados.";

function editName() {
  router.push("/edit-name");
}

function openSettings() {
  router.push("/settings");
}

export function useProfileScreen() {
  const profile = useProfile().data;
  const reviewsQuery = useReviewsToday();
  const reviewsToday = reviewsQuery.data ?? 0;
  const { refetch: refetchReviews } = reviewsQuery;
  const statsQuery = useStats();
  const { refetch: refetchStats } = statsQuery;
  const countsQuery = useDataCounts();
  const { refetch: refetchCounts } = countsQuery;
  const signOut = useSignOut();
  const toast = useToast();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const update = useUpdateProfile();
  const [error, setError] = useState<string>();
  const busy = useRef(false);

  // HOM-07: numbers follow the recorded reviews whenever the screen refocuses.
  useFocusEffect(
    useCallback(() => {
      void refetchReviews();
      void refetchStats();
      void refetchCounts();
    }, [refetchReviews, refetchStats, refetchCounts]),
  );

  const step = useCallback(
    async (direction: 1 | -1) => {
      if (!profile || busy.current) return;
      busy.current = true;
      setError(undefined);
      try {
        await update.mutateAsync({ dailyGoal: stepGoal(profile.dailyGoal, direction) });
      } catch {
        setError(GENERIC_ERROR);
      } finally {
        busy.current = false;
      }
    },
    [profile, update],
  );

  const decrease = useCallback(() => step(-1), [step]);
  const increase = useCallback(() => step(1), [step]);

  const requestSignOut = useCallback(() => setSignOutOpen(true), []);
  const cancelSignOut = useCallback(() => setSignOutOpen(false), []);
  // The dialog is a Modal and covers the toast, so it closes before the wipe starts.
  const confirmSignOut = useCallback(() => {
    setSignOutOpen(false);
    signOut.mutate(undefined, { onError: () => toast.show({ message: SIGN_OUT_ERROR }) });
  }, [signOut, toast]);

  return {
    profile,
    reviewsToday,
    stats: statsQuery.data,
    statsError: statsQuery.isError,
    error,
    canDecrease: profile ? canStep(profile.dailyGoal, -1) : false,
    canIncrease: profile ? canStep(profile.dailyGoal, 1) : false,
    decrease,
    increase,
    editName,
    openSettings,
    signOutOpen,
    signOutMessage: signOutMessage(countsQuery.data?.decks ?? 0, countsQuery.data?.cards ?? 0),
    requestSignOut,
    cancelSignOut,
    confirmSignOut,
  };
}

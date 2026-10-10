import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { canStep, stepGoal } from "@/domain/goal";

import { useProfile } from "../usecases/use-profile";
import { useReviewsToday } from "../usecases/use-reviews-today";
import { useStats } from "../usecases/use-stats";
import { useUpdateProfile } from "../usecases/use-update-profile";
import { GENERIC_ERROR } from "./name-errors";

function editName() {
  router.push("/edit-name");
}

// F5 (settings) owns the destination; until then the gear is wired but inert.
function openSettings() {}

export function useProfileScreen() {
  const profile = useProfile().data;
  const reviewsQuery = useReviewsToday();
  const reviewsToday = reviewsQuery.data ?? 0;
  const { refetch: refetchReviews } = reviewsQuery;
  const statsQuery = useStats();
  const { refetch: refetchStats } = statsQuery;
  const update = useUpdateProfile();
  const [error, setError] = useState<string>();
  const busy = useRef(false);

  // HOM-07: numbers follow the recorded reviews whenever the screen refocuses.
  useFocusEffect(
    useCallback(() => {
      void refetchReviews();
      void refetchStats();
    }, [refetchReviews, refetchStats]),
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
  };
}

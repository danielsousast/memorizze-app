import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { canStep, stepGoal } from "@/domain/goal";
import { signOutMessage } from "@/domain/labels";
import { useExportBackup, useMarkBackedUp } from "@/features/backup";
import { t } from "@/lib/i18n";

import { useDataCounts } from "../usecases/use-data-counts";
import { useProfile } from "../usecases/use-profile";
import { useReviewsToday } from "../usecases/use-reviews-today";
import { useSignOut } from "../usecases/use-sign-out";
import { useStats } from "../usecases/use-stats";
import { useUpdateProfile } from "../usecases/use-update-profile";
import { genericError } from "./name-errors";

// iOS ignores a share sheet presented while the Modal is still dismissing.
const MODAL_CLOSE_MS = 500;

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
  const exportBackup = useExportBackup();
  const markBackedUp = useMarkBackedUp();
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
        setError(genericError());
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
    signOut.mutate(undefined, { onError: () => toast.show({ message: t("profile.signOutError") }) });
  }, [signOut, toast]);

  // SOUT-07: the share sheet also sits under the Modal, so the dialog closes and comes back after the export.
  const backupFirst = useCallback(() => {
    setSignOutOpen(false);
    const fail = () => toast.show({ message: t("backupScreen.exportError") });
    const reopen = () => setSignOutOpen(true);
    const record = ({ at }: { at: Date }) => markBackedUp.mutate(at, { onSuccess: reopen, onError: fail });
    setTimeout(
      () => exportBackup.mutate(undefined, { onSuccess: record, onError: fail }),
      MODAL_CLOSE_MS,
    );
  }, [exportBackup, markBackedUp, toast]);

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
    backupFirst,
    requestSignOut,
    cancelSignOut,
    confirmSignOut,
  };
}

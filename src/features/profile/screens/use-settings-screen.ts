import Constants from "expo-constants";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import type { SegmentOption } from "@/components/segmented-control";
import type { SheetAction } from "@/components/bottom-sheet";
import { settingsBackupSubtitle } from "@/domain/backup";
import { useLastBackup } from "@/features/backup";
import { useToast } from "@/components/toast-provider";
import {
  NEW_CARDS_OPTIONS,
  THEME_OPTIONS,
  newCardsLabel,
  themeLabel,
  type NewCardsLimit,
  type ThemePreference,
} from "@/domain/preferences";

import { useProfile } from "../usecases/use-profile";
import { useUpdateProfile } from "../usecases/use-update-profile";

const SAVE_ERROR = "Não foi possível salvar.";

const THEME_ICONS = { light: "sun", dark: "moon" } as const;

const themeSegments: SegmentOption<ThemePreference>[] = THEME_OPTIONS.map((value) => ({
  value,
  label: themeLabel[value],
  icon: value === "system" ? undefined : THEME_ICONS[value],
}));

function openBackup() {
  router.push("/backup");
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/profile");
}

export function useSettingsScreen() {
  const profile = useProfile().data;
  const lastBackup = useLastBackup().data;
  const update = useUpdateProfile();
  const toast = useToast();
  const [limitOpen, setLimitOpen] = useState(false);

  const showError = useCallback(() => toast.show({ message: SAVE_ERROR }), [toast]);

  const selectTheme = useCallback(
    (themePreference: ThemePreference) => update.mutate({ themePreference }, { onError: showError }),
    [update, showError],
  );

  const openLimit = useCallback(() => setLimitOpen(true), []);
  const closeLimit = useCallback(() => setLimitOpen(false), []);

  const selectedLimit = profile?.newCardsPerDay;
  const limitActions = useMemo<SheetAction[]>(
    () =>
      NEW_CARDS_OPTIONS.map((newCardsPerDay: NewCardsLimit) => ({
        label: newCardsLabel(newCardsPerDay),
        selected: newCardsPerDay === selectedLimit,
        onPress: () => update.mutate({ newCardsPerDay }, { onError: showError }),
      })),
    [selectedLimit, update, showError],
  );

  return {
    themeSegments,
    theme: profile?.themePreference ?? "system",
    selectTheme,
    newCardsValue: newCardsLabel(selectedLimit ?? null),
    limitOpen,
    limitActions,
    openLimit,
    closeLimit,
    backupSubtitle: settingsBackupSubtitle(lastBackup?.last ?? null),
    openBackup,
    version: Constants.expoConfig?.version,
    goBack,
  };
}

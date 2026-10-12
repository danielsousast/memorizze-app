import Constants from "expo-constants";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import type { SegmentOption } from "@/components/segmented-control";
import type { SheetAction } from "@/components/bottom-sheet";
import { settingsBackupSubtitle } from "@/domain/backup";
import { useLastBackup } from "@/features/backup";
import { useUpdateReminder, type ReminderOutcome } from "@/features/reminder";
import { openSystemSettings } from "@/lib/notifications";
import { useToast } from "@/components/toast-provider";
import {
  NEW_CARDS_OPTIONS,
  THEME_OPTIONS,
  newCardsLabel,
  themeLabel,
  type NewCardsLimit,
  type ThemePreference,
} from "@/domain/preferences";
import { DEFAULT_REMINDER_HOUR, REMINDER_HOURS, hourLabel } from "@/domain/reminder";

import { useProfile } from "../usecases/use-profile";
import { useUpdateProfile } from "../usecases/use-update-profile";

const SAVE_ERROR = "Não foi possível salvar.";
const NOTIFICATIONS_DENIED = "Ative as notificações nas configurações do aparelho.";

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
  const reminder = useUpdateReminder();
  const toast = useToast();
  const [limitOpen, setLimitOpen] = useState(false);
  const [hourOpen, setHourOpen] = useState(false);

  const showError = useCallback(() => toast.show({ message: SAVE_ERROR }), [toast]);

  const reminderEnabled = profile?.reminderEnabled ?? false;
  const reminderHour = profile?.reminderHour;
  const busy = update.isPending || reminder.isPending;

  const showOutcome = useCallback(
    (outcome: ReminderOutcome) => {
      if (outcome !== "denied") return;
      toast.show({
        message: NOTIFICATIONS_DENIED,
        action: { label: "Abrir ajustes", onPress: openSystemSettings },
      });
    },
    [toast],
  );

  const toggleReminder = useCallback(
    (enabled: boolean) => {
      if (busy) return;
      reminder.mutate({ enabled }, { onSuccess: showOutcome, onError: showError });
    },
    [busy, reminder, showOutcome, showError],
  );

  const openHour = useCallback(() => {
    if (!busy && reminderEnabled) setHourOpen(true);
  }, [busy, reminderEnabled]);
  const closeHour = useCallback(() => setHourOpen(false), []);

  const hourActions = useMemo<SheetAction[]>(
    () =>
      REMINDER_HOURS.map((hour) => ({
        label: hourLabel(hour),
        selected: hour === reminderHour,
        onPress: () => reminder.mutate({ hour }, { onError: showError }),
      })),
    [reminderHour, reminder, showError],
  );

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
    reminderEnabled,
    reminderHourLabel: hourLabel(reminderHour ?? DEFAULT_REMINDER_HOUR),
    toggleReminder,
    hourOpen,
    hourActions,
    openHour,
    closeHour,
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

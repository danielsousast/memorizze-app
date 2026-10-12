import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

import { REMINDER_BODY, REMINDER_TITLE } from "@/domain/reminder";
import type { ReminderScheduler } from "@/features/reminder/interfaces";

// One fixed id keeps at most one reminder scheduled (REM-10). It names the Android channel too.
const REMINDER_ID = "daily-reminder";
const CHANNEL_NAME = "Lembrete diário";

function isGranted(permissions: Notifications.NotificationPermissionsStatus): boolean {
  return (
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(REMINDER_ID, {
      name: CHANNEL_NAME,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (isGranted(current) || !current.canAskAgain) return isGranted(current);
  return isGranted(await Notifications.requestPermissionsAsync());
}

async function hasPermission(): Promise<boolean> {
  return isGranted(await Notifications.getPermissionsAsync());
}

async function cancel(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}

async function schedule(hour: number): Promise<void> {
  await cancel();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: REMINDER_TITLE, body: REMINDER_BODY },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: REMINDER_ID,
    },
  });
}

function openSystemSettings(): Promise<void> {
  return Linking.openSettings();
}

function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const notificationsScheduler: ReminderScheduler = { ensurePermission, hasPermission, schedule, cancel };

export {
  cancel,
  configureNotificationHandler,
  ensurePermission,
  hasPermission,
  notificationsScheduler,
  openSystemSettings,
  schedule,
};

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { REMINDER_BODY, REMINDER_TITLE } from "@/domain/reminder";

import {
  cancel,
  configureNotificationHandler,
  ensurePermission,
  hasPermission,
  schedule,
} from "./notifications";

jest.mock("expo-notifications", () => ({
  AndroidImportance: { DEFAULT: 5 },
  IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
  SchedulableTriggerInputTypes: { DAILY: "daily" },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

const mocked = jest.mocked(Notifications);

function status(granted: boolean, canAskAgain: boolean, iosStatus?: number) {
  return {
    granted,
    canAskAgain,
    status: granted ? "granted" : "denied",
    expires: "never",
    ios: iosStatus === undefined ? undefined : { status: iosStatus },
  } as unknown as Notifications.NotificationPermissionsStatus;
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.replaceProperty(Platform, "OS", "ios");
});

describe("ensurePermission", () => {
  it("REM-20 creates the Android channel before asking for permission", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const calls: string[] = [];
    mocked.setNotificationChannelAsync.mockImplementation(async () => {
      calls.push("channel");
      return null;
    });
    mocked.getPermissionsAsync.mockImplementation(async () => {
      calls.push("get");
      return status(false, true);
    });
    mocked.requestPermissionsAsync.mockImplementation(async () => {
      calls.push("request");
      return status(true, true);
    });

    await expect(ensurePermission()).resolves.toBe(true);

    expect(calls).toEqual(["channel", "get", "request"]);
    expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith(
      "daily-reminder",
      expect.objectContaining({ name: "Lembrete diário" }),
    );
  });

  it("does not create a channel on iOS", async () => {
    mocked.getPermissionsAsync.mockResolvedValue(status(true, true));

    await ensurePermission();

    expect(mocked.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it("REM-16 returns false without asking when the system will not ask again", async () => {
    mocked.getPermissionsAsync.mockResolvedValue(status(false, false));

    await expect(ensurePermission()).resolves.toBe(false);

    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("REM-15 returns true when the user grants and false when the user denies", async () => {
    mocked.getPermissionsAsync.mockResolvedValue(status(false, true));
    mocked.requestPermissionsAsync.mockResolvedValueOnce(status(true, true));
    await expect(ensurePermission()).resolves.toBe(true);

    mocked.requestPermissionsAsync.mockResolvedValueOnce(status(false, false));
    await expect(ensurePermission()).resolves.toBe(false);
  });

  it("does not ask again when the permission is already granted", async () => {
    mocked.getPermissionsAsync.mockResolvedValue(status(true, true));

    await expect(ensurePermission()).resolves.toBe(true);

    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe("hasPermission", () => {
  it("reads the permission without asking", async () => {
    mocked.getPermissionsAsync.mockResolvedValue(status(false, true));

    await expect(hasPermission()).resolves.toBe(false);

    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("CONTRACT counts iOS PROVISIONAL as granted, and DENIED or NOT_DETERMINED without canAskAgain as not", async () => {
    mocked.getPermissionsAsync.mockResolvedValueOnce(status(false, true, 3));
    await expect(hasPermission()).resolves.toBe(true);

    mocked.getPermissionsAsync.mockResolvedValueOnce(status(false, false, 1));
    await expect(hasPermission()).resolves.toBe(false);

    mocked.getPermissionsAsync.mockResolvedValueOnce(status(false, false, 0));
    await expect(hasPermission()).resolves.toBe(false);
  });
});

describe("schedule", () => {
  it("REM-07 schedules a daily trigger at the hour with the fixed title and body", async () => {
    await schedule(19);

    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: "daily-reminder",
      content: { title: REMINDER_TITLE, body: REMINDER_BODY },
      trigger: { type: "daily", hour: 19, minute: 0, channelId: "daily-reminder" },
    });
  });

  it("REM-10 cancels the fixed identifier before scheduling", async () => {
    const calls: string[] = [];
    mocked.cancelScheduledNotificationAsync.mockImplementation(async (id) => {
      calls.push(`cancel:${id}`);
    });
    mocked.scheduleNotificationAsync.mockImplementation(async (request) => {
      calls.push(`schedule:${request.identifier}`);
      return "daily-reminder";
    });

    await schedule(8);

    expect(calls).toEqual(["cancel:daily-reminder", "schedule:daily-reminder"]);
  });
});

describe("cancel", () => {
  it("cancels the fixed identifier", async () => {
    await cancel();

    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith("daily-reminder");
  });
});

describe("configureNotificationHandler", () => {
  it("REM-08 shows a banner and list entry without sound or badge", async () => {
    configureNotificationHandler();

    const { handleNotification } = mocked.setNotificationHandler.mock.calls[0][0]!;
    await expect(handleNotification({} as Notifications.Notification)).resolves.toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });
});

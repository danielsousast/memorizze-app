import Realm from "realm";

// The real module warns on import under Jest; tests inject a fake scheduler instead.
jest.mock("expo-notifications", () => ({
  AndroidImportance: { DEFAULT: 5 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { DAILY: "daily" },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

afterAll(() => {
  Realm.shutdown();
});

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "pt-BR" }]),
}));

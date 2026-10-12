import { act, render, screen } from "@testing-library/react-native";
import { getLocales } from "expo-localization";
import { AppState } from "react-native";

import { i18n } from "@/lib/i18n";

import RootLayout from "@/app/_layout";

const mockMounts = jest.fn();

jest.mock("@expo-google-fonts/plus-jakarta-sans", () => ({
  PlusJakartaSans_500Medium: 1,
  PlusJakartaSans_600SemiBold: 2,
  PlusJakartaSans_700Bold: 3,
  PlusJakartaSans_800ExtraBold: 4,
  useFonts: () => [true, null],
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock("@realm/react", () => ({
  RealmProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/components/toast-provider/toast-provider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/db", () => ({
  realmConfig: {},
  RealmErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/navigation/root-stack", () => {
  const react = jest.requireActual<typeof import("react")>("react");
  const { Text: MockText } = jest.requireActual<typeof import("react-native")>("react-native");
  const { i18n: mockI18n } = jest.requireActual<typeof import("@/lib/i18n")>("@/lib/i18n");
  return {
    RootStack: function MockRootStack() {
      react.useEffect(() => mockMounts(), []);
      return react.createElement(MockText, null, mockI18n.t("common.cancel"));
    },
  };
});

afterEach(() => {
  (getLocales as jest.Mock).mockReturnValue([{ languageTag: "pt-BR" }]);
  i18n.locale = "pt-BR";
  mockMounts.mockClear();
});

describe("RootLayout locale (I18NS-09)", () => {
  it("remounts the root stack in the new language when the device locale changes", async () => {
    let onChange: (state: string) => void = () => {};
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
      onChange = listener as (state: string) => void;
      return { remove: jest.fn() };
    });

    await render(<RootLayout />);
    expect(screen.getByText("Cancelar")).toBeTruthy();
    expect(mockMounts).toHaveBeenCalledTimes(1);

    (getLocales as jest.Mock).mockReturnValue([{ languageTag: "en-US" }]);
    await act(async () => onChange("active"));

    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(mockMounts).toHaveBeenCalledTimes(2);
  });
});

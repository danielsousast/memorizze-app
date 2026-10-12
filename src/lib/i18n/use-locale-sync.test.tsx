import { act, render, screen } from "@testing-library/react-native";
import { getLocales } from "expo-localization";
import { AppState, Text, type AppStateStatus } from "react-native";

import { i18n, t } from "./index";
import { useLocaleSync } from "./use-locale-sync";

const mockGetLocales = getLocales as jest.Mock;

function Greeting() {
  return <Text>{t("common.cancel")}</Text>;
}

function Screen() {
  const locale = useLocaleSync();
  return <Greeting key={locale} />;
}

let emit: (state: AppStateStatus) => void;

beforeEach(() => {
  jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
    emit = listener as typeof emit;
    return { remove: jest.fn() };
  });
  mockGetLocales.mockReturnValue([{ languageTag: "pt-BR" }]);
  i18n.locale = "pt-BR";
});

afterEach(() => jest.restoreAllMocks());

describe("useLocaleSync", () => {
  it("updates the locale when the app becomes active", async () => {
    await render(<Screen />);
    mockGetLocales.mockReturnValue([{ languageTag: "en-US" }]);

    await act(async () => emit("active"));

    expect(i18n.locale).toBe("en");
  });

  it("ignores other app states", async () => {
    await render(<Screen />);
    mockGetLocales.mockReturnValue([{ languageTag: "en-US" }]);

    await act(async () => emit("background"));

    expect(i18n.locale).toBe("pt-BR");
  });

  it("re-renders a mounted screen in the new language on active (I18NS-09)", async () => {
    await render(<Screen />);
    expect(screen.getByText("Cancelar")).toBeTruthy();
    mockGetLocales.mockReturnValue([{ languageTag: "en-US" }]);

    await act(async () => emit("background"));
    expect(screen.queryByText("Cancel")).toBeNull();

    await act(async () => emit("active"));
    expect(screen.getByText("Cancel")).toBeTruthy();
  });
});

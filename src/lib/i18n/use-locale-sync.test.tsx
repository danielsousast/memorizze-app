import { render } from "@testing-library/react-native";
import { getLocales } from "expo-localization";
import { AppState, type AppStateStatus } from "react-native";

import { i18n } from "./index";
import { useLocaleSync } from "./use-locale-sync";

const mockGetLocales = getLocales as jest.Mock;

function Probe() {
  useLocaleSync();
  return null;
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
    await render(<Probe />);
    mockGetLocales.mockReturnValue([{ languageTag: "en-US" }]);

    emit("active");

    expect(i18n.locale).toBe("en");
  });

  it("ignores other app states", async () => {
    await render(<Probe />);
    mockGetLocales.mockReturnValue([{ languageTag: "en-US" }]);

    emit("background");

    expect(i18n.locale).toBe("pt-BR");
  });
});

import appJson from "../../../app.json";

describe("app.json expo-localization plugin", () => {
  it("declares pt-BR and en for iOS and Android", () => {
    const plugin = appJson.expo.plugins.find(
      (entry) => Array.isArray(entry) && entry[0] === "expo-localization",
    ) as [string, { supportedLocales: Record<string, string[]> }];

    expect(plugin[1].supportedLocales).toEqual({
      ios: ["pt-BR", "en"],
      android: ["pt-BR", "en"],
    });
  });
});

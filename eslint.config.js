// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // AD-001: inside a feature, only the repository and adapters touch Realm.
    files: ["src/features/**/*.{ts,tsx}"],
    ignores: [
      "src/features/*/repository.ts",
      "src/features/*/adapters.ts",
      "src/features/**/*.test.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["realm", "@realm/*", "@/db", "@/db/*"],
              message:
                "Only repository.ts and adapters.ts may import Realm (AD-001).",
            },
            {
              // Relative paths into src/db, e.g. "../../../db" (A-02).
              regex: "^(\\.\\.?/)+(.*/)?db(/.*)?$",
              message:
                "Only repository.ts and adapters.ts may import Realm (AD-001).",
            },
          ],
        },
      ],
    },
  },
]);

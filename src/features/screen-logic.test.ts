import { readFileSync } from "node:fs";
import { join } from "node:path";

// HOK-01..05 (AD-005): screens render; state, effects and side effects live in use-*.ts hooks.
const banned: Record<string, string[]> = {
  "study/screens/session-view.tsx": [
    "useReducer", "useRef", "useEffect", "useMemo", "BackHandler", "Alert", "@/domain/schedule", "@/domain/session",
  ],
  "cards/screens/card-editor-screen.tsx": ["useState", "useRef", "Alert", "AppError", "router"],
  "decks/screens/deck-screen.tsx": ["Alert", "matches", "cardStage", "useState"],
  "decks/screens/deck-cards-screen.tsx": ["Alert", "matches", "cardStage", "useState"],
  "decks/screens/deck-form-screen.tsx": ["useState", "useRef"],
  "profile/screens/edit-name-screen.tsx": ["useState", "useRef"],
  "profile/screens/welcome-screen.tsx": ["useState", "useRef"],
  "profile/screens/settings-screen.tsx": ["useState", "useRef", "Appearance", "router", "expo-constants"],
  "profile/screens/profile-screen.tsx": ["@/domain/goal", "useRef", "useState"],
};

describe.each(Object.entries(banned))("%s", (file, names) => {
  const source = readFileSync(join(__dirname, file), "utf8");
  it.each(names)("does not use %s", (name) => {
    expect(source).not.toMatch(new RegExp(`\\b${name.replace(/[/@]/g, "\\$&")}\\b`));
  });
});

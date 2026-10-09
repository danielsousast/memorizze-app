This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Specs & Spec-Driven Development

This project is **spec-driven**. Never write code for a feature or bug fix before it has gone through the `adaptive-spec-driven` skill.

### Source documents (read before any task)

| Document | Purpose |
| --- | --- |
| [PROJECT-SPEC.md](PROJECT-SPEC.md) | Source of truth for product scope, requirements and milestones. Every feature starts here. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Current architecture: modules, data flow, persistence. |
| [.specs/PROJECT.md](.specs/PROJECT.md) | Stack, structure, conventions and quality commands. |
| [.specs/STATE.md](.specs/STATE.md) | Project decisions and the handoff snapshot (current feature, next step). |
| `.specs/features/<feature>/` | Per-feature `spec.md`, `plan.md`, and `validation.md` (when risk requires). |
| [design/](design/) | Screen designs (light/dark) and style guide. UI must match them. |

### Mandatory workflow

1. **Always invoke the `adaptive-spec-driven` skill** for any feature, change, bug fix, or question about project status. Do not skip it, even for small changes.
2. Follow the loop: Discover (classify risk LOW/MEDIUM/HIGH/CRITICAL) → Specify → Plan → Execute → Verify. Risk sets the depth of each phase; it never removes a phase.
3. Specs are the source of truth for behavior. If reality contradicts a spec, raise a spec amendment instead of diverging silently.
4. A task is done only when its tests exist and its gate command exits 0. Never weaken or skip tests to get green.
5. Respect approval checkpoints for the risk level. Do not `git push`, deploy, or run irreversible actions without an explicit go-ahead.
6. Keep `.specs/STATE.md` updated at the end of each session (handoff).

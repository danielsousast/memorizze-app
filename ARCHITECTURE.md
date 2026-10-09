# Architecture

## Current Architecture

Expo app at the template stage. Only the router shell exists.

| Part | Path | Contents |
| --- | --- | --- |
| Root layout | `src/app/_layout.tsx` | Expo Router `Stack` navigator |
| Home route | `src/app/index.tsx` | Placeholder screen |
| Path alias | `tsconfig.json` | `@/*` → `./src/*`, `@/assets/*` → `./assets/*` |
| Compiler | `app.json` | `typedRoutes` and `reactCompiler` experiments on |

Navigation is file-based (Expo Router). No persistence, domain code or tests yet.

## Planned Architecture

Source: [PROJECT-SPEC.md](PROJECT-SPEC.md) (draft v0.1). Not implemented.

- 100% offline, local profile; no backend, login or network calls (spec §2, §8)
- Realm (`realm` + `@realm/react`) for persistence: Profile, Deck, Card, ReviewLog (spec §4)
- `src/domain/` pure logic (schedule, streak, stats, dates), importing neither Realm nor React (spec §9)
- `src/db/` schemas and repositories; screens reach the database only through hooks/repositories
- `src/features/` (decks, cards, study, profile), `src/components/`, `src/theme/`
- Streak and stats derived from `ReviewLog`, never stored
- Light/dark theme following the system

## Documentation Drift

- PROJECT-SPEC §3/§9 plans React Navigation and a `src/navigation/` folder; the repo uses Expo Router with routes in `src/app/` (`AGENTS.md`, `package.json`). Code wins until the user decides otherwise.
- PROJECT-SPEC §13 leaves "Expo or RN CLI" open; the repo is Expo SDK 57 (`package.json`).

## Open Architectural Questions

- Limit of new cards per day (spec §13)
- UI language: pt-BR only or pt-BR + en (spec §13)

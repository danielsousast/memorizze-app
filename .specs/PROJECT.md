# Project: Memorizze

## Overview

Offline mobile flashcard app with spaced repetition. The user creates decks and cards, studies what is due each day and tracks progress (stats, streak) in a local profile.

## Goals

- Portfolio piece: clean, tested, well-documented code outweighs feature count (PROJECT-SPEC §1).
- MVP scope: local profile, deck/card CRUD, spaced-repetition study session, stats and streak.
- Out of scope: login, backend, sync, media on cards, import/export, push notifications, multiple profiles.

## Stack

| Area | Technology | Source |
| --- | --- | --- |
| Framework | Expo SDK 57 (`expo ~57.0.27`), React Native 0.86.3, React 19.2.3 | `package.json` |
| Language | TypeScript ~6.0.3, `strict` | `package.json`, `tsconfig.json` |
| Navigation | Expo Router ~57.0.25 (file-based, `typedRoutes`) | `package.json`, `app.json` |
| Compiler | React Compiler enabled | `app.json` |
| Package manager | npm | `package-lock.json` |
| Database | Realm (`realm`, `@realm/react`), local only; requires development build | PROJECT-SPEC §3; `src/db/` |
| Tests | Jest (`jest-expo`) + React Native Testing Library | `package.json`; see [TESTING.md](TESTING.md) |

## Repository Structure

| Path | Contents |
| --- | --- |
| `src/app/` | Expo Router routes (`_layout.tsx`, `index.tsx`) |
| `assets/` | Icons, splash and images |
| `design/` | Screen mockups (PNG, light and dark) and style guide |
| `example/` | Leftover from the removed reset script; unused, excluded from `tsc` and Jest |
| `PROJECT-SPEC.md` | General app definition (draft v0.1) |

Planned layout (`src/domain`, `src/db`, `src/features`, `src/components`, `src/theme`): see [ARCHITECTURE.md](../ARCHITECTURE.md).

## Engineering Conventions

- Mobile-first, performance- and cross-platform-aware (`AGENTS.md`).
- Routes live in `src/app/`; components, hooks and utils stay outside it (`AGENTS.md`).
- Add packages with `npx expo install`, never `npm add` (`AGENTS.md`).
- Check Expo docs for the installed major version before touching Expo/RN APIs (`AGENTS.md`).
- Never hand-edit `ios/` or `android/`; configure via `app.json` and config plugins (`AGENTS.md`).
- Path alias `@/*` → `src/*` (`tsconfig.json`).
- Run lint and typecheck before declaring a task done (`AGENTS.md`).
- Accessibility labels on all buttons, touch targets ≥ 44pt; lists use `FlatList`; dates in the local timezone via one module (PROJECT-SPEC §8).

## Quality

| Check | Command | Source |
| --- | --- | --- |
| Tests | `npm test` | `package.json` (`test`) |
| Lint | `npx expo lint` | `package.json` (`lint`), `AGENTS.md` |
| Typecheck | `npx tsc --noEmit` | `AGENTS.md` |
| Start | `npx expo start` | `package.json` |

No CI workflow exists yet (PROJECT-SPEC plans GitHub Actions: lint + typecheck + tests).

## Constraints

- 100% offline; no network calls.
- Smooth with 1,000 cards in one deck.
- Light/dark theme follows the system.
- Domain logic coverage ≥ 90% (PROJECT-SPEC §10).
- Screens to implement match the PNGs in `design/`.

## Documentation Drift

- PROJECT-SPEC plans React Navigation and RN CLI as an open choice; the repo is Expo with Expo Router. See [ARCHITECTURE.md](../ARCHITECTURE.md#documentation-drift).
- PROJECT-SPEC §12 puts feature specs in `specs/`; this workflow uses `.specs/features/`.
- `package.json` still has a `reset-project` script pointing at `scripts/reset-project.js`, which was removed (commit 630285f).
- `README.md` is the unmodified create-expo-app text.

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md): architecture, modules, data flow
- [STATE.md](STATE.md): project decisions (AD-NNN) and current handoff
- [PROJECT-SPEC.md](../PROJECT-SPEC.md): product definition, data model, SM-2 rules, milestones M0–M5
- [design/](../design): screen mockups
- [AGENTS.md](../AGENTS.md): Expo agent rules

# Architecture

## Current Architecture

Expo app with the data layer for decks and cards and the screens that use it: Home, Deck, Deck form, Card editor and the study session (session, empty state, summary). Tab bar and profile are not built yet.

| Part | Path | Contents |
| --- | --- | --- |
| Root layout | `src/app/_layout.tsx` | `RealmErrorBoundary` → `RealmProvider` → `QueryClientProvider` → Expo Router `Stack` |
| Routes | `src/app/` | Thin files that read params and render a screen: `index`, `decks/[deckId]/index`, `study` and `decks/[deckId]/study` (study session), and four modals (`decks/new`, `decks/[deckId]/edit`, `decks/[deckId]/cards/new`, `cards/[cardId]/edit`), declared with `presentation: "modal"` in the root `Stack` |
| Screens | `src/features/<feature>/screens/` | One `<name>-screen.tsx` per screen ([AD-003](.specs/STATE.md#ad-003)); they use only the public hooks of `@/features/*` |
| Shared UI | `src/components/` | `Button`, `Fab`, `Badge`, `TextField`, `DeckIcon`, `Icon` (`expo-symbols`), `Screen`, `NotFound`; one file each, theme tokens, accessibility role and label, touch target ≥ 44 |
| Database | `src/db/` | Realm schemas (Profile, Deck, Card, ReviewLog), `realmConfig`, `RealmErrorBoundary` |
| Query client | `src/lib/query-client.ts` | `createQueryClient()`: `networkMode: "always"`, `retry: false`, `staleTime: Infinity` |
| Domain | `src/domain/` | Pure, no Realm or React: `errors.ts` (`AppError<C>` with a typed `code`), `dates.ts` (end of local day, `isDue`, long pt-BR date), `stage.ts` (`new` / `learning` / `mature`), `text.ts` (initials, plural, accent-insensitive search); `schedule.ts` (SM-2, interval label), `streak.ts` (current streak), `session.ts` (in-memory session progress); `dates.ts` also has `startOfLocalDay` and `addLocalDays` |
| Features | `src/features/decks/`, `src/features/cards/`, `src/features/study/` | Repositories and React Query hooks (see [Feature modules](#feature-modules)) |
| Path alias | `tsconfig.json` | `@/*` → `./src/*`, `@/assets/*` → `./assets/*` |
| Compiler | `app.json` | `typedRoutes` and `reactCompiler` experiments on |

Navigation is file-based (Expo Router). `Deck.dueCount` is derived at read time by the deck adapter (cards due by the end of the local day, using the repository's `now`); it is never stored. Screen tests use `renderRouterWithProviders` (`src/testing/router.tsx`) with an in-memory Realm and a real `QueryClient`.

## Feature modules

Decisions: [AD-001](.specs/STATE.md#ad-001) (layout) and [AD-002](.specs/STATE.md#ad-002) (React Query over Realm).

```
src/features/<feature>/
  interfaces.ts   plain types, inputs, error codes, repository contract
  adapters.ts     Realm.Object → plain object (only when there is a conversion)
  repository.ts   createXRepository(realm, now) + useXRepository(); the only Realm access
  usecases/       one hook per file (use-*.ts) + keys.ts (query keys)
  index.ts        public API: hooks and types
```

A feature with a single use case keeps that `use-*.ts` at its root, without `usecases/`.

**Rules**

- Only `repository.ts`, `adapters.ts` and tests import `realm`, `@realm/react` or `src/db`, by any path (alias or relative). ESLint `no-restricted-imports` (`eslint.config.js`) and `src/features/architecture.test.ts` enforce it.
- Each hook makes exactly one `useQuery` or `useMutation` call, and its function calls exactly one repository method. `src/features/architecture.test.ts` enforces it.
- The repository validates, writes, and returns plain objects through the adapters. It throws `AppError` with the feature's code before any `realm.write`.
- Hooks return plain objects, never live `Realm.Object`s, so data stays readable after the record is deleted.
- Every write goes through a mutation hook. A write outside the hooks leaves the cache stale (AD-002).
- Ids cross the feature API as 24-char hex strings. An invalid id reads as "not found".

**Hook shape**

```ts
export function useCreateDeck() {
  const repository = useDeckRepository();
  const queryClient = useQueryClient();
  return useMutation<Deck, AppError<DeckErrorCode>, DeckInput>({
    mutationFn: async (input) => repository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deckKeys.all }),
  });
}
```

**Invalidation matrix** (whole prefixes; local reads are cheap)

| Write | Invalidates |
| --- | --- |
| Create or update deck | `["decks"]` |
| Delete deck (cascades to its cards) | `["decks"]`, `["cards"]` |
| Create or delete card (changes `cardCount`) | `["cards"]`, `["decks"]` |
| Edit card | `["cards"]` |
| Answer a card (updates the card, creates a `ReviewLog`) | `["cards"]`, `["decks"]`, `["study"]` |

`ReviewLog` is never touched by deck or card operations. It survives the deletion of its card or deck.

## Study session

`study` ([study-session spec](.specs/features/study-session/spec.md)) reads the due queue and writes answers. `repository.answer` applies `schedule()` and creates the `ReviewLog` in one `realm.write`; the deck of a card comes from the backlink (`linkingObjects(Deck, "cards")`), so the schema has no `deck` field on `Card`.

The queue is a snapshot: `study` queries use `gcTime: 0` so each session opens with a fresh read, and `StudyScreen` keeps the first read in state so later invalidations do not change the queue mid-session (QUE-02). One route per scope (`/study`, `/decks/<id>/study`) switches phase: loading, not found, empty, studying, summary. The summary replaces the session in the same route, so going back leaves it.

## Planned Architecture

Source: [PROJECT-SPEC.md](PROJECT-SPEC.md) (draft v0.1). Partly implemented (Realm, decks, cards).

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

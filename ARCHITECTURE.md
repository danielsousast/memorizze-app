# Architecture

## Current Architecture

Expo app with the data layer for decks and cards. No screens beyond the router shell yet.

| Part | Path | Contents |
| --- | --- | --- |
| Root layout | `src/app/_layout.tsx` | `RealmErrorBoundary` → `RealmProvider` → `QueryClientProvider` → Expo Router `Stack` |
| Home route | `src/app/index.tsx` | Placeholder screen |
| Database | `src/db/` | Realm schemas (Profile, Deck, Card, ReviewLog), `realmConfig`, `RealmErrorBoundary` |
| Query client | `src/lib/query-client.ts` | `createQueryClient()`: `networkMode: "always"`, `retry: false`, `staleTime: Infinity` |
| Domain errors | `src/domain/errors.ts` | `AppError<C>` with a typed `code`; pure, no Realm or React |
| Features | `src/features/decks/`, `src/features/cards/` | Repositories and React Query hooks (see [Feature modules](#feature-modules)) |
| Path alias | `tsconfig.json` | `@/*` → `./src/*`, `@/assets/*` → `./assets/*` |
| Compiler | `app.json` | `typedRoutes` and `reactCompiler` experiments on |

Navigation is file-based (Expo Router).

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

- Only `repository.ts` and `adapters.ts` import `realm`, `@realm/react` or `@/db`. ESLint `no-restricted-imports` enforces it (`eslint.config.js`).
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

`ReviewLog` is never touched by deck or card operations. It survives the deletion of its card or deck.

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

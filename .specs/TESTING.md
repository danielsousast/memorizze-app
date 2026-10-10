# Testing

Commands live in [PROJECT.md](PROJECT.md#quality).

## Stack

| Layer | Runner / library | Config |
| --- | --- | --- |
| Unit, repository, component | Jest ~29.7 via `jest-expo` ~57.0.5 | `package.json` → `jest` |
| Component | `@testing-library/react-native` ^14.1 | — |

## Layout and Naming

- Tests sit next to the source as `*.test.ts(x)`; shared helpers live in `src/testing/`.
- Import with the `@/*` alias.
- `describe('<unit>') / it('<behavior>')`.

## Layers

| Layer | Use for | Example |
| --- | --- | --- |
| Repository / Realm | Real in-memory Realm via `openTestRealm` | `src/testing/realm.test.ts` |
| Component | Render with Testing Library, assert on text | `src/db/realm-error-boundary.test.tsx` |
| Hook | `renderHookWithProviders` with a real Realm and `QueryClient`; prove wiring only (plain data, invalidation, offline, error code), not repository rules | `src/features/decks/usecases/decks.test.tsx` |
| Architecture | Reads `src/features/` from disk; plus the ESLint import rule | `src/features/architecture.test.ts` |

## Fixtures and Test Doubles

- `openTestRealm(schema)` (`src/testing/realm.ts`) opens an `inMemory` Realm at a unique path in `os.tmpdir()`. Close it at the end of the test.
- Never mock Realm; use the in-memory one.
- `renderHookWithProviders(hook, realm)` (`src/testing/providers.tsx`) wraps `renderHook` in a fresh `QueryClientProvider` and `RealmProvider realm={realm}`. It is async. `unmount()` clears the client and leaves the realm open; the test closes it.
- `createRandom(seed)` (`src/testing/random.ts`) is a seeded PRNG for INVARIANT tests (100 random operations, check after each step).
- Repositories take a `now` clock parameter; pass a fixed one for deterministic dates.

## Standards

- `render` in Testing Library v14 is async: `await render(...)`.
- `jest.setup.ts` calls `Realm.shutdown()` in `afterAll`. Without it Jest never exits. Do not use `--forceExit`.
- React Query `gcTime` timers (queries and mutations) also keep Jest open; the test client sets both to `Infinity`. Wrap mutations in `await act(async () => …)` and assert refreshed reads with `waitFor`.
- The `jest.moduleNameMapper` entry maps `@realm/fetch` to its Node CJS build. Without it the RN ESM build fails with `SyntaxError: Unexpected token 'export'`.
- Domain coverage ≥ 90% (PROJECT-SPEC §10), enforced from M1.
- No `.only`, no network.

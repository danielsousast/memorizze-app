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

## Fixtures and Test Doubles

- `openTestRealm(schema)` (`src/testing/realm.ts`) opens an `inMemory` Realm at a unique path in `os.tmpdir()`. Close it at the end of the test.
- Never mock Realm; use the in-memory one.

## Standards

- `render` in Testing Library v14 is async: `await render(...)`.
- `jest.setup.ts` calls `Realm.shutdown()` in `afterAll`. Without it Jest never exits. Do not use `--forceExit`.
- The `jest.moduleNameMapper` entry maps `@realm/fetch` to its Node CJS build. Without it the RN ESM build fails with `SyntaxError: Unexpected token 'export'`.
- Domain coverage ≥ 90% (PROJECT-SPEC §10), enforced from M1.
- No `.only`, no network.

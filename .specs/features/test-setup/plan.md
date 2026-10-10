# Test Setup — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Done

## Approach

Seguir o guia de unit testing do Expo (preset `jest-expo`, config no `package.json`). O `realm` já detecta o Jest (`JEST_WORKER_ID`) e carrega a entrada Node com o binário `prebuilds/node/realm.node`; só falta apontar `@realm/fetch` para a build CJS do Node via `moduleNameMapper`. Um setup file chama `Realm.shutdown()` no `afterAll` para liberar o event loop. Protótipo validado: Realm em memória passou e o Jest encerrou em ~1 s.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `RealmErrorBoundary` | `src/db/realm-error-boundary.tsx` | Alvo do teste de componente (TST-05) |
| Alias `@/*` | `tsconfig.json` | `jest-expo` resolve via Babel; usar nos testes |

### Components and interfaces

- **openTestRealm** (`src/testing/realm.ts`): `openTestRealm(schema: Realm.ObjectSchema | Realm.ObjectClass[]): Realm`. Abre `inMemory: true` com `path` único em `os.tmpdir()`.
- **jest.setup.ts** (raiz): `afterAll(() => Realm.shutdown())`.

### Architecture impact

**Architecture impact**: none — ferramenta de teste. Atualizar a linha "Tests" em `.specs/PROJECT.md` e criar `.specs/TESTING.md`.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| `@realm/fetch` no Jest | `moduleNameMapper` → `dist/node-cjs/node.js` | Variante RN é ESM e Realm em Node não faz rede |
| Encerrar Jest | `Realm.shutdown()` em setup file | API pública feita para isso; `--forceExit` esconderia handles reais |
| Path do Realm de teste | `os.tmpdir()` + id único | `inMemory` ainda cria `.lock`/`.management` no cwd |

## Test Strategy

SPEC por AC com Jest; TST-01/02/04 por comando. Mutação: remover o `moduleNameMapper` e o `Realm.shutdown()` deve quebrar TST-03/TST-04.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npm test` | após cada task |
| full | `npm test && npx tsc --noEmit && npx expo lint` | antes do commit |

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2, T3

## Tasks

### T1 — Jest instalado e configurado

- **Covers**: TST-01, TST-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `package.json`, `package-lock.json`, `tsconfig.json`, `jest.setup.ts`
- **Change**: deps em `devDependencies`, script `test`, chave `jest` (preset, mapper, setup file), `types: ["jest"]`, `exclude` de `example/`
- **Tests**:
  - SPEC TST-01 · comando — `npm test` sai 0
  - SPEC TST-02 · comando — `tsc` e `lint` saem 0
- **Done when**: gate full verde
- **Gate**: full
- **Status**: [x] done

### T2 — Helper de Realm em memória

- **Covers**: TST-03, TST-04
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/testing/realm.ts`, `src/testing/realm.test.ts`
- **Change**: `openTestRealm` com `inMemory` e path único em `os.tmpdir()`
- **Tests**:
  - SPEC TST-03 · unit — grava e lê; segundo Realm vê zero objetos
  - SPEC TST-04 · comando — `npm test` encerra sozinho; `ls *.realm*` vazio na raiz
- **Done when**: testes verdes
- **Gate**: full
- **Status**: [x] done

### T3 — Smoke de componente e docs

- **Covers**: TST-05
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/db/realm-error-boundary.test.tsx`, `.specs/TESTING.md`, `.specs/PROJECT.md`
- **Change**: teste de componente; criar TESTING.md; atualizar linha Tests do PROJECT.md
- **Tests**:
  - SPEC TST-05 · component — boundary mostra o texto de erro
- **Done when**: teste verde, docs atualizados
- **Gate**: full
- **Status**: [x] done

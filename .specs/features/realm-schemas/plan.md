# Realm Schemas — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Approved

## Approach

Uma classe por modelo estendendo `Realm.Object<T>` com `static schema: ObjectSchema` (padrão do realm-js, sem decorators nem plugin Babel). Campos TS declarados com `declare` se o Babel do `jest-expo` inicializar campos `!:` como `undefined` e sombrear os getters do Realm (SCH-05 detecta). `realmConfig` passa a listar as classes e sobe para `schemaVersion: 2`. Testes usam `openTestRealm` da feature `test-setup`.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `realmConfig` | `src/db/realm.ts` | Registrar schemas, subir versão |
| `openTestRealm` | `src/testing/realm.ts` | Realm em memória nos testes |

### Components and interfaces

- **Profile, Deck, Card, ReviewLog** (`src/db/schemas/<model>.ts`), reexportados por `src/db/schemas/index.ts` e `src/db/index.ts`.

### Data

| Model | Field | Realm type | Notes |
| --- | --- | --- | --- |
| Profile | `_id`, `name`, `dailyGoal`, `createdAt` | objectId, string, int, date | `dailyGoal` default 20 |
| Deck | `_id`, `name`, `description?`, `createdAt`, `cards` | objectId, string, string?, date, `Card[]` | |
| Card | `_id`, `front`, `back`, `easeFactor`, `intervalDays`, `repetitions`, `lapses`, `dueDate`, `createdAt` | objectId, string, string, double, int×3, date, date | defaults 2.5/0/0/0; `dueDate` indexado |
| ReviewLog | `_id`, `cardId`, `deckId`, `grade`, `reviewedAt` | objectId×3, int, date | `reviewedAt` indexado |

Migração v1 → v2: só adição de classes; sem `onMigration`.

### Architecture impact

**Architecture impact**: none — ARCHITECTURE.md já prevê os quatro modelos em `src/db/`.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| `cardId`/`deckId` no log | `objectId`, não link | Log imutável sobrevive à exclusão (base das estatísticas) |
| Card sem backlink para Deck | Não adicionar | Não exigido; adiciona-se quando um caso de uso pedir |

## Test Strategy

`src/db/schemas/schemas.test.ts` com Realm em memória: um SPEC por AC. SCH-07 usa arquivo real em `os.tmpdir()` (abre v1 `[]`, fecha, reabre com `realmConfig` + path temporário). Mutações: trocar `int` por `double` em um campo, remover um `indexed`, remover `optional` de `description`.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| full | `npm test && npx tsc --noEmit && npx expo lint` | após cada task |

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2
- **Wave 3**: T3

## Tasks

### T1 — Modelos

- **Covers**: SCH-01, SCH-02, SCH-03, SCH-04, SCH-05, SCH-06
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/db/schemas/*.ts`, `src/db/schemas/schemas.test.ts`
- **Change**: quatro classes com `static schema`; `index.ts` reexporta
- **Tests**:
  - SPEC SCH-01 · unit — `realm.schema` tem os quatro modelos com PK e tipos
  - SPEC SCH-02 · unit — defaults aplicados
  - SPEC SCH-03 · unit — `indexed: true` em `dueDate` e `reviewedAt`
  - SPEC SCH-04 · unit — `description` opcional; criar Card sem `front` lança e não grava
  - SPEC SCH-05 · unit — card em `deck.cards` volta como `Card` com campos legíveis
  - SPEC SCH-06 · unit — log intacto após apagar o cartão
- **Done when**: testes verdes, mutações mortas
- **Gate**: full
- **Status**: [ ] pending

### T2 — Config v2

- **Covers**: SCH-07
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/db/realm.ts`, `src/db/index.ts`, `src/db/realm.test.ts`
- **Change**: `schema` com as quatro classes, `schemaVersion: 2`
- **Tests**:
  - SPEC SCH-07 · unit — arquivo v1 `[]` em tmp reabre com `realmConfig`
- **Done when**: teste verde
- **Gate**: full
- **Status**: [ ] pending

### T3 — Smoke no simulador

- **Covers**: SCH-07
- **Depends on**: T2
- **Risk**: inherit
- **Touches**: nenhum arquivo
- **Change**: `npx expo run:ios` com o `memorizze.realm` existente (v1); app abre sem o boundary de erro
- **Tests**:
  - SPEC SCH-07 · runtime — app inicia e mostra a tela inicial
- **Done when**: evidência registrada no verify
- **Gate**: full
- **Status**: [ ] pending

# Deck & Card CRUD — Validation

**Verdict**: PASS
**Risk**: HIGH (from spec)
**Verifier**: author, context-reset (no independent agent available)
**Diff range**: `7e36c93..fdea6f5`
**Date**: 2026-10-09

Sub-agents are off by default in this harness (spawned only on user request). Verification followed spec → diff → tests, without re-reading the plan's reasoning.

## Gate

- **Command**: full gate (`npm test && npx tsc --noEmit && npx expo lint`)
- **Result**: 55 passed, 0 failed, 0 skipped @ `fdea6f5`; tsc and lint exit 0; Jest exits on its own
- **Test count**: 10 → 55
- **Skips**: none

## Acceptance Criteria Evidence

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| DCK-01 | trimmed name, `createdAt` = now, 0 cards, returns deck | `src/features/decks/repository.test.ts:41` — `expect(deck).toEqual({ id, name: "Inglês", description: "x", createdAt: t0, cardCount: 0 })` | SPEC | ✅ |
| DCK-02 | all decks by `createdAt` asc with `cardCount` | `src/features/decks/repository.test.ts:56` — names `["A","B","C"]`, counts `[0,0,2]` | SPEC | ✅ |
| DCK-03 | existing → deck; missing → `null` | `src/features/decks/repository.test.ts:70` — `getById(missing)` and `getById("xyz")` `toBeNull()` | SPEC | ✅ |
| DCK-04 | new name (trimmed)/description; `createdAt` and cards unchanged | `src/features/decks/repository.test.ts:119` — `toEqual({ name: "Espanhol", description: "y", createdAt: t0, cardCount: 2 })`, card ids equal | SPEC | ✅ |
| DCK-05 | deck and all its cards deleted | `src/features/decks/repository.test.ts:184` — deck and 3 cards `objectForPrimaryKey` → `null` | SPEC | ✅ |
| DCK-06 | blank name → `DECK_NAME_EMPTY`, nothing written | `src/features/decks/repository.test.ts:79`, `:156` — `code: "DECK_NAME_EMPTY"`, count 0 / deck unchanged | SPEC | ✅ |
| DCK-07 | duplicate (trim, case) → `DECK_NAME_DUPLICATE`, nothing written | `src/features/decks/repository.test.ts:88`, `:145` — code asserted; count 1 / values unchanged | SPEC | ✅ |
| DCK-08 | missing deck on update/remove/card create → `DECK_NOT_FOUND`, nothing written | `src/features/decks/repository.test.ts:166`; `src/features/cards/repository.test.ts:93` — code asserted, counts unchanged | SPEC | ✅ |
| DCK-09 | other decks' cards and all `ReviewLog` intact | `src/features/decks/repository.test.ts:197` — B card ids equal, `ReviewLog` length 2 with A's card ids | SPEC | ✅ |
| DCK-10 | own name in another case accepted | `src/features/decks/repository.test.ts:138` — `update(id, { name: "INGLÊS" }).name` → `"INGLÊS"` | SPEC | ✅ |
| CRD-01 | trimmed texts, defaults 2.5/0/0/0, `dueDate` = `createdAt` = now, appended | `src/features/cards/repository.test.ts:36` — full `toEqual`, deck ids `[first, card]` | SPEC | ✅ |
| CRD-02 | cards in insertion order | `src/features/cards/repository.test.ts:57` — ids `[c1,c2,c3]`, other deck excluded | SPEC | ✅ |
| CRD-03 | existing → card; missing → `null` | `src/features/cards/repository.test.ts:69` — `toBeNull()` for missing and invalid | SPEC | ✅ |
| CRD-04 | new texts; six scheduling fields identical | `src/features/cards/repository.test.ts:102` — `toEqual({ ...before, back: "novo" })` after manual schedule change | SPEC | ✅ |
| CRD-05 | removed from DB and deck list | `src/features/cards/repository.test.ts:161` — `getById` null, deck ids `[keep]` | SPEC | ✅ |
| CRD-06 | blank front/back → codes, front first, nothing written | `src/features/cards/repository.test.ts:79`, `:132` — three code cases, 0 cards / card unchanged | SPEC | ✅ |
| CRD-07 | missing card on edit/remove → `CARD_NOT_FOUND` | `src/features/cards/repository.test.ts:146` — code asserted for update, remove, invalid id | SPEC | ✅ |
| CRD-08 | card's `ReviewLog`s intact | `src/features/cards/repository.test.ts:173` — 2 logs with same `cardId` | SPEC | ✅ |
| HK-01 | every DCK/CRD read and write as a hook | `src/features/decks/usecases/decks.test.tsx:44`; `src/features/cards/usecases/cards.test.tsx:59` — all 10 hooks exercised | SPEC | ✅ |
| HK-02 | mounted reads refresh per table, no remount | `src/features/decks/usecases/decks.test.tsx:88`; `src/features/cards/usecases/cards.test.tsx:89`, `:110`, `:122` — `waitFor` on list/item/`cardCount` | SPEC | ✅ |
| HK-03 | offline: nothing paused | `src/features/decks/usecases/decks.test.tsx:114` — `fetchStatus` not `"paused"`, mutation succeeds; `src/lib/query-client.test.ts:4` | SPEC, CONTRACT | ✅ |
| HK-04 | rejected write exposes `error.code` | `src/features/decks/usecases/decks.test.tsx:127`; `src/features/cards/usecases/cards.test.tsx:148` — `error?.code` | SPEC | ✅ |
| HK-05 | plain objects, readable after deletion | `src/features/decks/usecases/decks.test.tsx:73`; `src/features/cards/usecases/cards.test.tsx:134` — `not.toBeInstanceOf(Realm.Object)`, field read after delete | SPEC | ✅ |
| HK-06 | mounted data unchanged after rejected write | `src/features/decks/usecases/decks.test.tsx:127` — `list.data` `toBe(before)` | SPEC | ✅ |
| ARC-01 | feature layout | `src/features/architecture.test.ts:37` — required and allowed files | SPEC | ✅ |
| ARC-02 | one React Query call, one repository method per hook | `src/features/architecture.test.ts:58` — counts equal 1 | SPEC | ✅ |
| ARC-03 | only repository/adapters import Realm or `@/db` | `eslint.config.js:19` — `no-restricted-imports`; manual mutation (Realm import in `use-decks.ts`, `@/db` in `interfaces.ts`) fails lint | SPEC | ✅ |
| ARC-04 | pattern in ARCHITECTURE.md; AD-001 in STATE.md | `ARCHITECTURE.md:20` — "Feature modules" section citing AD-001/AD-002; `.specs/STATE.md:7`, `:16` | SPEC | ✅ |
| ARC-05 | single use case at root, no `usecases/` | `src/features/architecture.test.ts:47` — root/usecases hook counts | SPEC | ✅ |

## Invariants

| Invariant | Evidence (`file:line`) | Breaking mutation attempted | Result |
| --- | --- | --- | --- |
| INV-01 | `src/features/decks/repository.test.ts:98` — normalized names unique after each of 100 steps | duplicate key without `trim` | ✅ killed |
| INV-02 | `src/features/decks/repository.test.ts:223` — `Card` count == Σ `deck.cards.length` after each step | removed `realm.delete(deck.cards)` | ✅ killed |
| INV-03 | `src/features/cards/repository.test.ts:195` — 5 seeded logs snapshot-equal after each of 100 steps | — (no code path writes `ReviewLog`) | ✅ held |

## Discrimination

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| 1 | `src/features/decks/repository.ts` `remove` | removed `realm.delete(deck.cards)` | ✅ (DCK-05, DCK-09, INV-02) |
| 2 | `src/features/decks/repository.ts` `validName` | dropped own-id exclusion | ✅ (DCK-10) |
| 3 | `src/features/decks/repository.ts` `validName` | duplicate key from untrimmed name | ✅ (DCK-07, INV-01) |
| 4 | `src/features/cards/repository.ts` `create` | back validated before front | ✅ (CRD-06) |
| 5 | `src/lib/query-client.ts` | `networkMode: "online"` | ✅ (HK-03) |
| 6 | `src/features/cards/usecases/use-create-card.ts` | removed `["decks"]` invalidation | ✅ (HK-02) |
| 7 | `src/features/decks/usecases/use-delete-deck.ts` | removed `["cards"]` invalidation | ✅ (HK-02) |
| 8 | `src/features/decks/usecases/use-delete-deck.ts` | two repository calls in one hook | ✅ (ARC-02) |
| 9 | `src/features/tmpx/` | stray file, feature without hooks | ✅ (ARC-01, ARC-02) |

**Result**: 9 injected · 9 killed · 0 survived
**Isolation**: in-place edit with a backup copy restored after each run; `git status --porcelain` empty afterwards

## UAT

Not applicable: the feature ships no screens (spec Out of scope). UAT runs with the Início/Baralho/Editor screens.

## Change Review

- Scope matches spec In scope: ✅ (repositories, hooks, provider, pattern docs; no UI)
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅
- Tests anchored and necessary: ✅
- Fix during execution: `c3cbd53` disables mutation `gcTime` timers in the T1 test helper. Without it Jest stayed open after hook tests.
- Note (not a gap): `update(id, { name })` without `description` clears the description. DeckInput is a full replacement of the editable fields, per the approved plan. An edit form must send both fields.

## Gaps & Fix Tasks

None.

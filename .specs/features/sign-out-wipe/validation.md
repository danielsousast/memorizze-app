# Sign Out and Wipe — Validation

**Verdict**: PASS
**Risk**: HIGH (from spec)
**Verifier**: author fresh-eyes (sem verificador independente; pendente para HIGH)
**Diff range**: `84da58d..689bc25`
**Date**: 2026-10-10

## Gate

- **Command**: `npm run ci`, `npx expo lint`, `npx tsc --noEmit`
- **Result**: 513 passed, 0 failed, 0 skipped @ `689bc25`
- **Test count**: 503 → 513
- **Skips**: none

## Acceptance Criteria Evidence

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| SOUT-01 | Diálogo destrutivo `Sair e apagar dados?` | `src/navigation/root-stack.test.tsx:141` — `findByText("Sair e apagar dados?")` | SPEC | ✅ |
| SOUT-02 | Mensagem com contagens e plural | `src/domain/labels.test.ts:72` — `signOutMessage(4, 492)` | SPEC | ✅ |
| SOUT-03 | Confirmar apaga tudo e mostra Boas-vindas | `src/navigation/root-stack.test.tsx:164` — `toHavePathname("/welcome")`, contagens 0 | SPEC | ✅ |
| SOUT-04 | Falha não apaga, toast, diálogo fechado | `src/navigation/root-stack.test.tsx:179` — toast e `Profile` com 1 | SPEC | ✅ |
| SOUT-05 | Cancelar mantém os dados | `src/navigation/root-stack.test.tsx:154` — `Profile` com 1, `/profile` | SPEC | ✅ |

## Discrimination

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| 1 | `src/features/profile/repository.ts:89` | `deleteAll` → apagar só o Profile | ✅ |
| 2 | `src/features/profile/usecases/use-sign-out.ts:12` | removido `invalidateQueries()` | ✅ |
| 3 | `src/features/profile/screens/use-profile-screen.ts:74` | removido `onError` do toast | ✅ |
| 4 | `src/features/profile/screens/use-profile-screen.ts:73` | removido `setSignOutOpen(false)` | ❌ survived → corrigido com assert em SOUT-04, depois ✅ |
| 5 | `src/features/profile/screens/profile-screen.tsx:205` | `requestSignOut` → `confirmSignOut` | ✅ |

**Result**: 5 injected · 5 killed · 0 survived (após o assert novo)
**Isolation**: mutações na árvore real, restauradas com cópia; `git status` limpo ao final

## Change Review

- Scope matches spec In scope: ✅
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅
- Tests anchored and necessary: ✅

## UAT

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| 1 | Diálogo e retorno à Boas-vindas em dispositivo | pendente | — |

## Gaps & Fix Tasks

none

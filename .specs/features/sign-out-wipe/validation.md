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
| SOUT-06 | Linha com legenda do último backup | `src/navigation/root-stack.test.tsx:271` — `findByRole("button", { name: "Fazer backup antes" })`, `Último backup: 2 de outubro` | SPEC | ✅ |
| SOUT-07 | Exporta, grava data, reabre, nada apagado | `src/navigation/root-stack.test.tsx:291` — `shareBackupFile` chamado, `lastBackupAt` definido, diálogo de volta | SPEC | ✅ |
| SOUT-08 | Falha: toast, diálogo fechado, dados intactos | `src/navigation/root-stack.test.tsx:308` — `Não foi possível exportar.`, `lastBackupAt` nulo | SPEC | ✅ |

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

## Amendment A-01 (T3) — verificação do autor

- **Gate**: `npm run ci`, lint e `tsc` limpos; 697 passed, 0 failed (693 → 697)
- **ACs**: SOUT-06 (`root-stack.test.tsx` "shows the backup row…", "says no backup yet…"), SOUT-07 ("exports, records the date and reopens…"), SOUT-08 ("a failed export keeps the dialog closed…") — todos SPEC
- **Mutações** em `use-profile-screen.ts` (`backupFirst`): sem reabrir, sem fechar, sem marcar data, sem toast de erro — 4 injetadas, 4 mortas
- **Pendente**: verificador independente (HIGH) e UAT em dispositivo (share sheet com o diálogo fechado)

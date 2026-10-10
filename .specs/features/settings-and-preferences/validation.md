# Settings and Preferences — Validation

**Verdict**: PASS (author; independent verifier and UAT pending)
**Risk**: HIGH (from spec)
**Verifier**: author fresh-eyes (sem verificador independente; pendente para HIGH)
**Diff range**: `c87c456..HEAD`
**Date**: 2026-10-10

## Gate

- **Command**: `npm run ci`
- **Result**: 64 suites, 588 passed, 0 failed, 0 skipped; lint e `tsc` limpos; domínio 100%
- **Test count**: 525 → 588
- **Skips**: none

## Acceptance Criteria Evidence

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| SET-01 | engrenagem abre `/settings`; voltar; seções | `src/features/profile/screens/settings-screen.test.tsx:39` — teste `SET-01` | SPEC | ✅ |
| SET-02 | versão do app no rodapé | `src/features/profile/screens/settings-screen.test.tsx:60` — teste `SET-02` | SPEC | ✅ |
| SET-03 | `/settings` só com perfil | `src/navigation/root-stack.test.tsx:141` — teste `SET-03` | SPEC | ✅ |
| SET-04 | falha: toast e valor anterior | `src/features/profile/repository.test.ts:235` — teste `SET-04` | SPEC | ✅ |
| THM-01 | opções, seleção, alvo ≥ 44 | `src/components/screen.test.tsx:24` — teste `THM-01` | SPEC | ✅ |
| THM-02 | escolher persiste | `src/components/segmented-control.test.tsx:38` — teste `THM-02` | SPEC | ✅ |
| THM-03 | Automático segue o sistema; nota | `src/domain/preferences.test.ts:38` — teste `THM-03` | SPEC | ✅ |
| THM-04 | tema salvo na 1ª renderização | `src/navigation/root-stack.test.tsx:172` — teste `THM-04` | SPEC | ✅ |
| THM-05 | Sair devolve o tema ao sistema | `src/navigation/root-stack.test.tsx:155` — teste `THM-05` | SPEC | ✅ |
| NEW-01 | linha, folha e opções | `src/components/bottom-sheet.test.tsx:43` — teste `NEW-01` | SPEC | ✅ |
| NEW-02 | cap de novos, ordem, não novos intactos | `src/domain/new-cards.test.ts:12` — teste `NEW-02` | SPEC | ✅ |
| NEW-03 | orçamento único, 1º log do dia | `src/domain/new-cards.test.ts:21` — teste `NEW-03` | SPEC | ✅ |
| NEW-04 | introduzido hoje e errado fica sem custo | `src/domain/new-cards.test.ts:26` — teste `NEW-04` | SPEC | ✅ |
| NEW-05 | Sem limite = comportamento atual | `src/domain/new-cards.test.ts:31` — teste `NEW-05` | SPEC | ✅ |
| NEW-06 | nova fila reflete o limite | `src/features/profile/screens/settings-screen.test.tsx:114` — teste `NEW-06` | SPEC | ✅ |
| NEW-07 | padrão 10 e opções | `src/domain/preferences.test.ts:16` — teste `NEW-07` | SPEC | ✅ |
| NEW-08 | orçamento esgotado: fila vazia | `src/domain/new-cards.test.ts:36` — teste `NEW-08` | SPEC | ✅ |
| NEW-09 | redefinido entra como novo sem contar como introduzido | `src/features/study/repository.test.ts:210` — teste `NEW-09` | SPEC | ✅ |
| MIG-01 | migração 3→4 preserva dados, `system`, `10` | `src/db/realm.test.ts:25` — teste `MIG-01` | SPEC | ✅ |

NEW-09 lido assim: o cartão redefinido entra como novo dentro do orçamento e não conta como introduzido hoje, porque seu primeiro log é antigo.

## Discrimination

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| 1 | `domain/new-cards.ts` | `limit - introducedToday.size` → `limit` | ✅ (8 testes) |
| 2 | `domain/new-cards.ts` | `budget === 0` → `budget < 0` | ✅ (6) |
| 3 | `db/realm.ts` | `onMigration` sem `newCardsPerDay` | ✅ |
| 4 | `domain/preferences.ts` | `limit ?? 0` → `limit ?? 10` | ✅ |
| 5 | `navigation/use-apply-theme.ts` | aplica sempre `"dark"` | ✅ |
| 6 | `study/repository.ts` | `.length === 0` → `.length >= 0` | ✅ (sobreviveu na 1ª rodada; teste NEW-03 reforçado e agora mata) |
| 7 | `use-settings-screen.ts` | `onError` do tema removido | ✅ |

**Result**: 7 injected · 7 killed (1 após reforço do teste)
**Isolation**: mutações no próprio worktree, arquivo restaurado após cada uma

## Change Review

- Scope matches spec In scope: ✅
- Desvio do plano: `Appearance.setColorScheme` do RN 0.86 aceita `'unspecified'`, não `null`; plano corrigido.
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅

## Gaps & Fix Tasks

1. Verificador independente (HIGH) e UAT em dispositivo: tema ao reabrir sem piscar, troca ao vivo, teclado e diálogos nativos, migração sobre dados reais.

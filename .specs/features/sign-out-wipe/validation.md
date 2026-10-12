# Sign Out and Wipe — Validation

**Verdict**: PASS (UAT 1 a 4 e 6 aprovados pelo usuário; UAT 5 pulado, coberto por teste; gaps menores abertos)
**Risk**: HIGH (from spec)
**Verifier**: independent agent
**Diff range**: `84da58d..1041b4c` (arquivos do feature: `src/features/profile/**`, `src/navigation/root-stack*`, `src/navigation/use-apply-theme.ts`, `src/domain/labels*`, `src/components/confirm-dialog.tsx`). Gate rodado no HEAD real `3e79d6a`, que inclui os commits posteriores do daily-reminder.
**Date**: 2026-10-12

## Gate

- **Command**: `npm run ci` (expo lint && tsc --noEmit && jest --coverage), exit 0
- **Result**: 758 passed, 0 failed, 0 skipped @ `3e79d6a` (75 suites)
- **Quick**: `npx jest src/features/profile src/navigation src/domain` no scratch de `1041b4c`: 269 passed, 0 failed
- **Test count**: baseline do início do Execute não consultado (fora das entradas permitidas) → 758 no HEAD
- **Skips**: none
- **Atribuição**: nenhuma falha; o gate verde no HEAD cobre também o daily-reminder, e o escopo do sign-out-wipe também passa isolado em `1041b4c`.

## Acceptance Criteria Evidence

Linhas citadas no HEAD `3e79d6a`.

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| SOUT-01 | Toque em `Sair` abre ConfirmDialog destrutivo, título `Sair e apagar dados?`, botões `Apagar e sair` e `Cancelar` | `src/navigation/root-stack.test.tsx:220` — `findByText("Sair e apagar dados?")`; botões localizados por nome em `:233` (Cancelar) e `:243` (Apagar e sair); tom destrutivo em `src/components/confirm-dialog.test.tsx:59` | SPEC | ✅ (ícone `sign-out` não asserido, ver G4) |
| SOUT-02 | `Sair apaga seus N baralhos, M cartões e todo o histórico deste aparelho.`, singular com 1 | `src/domain/labels.test.ts:72` — `toBe("Sair apaga seus 4 baralhos, 492 cartões e todo o histórico deste aparelho.")` e `toContain("seus 1 baralho, 1 cartão e")`; integração `root-stack.test.tsx:220` — `getByText(/seus 1 baralho, 1 cartão e todo o histórico/)`; contagens reais `repository.test.ts:268` — `dataCounts` `{decks:1,cards:1}` | SPEC | ✅ |
| SOUT-03 | Confirmar apaga Profile, Deck, Card, ReviewLog e mostra Boas-vindas | `repository.test.ts:275` — todos os 4 models com length 0; `root-stack.test.tsx:243` — `findByText("Começar")`, `toHavePathname("/welcome")`, Profile e Deck 0 | SPEC | ✅ |
| SOUT-04 | Falha: nada apagado, diálogo fecha, toast `Não foi possível apagar os dados.` | `root-stack.test.tsx:258` — toast visível, `queryByText("Sair e apagar dados?")` null, Profile length 1, pathname `/profile`; `repository.test.ts:281` — wipe lança, Profile e Card seguem 1 | SPEC | ✅ (ver G2) |
| SOUT-05 | Cancelar: nada apagado, Perfil aberto | `root-stack.test.tsx:233` — Profile length 1, `toHavePathname("/profile")` | SPEC | ✅ |
| SOUT-06 (A-01, A-02) | Link `Fazer backup antes` entre mensagem e botões, sem legenda | `root-stack.test.tsx:283` — `findByRole("button", {name:"Fazer backup antes"})`; ausência de legenda: sem asserção negativa (ver G3) | SPEC | ✅ (parcial, G3) |
| SOUT-07 (A-01) | Toque fecha diálogo, exporta como BKP-01/04, reabre ao terminar; nada apagado | `root-stack.test.tsx:291` — `shareBackupFile` chamado com URI, `lastBackupAt` gravado, diálogo reaberto, Profile 1 e Deck 1 | SPEC | ✅ (fechado durante o export não asserido, G5) |
| SOUT-08 (A-01) | Export falha: diálogo fechado, toast `Não foi possível exportar.`, nada apagado | `root-stack.test.tsx:307` — toast, diálogo null, `lastBackupAt` null, Profile 1 | SPEC | ✅ |
| THM-05 (cruza o wipe) | Sair devolve o tema ao sistema | `root-stack.test.tsx:170` — `setColorScheme` último `"unspecified"` após o wipe | SPEC (settings) | ✅ |

## Discrimination

Mutações num scratch (`git archive 1041b4c`, node_modules por symlink), suíte `src/features/profile src/navigation src/domain`.

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| 1 | `src/features/profile/repository.ts` (`wipe`) | `deleteAll` trocado por delete só de Card/Deck/ReviewLog (Profile sobra) | ✅ (5 testes: SOUT-03 x2, SOUT-04 x2, THM-05) |
| 2 | `src/features/profile/usecases/use-sign-out.ts` | removido `onSuccess: invalidateQueries` (app não volta à Boas-vindas) | ✅ (SOUT-03, THM-05) |
| 3 | `src/features/profile/screens/use-profile-screen.ts` (`confirmSignOut`) | removido `setSignOutOpen(false)` | ✅ (SOUT-04) |
| 4 | `use-profile-screen.ts` (`backupFirst`) | removido `onSuccess: reopen` do markBackedUp | ✅ (SOUT-07) |
| 5 | `use-profile-screen.ts` (`backupFirst`) | `markBackedUp.mutate` substituído por `reopen()` direto (data não gravada) | ✅ (SOUT-07) |
| 6 | `src/domain/labels.ts` | contagem de baralhos usa `cards` | ✅ (SOUT-02) |
| 7 | `use-profile-screen.ts` | removido `onError` com toast do wipe | ✅ (SOUT-04) |
| 8 | `use-profile-screen.ts` (`cancelSignOut`) | Cancelar passa a chamar `signOut.mutate()` | ✅ (SOUT-05) |
| 9 | `use-profile-screen.ts` (`backupFirst`) | removido `setSignOutOpen(false)` | ✅ (SOUT-08) |

**Result**: 9 injected · 9 killed · 0 survived
**Isolation**: scratch em `scratchpad/scr`; `git status --porcelain` da árvore real vazio antes e depois (exceto este arquivo).

## Amendments Reconciled

| Amendment | AC text | Code | Test |
| --- | --- | --- | --- |
| A-01 | ✅ SOUT-06..08 no spec | ✅ `backup-before-sign-out.tsx`, `use-profile-screen.ts` `backupFirst` | `root-stack.test.tsx:283`, `:291`, `:307` |
| A-02 | ✅ SOUT-06 sem legenda | ✅ link sem fundo, sem legenda; mensagem encurtada em `labels.ts` | `labels.test.ts:72`, `root-stack.test.tsx:283` |

## UAT

Executado pelo usuário em aparelho em 2026-10-12. O 5 foi pulado por acordo (só via build de debug; o toast é coberto em `root-stack.test.tsx:258`).

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| 1 | Perfil > `Sair`: diálogo com ícone sign-out, título, contagens reais, link `Fazer backup antes` discreto sem legenda, `Apagar e sair` e `Cancelar` (visual vs design 7b) | pass | usuário: "tudo ok" (claro e escuro) |
| 2 | `Fazer backup antes` no iOS: diálogo fecha, share sheet abre (atraso de 500 ms basta, `use-profile-screen.ts` `MODAL_CLOSE_MS`), ao concluir o diálogo reabre | pass | usuário: "tudo ok" (iOS); timing do Modal não é testável em Jest |
| 3 | Cancelar a share sheet / falha no export: toast `Não foi possível exportar.`, dados intactos | pass | usuário: "tudo ok" (cancelamento da share sheet; o toast de falha real do export não foi provocado) |
| 4 | `Apagar e sair` com baralhos, cartões e histórico reais: volta à Boas-vindas, nada sobra (reabrir o app confirma), tema volta ao do sistema | pass | usuário: "ok" (plataforma não informada) |
| 5 | Falha no apagar (difícil de provocar): toast `Não foi possível apagar os dados.` | skip | só via build de debug |
| 6 | Nota sob o botão `Sair` e tema claro/escuro | pass | usuário: "tudo ok" (junto com o 1) |

## Change Review

- Scope matches spec In scope: ✅ (Sair, nota, diálogo, wipe; A-01 backup). Mudanças de settings/backup/deck no mesmo range pertencem a outros features e foram ignoradas.
- AGENTS.md Code Rules: sem ternário aninhado, sem função inline em props JSX (`onPress={requestSignOut}`, `onConfirm={confirmSignOut}`, `onPress={backupFirst}`), orquestração (diálogo, mutação, toast, export) em `use-profile-screen.ts` e `use-sign-out.ts`, texto em `domain/labels.ts`: ✅
- Sem debug, segredo ou teste desabilitado: ✅
- Tests anchored and necessary: ✅

## Gaps & Fix Tasks

Nenhum bloqueador. Ordenados por severidade:

1. (Minor) SOUT-04 atomicidade — `repository.test.ts:281` e `root-stack.test.tsx:258` simulam falha mockando `deleteAll` para lançar antes de apagar algo; isso prova o tratamento de erro, mas não que uma falha no meio da transação desfaz tudo. A garantia vem do `realm.write` + `deleteAll` (`repository.ts` `wipe`), não de um teste.
2. (Minor) Spec desatualizado — Out of scope ainda diz "Apagar preferências e tema | Não existem até a F5"; hoje `deleteAll` apaga as preferências e `root-stack.test.tsx:170` (THM-05) cobre o tema. Vale uma emenda de esclarecimento. A limpeza do lembrete diário pertence ao feature daily-reminder (fora deste range).
3. (Minor) SOUT-06 — nenhuma asserção negativa de que a legenda do último backup não aparece (`root-stack.test.tsx:283` só confirma o link).
4. (Cosmético) SOUT-01 — ícone `sign-out` do diálogo e a nota "Apaga seus baralhos e progresso deste aparelho." (`profile-screen.tsx`) sem asserção.
5. (Minor) SOUT-07 — o teste não verifica que o diálogo fica fechado enquanto o export roda, nem o atraso de `MODAL_CLOSE_MS`; o `setTimeout` em `use-profile-screen.ts` (`backupFirst`) não é limpo ao desmontar. Coberto por UAT 2.

# Deck & Card CRUD — Validation

**Verdict**: FAIL
**Risk**: HIGH (from spec)
**Verifier**: independent sub-agent
**Diff range**: `7e36c93..a2601a5`
**Date**: 2026-10-09
**Round**: fix → re-verify 3 de 3 (final) — escalar ao usuário

## Gate

- **Command**: full gate (plan.md → Verification Commands): `npm test && npx tsc --noEmit && npx expo lint`
- **Result**: 60 passed, 0 failed, 0 skipped (11 suites) @ `a2601a5`; `tsc --noEmit` exit 0; `expo lint` exit 0
- **Estabilidade**: `npm test` executado 6 vezes seguidas na árvore real → 6/6 verdes (60/60 em todas). Nenhuma falha intermitente observada; o race de HK-03 (F4) não reapareceu.
- **Test count**: 60 @ `a2601a5` (feature: 48 testes em `src/features/**`)
- **Skips**: none

## Acceptance Criteria Evidence

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| DCK-01 | `name` aparado, `createdAt` = agora, 0 cartões, devolve o baralho | `src/features/decks/repository.test.ts:46` — `expect(deck).toEqual({ id, name: "Inglês", description: "x", createdAt: t0, cardCount: 0 })` + `:53` 1 baralho gravado | SPEC | ✅ |
| DCK-02 | ordem `createdAt` crescente, `cardCount` | `src/features/decks/repository.test.ts:66` — `toEqual(["A","B","C"])`; `:67` — `cardCount` `[0,0,2]` | SPEC | ✅ |
| DCK-03 | id existente → baralho; inexistente → `null` | `src/features/decks/repository.test.ts:74` — `toEqual(created)`; `:75`/`:76` — `toBeNull()` | SPEC | ✅ |
| DCK-04 (A-01) | novos valores, `name` aparado, `createdAt` e cartões intactos; `description` omitida mantém, `""` remove | `src/features/decks/repository.test.ts:126` — `toEqual({ name: "Espanhol", description: "y", createdAt: t0, cardCount: 2 })`; `:135` ids dos cartões; `:142`/`:143` — omitida → `"d"`; `:146`/`:147` — `""` → sem `description`, Realm `toBeNull()` | SPEC | ✅ |
| DCK-05 | apaga baralho e todos os cartões | `src/features/decks/repository.test.ts:203` — deck `toBeNull()`; `:205` — cada cartão `toBeNull()` | SPEC | ✅ |
| DCK-06 | `DECK_NAME_EMPTY`, nada gravado | `src/features/decks/repository.test.ts:82` — `objectContaining({ code: "DECK_NAME_EMPTY" })`, `:85` 0 baralhos; update `:172`/`:175` | SPEC | ✅ |
| DCK-07 | `DECK_NAME_DUPLICATE` (trim + caixa), nada gravado | `src/features/decks/repository.test.ts:92` — code `DECK_NAME_DUPLICATE`, `:95` 1 baralho; update `:162`/`:165` | SPEC | ✅ |
| DCK-08 | `DECK_NOT_FOUND` em update/remove/criar cartão, nada gravado | `src/features/decks/repository.test.ts:183`, `:186`, `:189` — code `DECK_NOT_FOUND`, `:192`/`:193` banco intacto; `src/features/cards/repository.test.ts:98` — code `DECK_NOT_FOUND`, `:99` 0 cartões | SPEC | ✅ |
| DCK-09 | cartões de outros baralhos e todos os `ReviewLog` intactos | `src/features/decks/repository.test.ts:229` — cartões de B `toEqual(bCards)`; `:231`/`:232` — 2 logs com `cardId` originais | SPEC | ✅ |
| DCK-10 | atualizar mantendo o próprio nome (outra caixa) é aceito | `src/features/decks/repository.test.ts:154` — `update(id, { name: "INGLÊS" }).name` `toBe("INGLÊS")` | SPEC | ✅ |
| CRD-01 | textos aparados, EF 2.5, 0/0/0, `dueDate` = `createdAt` = agora, fim da lista | `src/features/cards/repository.test.ts:43` — `toEqual({ front: "a", back: "b", easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0, dueDate: t0, createdAt: t0 })`; `:54` — `[first.id, card.id]` | SPEC | ✅ |
| CRD-02 | ordem de inserção | `src/features/cards/repository.test.ts:66` — `toEqual(ids)` (com cartão de outro baralho excluído) | SPEC | ✅ |
| CRD-03 | id existente → cartão; inexistente → `null` | `src/features/cards/repository.test.ts:74` — `toEqual(card)`; `:75`/`:76` — `toBeNull()` | SPEC | ✅ |
| CRD-04 | novos textos; agendamento e `createdAt` idênticos | `src/features/cards/repository.test.ts:119` — `toEqual({ ...before, back: "novo" })`; `:121` — `toMatchObject({ easeFactor: 1.9, intervalDays: 6, repetitions: 3, lapses: 1, dueDate: due, createdAt: t0 })` | SPEC | ✅ |
| CRD-05 | remove do banco e da lista do baralho | `src/features/cards/repository.test.ts:169` — `getById` `toBeNull()`; `:170` — lista `[keep.id]` | SPEC | ✅ |
| CRD-06 | `CARD_FRONT_EMPTY`/`CARD_BACK_EMPTY`, front primeiro, nada gravado | `src/features/cards/repository.test.ts:87`–`:90` (`""`,`""` → FRONT; 0 cartões); edição `:137`/`:140`/`:143` | SPEC | ✅ |
| CRD-07 | `CARD_NOT_FOUND` em edição/exclusão | `src/features/cards/repository.test.ts:150`, `:153`, `:156` — code `CARD_NOT_FOUND` | SPEC | ✅ |
| CRD-08 | logs do cartão excluído intactos | `src/features/cards/repository.test.ts:191` — 2 logs; `:192` — todos com `cardId` do cartão | SPEC | ✅ |
| HK-01 | toda leitura/escrita como hook | `src/features/decks/usecases/decks.test.tsx:48`–`:69` (list, item, create, update, remove); `src/features/cards/usecases/cards.test.tsx:63`–`:87` (list, item, create, update, remove) | SPEC | ✅ |
| HK-02 | leituras montadas atualizam sem remontar (tabela) | baralho: `src/features/decks/usecases/decks.test.tsx:97` (criar → lista), `:103`/`:104` (atualizar → item + lista), `:109`/`:110` (excluir → item + lista); cartão: `src/features/cards/usecases/cards.test.tsx:101`/`:102` e `:107`/`:108` (criar/excluir → `cardCount` + lista), `:119`/`:120` (editar → item + lista), `:131`/`:132` (excluir baralho → cartões) | SPEC | ✅ |
| HK-03 | offline: hooks de leitura **e** escrita executam, nada pausado | cartões: `src/features/cards/usecases/cards.test.tsx:153`/`:154` + `:167`/`:169` (useCards, useCard, useDecks, create/update/delete) ✅; baralhos: `src/features/decks/usecases/decks.test.tsx:118`–`:123` cobre só `useDecks` e `useCreateDeck`. `useDeck` é montado mas nunca afirmado; `useUpdateDeck` e `useDeleteDeck` nunca rodam offline → mutantes M1–M3 sobrevivem | SPEC | ❌ gap |
| HK-04 | erro exposto com `error.code` | `src/features/decks/usecases/decks.test.tsx:138` — `error?.code` `toBe("DECK_NAME_EMPTY")`; `src/features/cards/usecases/cards.test.tsx:183` — `toBe("CARD_FRONT_EMPTY")` | SPEC | ✅ |
| HK-05 | objetos simples, legíveis após exclusão | `src/features/decks/usecases/decks.test.tsx:79` — `not.toBeInstanceOf(Realm.Object)`, `:84` — `kept.name`; `src/features/cards/usecases/cards.test.tsx:140`, `:146` | SPEC | ✅ |
| HK-06 | após escrita rejeitada, leituras montadas iguais | `src/features/decks/usecases/decks.test.tsx:139` — `list.data` `toBe(before)`; `src/features/cards/usecases/cards.test.tsx:206`–`:208` — decks, list, item `toBe(before.*)` | SPEC | ✅ |
| ARC-01 | layout `interfaces.ts`, `repository.ts`, `adapters.ts`, `usecases/` | `src/features/architecture.test.ts:64` — `arrayContaining(["interfaces.ts","repository.ts"])`; `:69` — nenhum arquivo fora do permitido | SPEC | ✅ |
| ARC-05 | um só caso de uso → hook na raiz, sem `usecases/` | `src/features/architecture.test.ts:76`/`:77` e `:79` | SPEC | ✅ |
| ARC-02 | uma chamada React Query, um método do repositório | `src/features/architecture.test.ts:102` — `queries: 1`; `:106` — `calls: 1` | SPEC | ✅ |
| ARC-03 (A-02) | só repository/adapters/testes importam realm/@realm/src/db, alias ou relativo | `src/features/architecture.test.ts:93` — `offending` `toEqual([])` (resolve relativo em `:44`); `eslint.config.js:24` e `:30`. Sonda do verificador: `../../../db` em `usecases/probe.ts` reprovado pelo teste e pelo ESLint | SPEC | ✅ |
| ARC-04 | padrão descrito em ARCHITECTURE.md e AD-001 em STATE.md | `ARCHITECTURE.md:20`–`:39` (seção Feature modules + regras); `.specs/STATE.md:7`–`:8` (AD-001) — critério documental, verificado por leitura | SPEC | ✅ |

## Invariants

| Invariant | Evidence (`file:line`) | Breaking mutation attempted | Result |
| --- | --- | --- | --- |
| INV-01 | `src/features/decks/repository.test.ts:112` — `Set(names).size` `toBe(names.length)` após cada passo; `:115`/`:116` | M15 (exclusão do próprio id removida) — atinge DCK-10, não INV-01 | ✅ held |
| INV-02 | `src/features/decks/repository.test.ts:258` — `Card` total = soma de `deck.cards` após cada passo | — (só operações de baralho; ver Change Review) | ✅ held |
| INV-03 | `src/features/cards/repository.test.ts:239` — snapshot de `ReviewLog` `toEqual(initial)` após cada passo | — | ✅ held |

## Discrimination

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| M1 | `src/features/decks/usecases/use-deck.ts:10` | `networkMode: "online"` no `useQuery` | ❌ survived (não equivalente: sonda offline → `item.isSuccess` nunca `true`) |
| M2 | `src/features/decks/usecases/use-update-deck.ts:17` | `networkMode: "online"` no `useMutation` | ❌ survived (não equivalente: sonda offline → `mutateAsync` pausa, timeout 5 s) |
| M3 | `src/features/decks/usecases/use-delete-deck.ts:14` | `networkMode: "online"` no `useMutation` | ❌ survived (não equivalente: sonda offline → timeout 5 s) |
| M4 | `src/features/decks/usecases/use-decks.ts:10` | `networkMode: "online"` | ✅ (HK-03 decks + cards) |
| M5 | `src/features/decks/usecases/use-create-deck.ts:13` | `networkMode: "online"` | ✅ (HK-03 decks) |
| M6 | `src/features/cards/usecases/use-cards.ts:10` | `networkMode: "online"` | ✅ (HK-03 cards) |
| M7 | `src/features/cards/usecases/use-card.ts:10` | `networkMode: "online"` | ✅ (HK-03 cards) |
| M8 | `src/features/cards/usecases/use-create-card.ts:18` | `networkMode: "online"` | ✅ (HK-03 cards) |
| M9 | `src/features/cards/usecases/use-update-card.ts:17` | `networkMode: "online"` | ✅ (HK-03 cards) |
| M10 | `src/features/cards/usecases/use-delete-card.ts:14` | `networkMode: "online"` | ✅ (HK-03 cards) |
| M11 | `src/features/decks/usecases/use-delete-deck.ts:18` | removida invalidação de `["cards"]` | ✅ (HK-02 excluir baralho) |
| M12 | `src/features/cards/usecases/use-update-card.ts:18` | invalida só `["cards","deck"]` | ✅ (HK-02 editar cartão) |
| M13 | `src/features/cards/usecases/use-delete-card.ts:18` | removida invalidação de `["decks"]` | ✅ (HK-02 cardCount) |
| M14 | `src/features/decks/repository.ts:70` | `input.description \|\| undefined` → `input.description` | ✅ (A-01) |
| M15 | `src/features/decks/repository.ts:33` | removida a exclusão do próprio id | ✅ (DCK-10, DCK-04) |
| M16 | `src/features/decks/usecases/use-create-deck.ts:14` | `onSuccess` → `onSettled` | ✅ (HK-06 decks) |
| M17 | `src/features/cards/repository.ts:59` | `push` → `unshift` | ✅ (CRD-01, CRD-02, HK-02) |
| M18 | `src/features/decks/adapters.ts:9` | `?? undefined` → `?? ""` | ✅ (A-01) |
| M19 | `src/features/cards/repository.ts:72` | edição também reescreve `dueDate` | ✅ (CRD-04) |

**Result**: 19 injected · 16 killed · 3 survived · 0 equivalent
**Isolation**: worktree `verify-wt3` em `a2601a5` (scratchpad), `node_modules` por symlink; mutantes e sondas revertidos e worktree removida com `git worktree remove --force`; porcelain da árvore real igual à linha de base (só `validation.md` alterado).

## Amendments Reconciled

| Amendment | AC text | Code | Test |
| --- | --- | --- | --- |
| A-01 | ✅ DCK-04 marcado *(A-01)* com regra omitida/`""` | ✅ `src/features/decks/repository.ts:69`–`:70` | `src/features/decks/repository.test.ts:142` (omitida mantém) e `:146`/`:147` (`""` remove); M14/M18 mortos |
| A-02 | ✅ ARC-03 marcado *(A-02)*, isenta testes, qualquer caminho | ✅ `eslint.config.js:12`–`:30` (ignores de teste + regex relativo) | `src/features/architecture.test.ts:83`–`:93` (isenção em `:85`, relativo em `:44`); sonda `../../../db` reprovada |

## UAT

Não executado (sem telas nesta feature; HIGH sem UAT previsto no plan).

## Change Review

- Scope matches spec In scope: ✅ (repositórios, hooks, `QueryClientProvider` em `src/app/_layout.tsx`, padrão documentado e com lint/teste)
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅ (busca por `.only`, `.skip`, `xit(`, `console.log`, `debugger` em `src/features`, `src/lib`, `src/testing`: nenhum resultado)
- Tests anchored and necessary: ✅, com a exceção de HK-03 em baralhos (ver Gaps)
- Observações não bloqueantes:
  1. `.specs/STATE.md` Handoff está desatualizado: diz "Verify PASS HIGH, verificação pelo autor com reset de contexto", o que não bate com os rounds de verificação independente nem com este FAIL. Atualizar no handoff.
  2. INV-02 é exercitado só com operações de baralho (`repository.test.ts:235`–`:261`); operações de cartão aparecem no teste de INV-03 sem checar órfãos. O código de cartão não cria órfãos (`push` na mesma escrita), então é só adequação.
  3. `DeckInput.name` é obrigatório no update: para mudar só a descrição a tela precisa reenviar o nome atual. Compatível com DCK-04 ("name e/ou description"), mas vale registrar para as telas.
  4. Chaves cruzadas entre features são literais (`["cards"]` em `use-delete-deck.ts:18`, `["decks"]` em `use-create-card.ts:22`/`use-delete-card.ts:18`) para não importar entre features. Aceitável; se uma chave mudar, a invalidação quebra sem aviso de tipo.
  5. HK-06 em baralhos afirma só a lista (`decks.test.tsx:139`); o item montado é `"missing"`/`null`. Cartões cobrem lista, item e `cardCount`.

## Gaps & Fix Tasks

1. **HK-03 (baralhos), mutantes M1–M3 sobrevivem.** O teste `src/features/decks/usecases/decks.test.tsx:114`–`:125` só afirma `useDecks` e `useCreateDeck` offline. Um `networkMode: "online"` por hook em `useDeck`, `useUpdateDeck` ou `useDeleteDeck` pausa o hook offline (confirmado por sonda: item não chega a `isSuccess`; update/delete dão timeout) e a suíte segue verde. Correção sugerida: estender o teste HK-03 de baralhos para montar com um id existente, esperar `item.isSuccess` com `fetchStatus` diferente de `"paused"` e executar `update` e `remove` offline até `isSuccess`. É o mesmo padrão de F5 para cartões. → F6 (proposto). **Este é o round 3 de 3: escalar ao usuário em vez de abrir outro ciclo automático.**

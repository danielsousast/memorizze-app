# Deck & Card CRUD — Validation

**Verdict**: FAIL
**Risk**: HIGH (from spec)
**Verifier**: independent sub-agent
**Diff range**: `7e36c93..fdea6f5`
**Date**: 2026-10-09

## Gate

- **Command**: full gate (plan.md → Verification Commands): `npm test && npx tsc --noEmit && npx expo lint`
- **Result**: 55 passed, 0 failed, 0 skipped (11 suites) @ `fb94e60` (HEAD; `fb94e60` só altera `.specs/`, código idêntico a `fdea6f5`); `tsc --noEmit` exit 0; `expo lint` exit 0
- **Test count**: 10 → 55 (+45; contagem de `it(` em `7e36c93`)
- **Skips**: none

## Acceptance Criteria Evidence

Caminhos abreviados: `decks/repo` = `src/features/decks/repository.test.ts`, `cards/repo` = `src/features/cards/repository.test.ts`, `decks/hooks` = `src/features/decks/usecases/decks.test.tsx`, `cards/hooks` = `src/features/cards/usecases/cards.test.tsx`, `arch` = `src/features/architecture.test.ts`.

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| DCK-01 | name aparado, `createdAt` = agora, 0 cartões, devolve o baralho | `src/features/decks/repository.test.ts:46` — `expect(deck).toEqual({ id, name: "Inglês", description: "x", createdAt: t0, cardCount: 0 })`; `:53` 1 registro gravado. Obs.: caminho sem `description` (opcional) não é exercitado | SPEC | ✅ |
| DCK-02 | todos os baralhos por `createdAt` crescente, com `cardCount` | `src/features/decks/repository.test.ts:66` — `toEqual(["A","B","C"])`; `:67` — `cardCount` `[0,0,2]` | SPEC | ✅ |
| DCK-03 | id existente → baralho; inexistente → `null` | `src/features/decks/repository.test.ts:74` — `toEqual(created)`; `:75`, `:76` — `toBeNull()` | SPEC | ✅ |
| DCK-04 | grava novos `name` e/ou `description`, name aparado, `createdAt` e cartões intactos | `src/features/decks/repository.test.ts:126` — `toEqual({ id, name: "Espanhol", description: "y", createdAt: t0, cardCount: 2 })`; `:135` ids dos cartões. **Lacuna**: "e/ou" não é definido para update que omite `description`; o código (`decks/repository.ts:68`) apaga a descrição (sonda: `update(id, {name:"B"})` → `description` `null`) e nenhum teste fixa nenhum dos dois comportamentos (mutante M14 sobreviveu) | SPEC | ⚠️ spec-precision gap |
| DCK-05 | apaga o baralho e todos os seus cartões | `src/features/decks/repository.test.ts:191` — deck `toBeNull()`; `:193` — cada card `toBeNull()` | SPEC | ✅ |
| DCK-06 | `DECK_NAME_EMPTY`, nada gravado | `src/features/decks/repository.test.ts:82` — `toThrow(objectContaining({ code: "DECK_NAME_EMPTY" }))` + `:85` 0 decks; update `:160`/`:163` | SPEC | ✅ |
| DCK-07 | `DECK_NAME_DUPLICATE` ignorando caixa/espaços, nada gravado | `src/features/decks/repository.test.ts:92` — code `DECK_NAME_DUPLICATE` + `:95` 1 deck; update `:150`/`:153` | SPEC | ✅ |
| DCK-08 | `DECK_NOT_FOUND` em update/remove/criação de cartão, nada gravado | `src/features/decks/repository.test.ts:171`, `:174`, `:177` — code `DECK_NOT_FOUND`; `:180-181` estado intacto; `src/features/cards/repository.test.ts:98` — code `DECK_NOT_FOUND` + `:99` 0 cards | SPEC | ✅ |
| DCK-09 | cartões de outros baralhos e todos os ReviewLog inalterados | `src/features/decks/repository.test.ts:217` — cards de B iguais; `:218-220` — 2 cards, 2 logs, `cardId`s preservados; "inalterados" em todos os campos via INV-03 (`cards/repo:239`) | SPEC | ✅ |
| DCK-10 | update mantendo o próprio nome (outra caixa) aceito | `src/features/decks/repository.test.ts:142` — `.name` `toBe("INGLÊS")` | SPEC | ✅ |
| CRD-01 | textos aparados, ease 2.5, 0/0/0, `dueDate` = `createdAt` = agora, no fim da lista | `src/features/cards/repository.test.ts:43` — `toEqual({...front:"a", back:"b", easeFactor:2.5, intervalDays:0, repetitions:0, lapses:0, dueDate:t0, createdAt:t0})`; `:54` — `[first.id, card.id]` | SPEC | ✅ |
| CRD-02 | cartões na ordem de inserção | `src/features/cards/repository.test.ts:66` — `toEqual(ids)` (com cartão de outro baralho excluído) | SPEC | ✅ |
| CRD-03 | id existente → cartão; inexistente → `null` | `src/features/cards/repository.test.ts:74` — `toEqual(card)`; `:75`, `:76` — `toBeNull()` | SPEC | ✅ |
| CRD-04 | novos textos; ease/interval/reps/lapses/due/createdAt idênticos | `src/features/cards/repository.test.ts:119` — `toEqual({ ...before, back: "novo" })`; `:121` — `toMatchObject({ easeFactor:1.9, intervalDays:6, repetitions:3, lapses:1, dueDate:due, createdAt:t0 })` | SPEC | ✅ |
| CRD-05 | removido do banco e da lista do baralho | `src/features/cards/repository.test.ts:169` — `toBeNull()`; `:170` — `deckCardIds` `[keep.id]` | SPEC | ✅ |
| CRD-06 | `CARD_FRONT_EMPTY`/`CARD_BACK_EMPTY`, front primeiro, nada gravado | `src/features/cards/repository.test.ts:87-90` — códigos + `("", "")` → FRONT + 0 cards; update `:137`, `:140`, `:143` | SPEC | ✅ |
| CRD-07 | `CARD_NOT_FOUND` em edição/exclusão | `src/features/cards/repository.test.ts:150`, `:153`, `:156` — code `CARD_NOT_FOUND` | SPEC | ✅ |
| CRD-08 | ReviewLog do cartão continuam, inalterados | `src/features/cards/repository.test.ts:191-192` — 2 logs com o `cardId`; demais campos via INV-03 (`:239`) | SPEC | ✅ |
| HK-01 | toda leitura/escrita disponível como hook | `src/features/decks/usecases/decks.test.tsx:48-49` (useDecks/useDeck), `:55`, `:64`, `:69`; `src/features/cards/usecases/cards.test.tsx:61-62`, `:71`, `:80`, `:85` | SPEC | ✅ |
| HK-05 | objetos simples, legíveis após exclusão | `src/features/decks/usecases/decks.test.tsx:79` — `not.toBeInstanceOf(Realm.Object)`; `:84` — `kept.name` após remove; `src/features/cards/usecases/cards.test.tsx:138`, `:144` | SPEC | ✅ |
| HK-02 | leituras montadas atualizam conforme a tabela | decks: `src/features/decks/usecases/decks.test.tsx:97` (create→lista), `:103-104` (update→item+lista), `:109-110` (delete→item+lista); cards: `src/features/cards/usecases/cards.test.tsx:99-100` (create→cardCount+lista), `:105-106` (delete→cardCount+lista), `:117-118` (edit→item+lista) | SPEC | ✅ |
| HK-03 | offline: consultas e mutações não pausam | `src/features/decks/usecases/decks.test.tsx:118-123` — `isSuccess`, `fetchStatus` ≠ `"paused"`, create `isSuccess`; `src/lib/query-client.test.ts:7-13` — `networkMode: "always"` em queries e mutations (config compartilhada pelos hooks de cards, que não são exercitados offline) | SPEC | ✅ |
| HK-04 | hook expõe `error.code` | `src/features/decks/usecases/decks.test.tsx:138` — `toBe("DECK_NAME_EMPTY")`; `src/features/cards/usecases/cards.test.tsx:158` — `toBe("CARD_FRONT_EMPTY")` | SPEC | ✅ |
| HK-06 | após escrita rejeitada, leituras montadas mostram os mesmos dados | decks: `src/features/decks/usecases/decks.test.tsx:139` — `list.data` `toBe(before)`. Cards: sem asserção (buscado `isError`/`before` em `cards.test.tsx`: só `:157-158`, sem checar leituras); mutante M17 (update otimista sem rollback em `useCreateCard`) sobreviveu | SPEC | ❌ gap (cards) |
| ARC-01 | `interfaces.ts`, `repository.ts`, `adapters.ts` opcional, `usecases/` um hook por arquivo | `src/features/architecture.test.ts:40` — `arrayContaining(["interfaces.ts","repository.ts"])`; `:45` — nada fora do permitido; `:63-66` — 1 chamada React Query por arquivo de hook | SPEC | ✅ |
| ARC-05 | feature com um caso de uso: hook na raiz, sem `usecases/` | `src/features/architecture.test.ts:52-55` — `usecases/` ⇒ ≥2 hooks e raiz vazia; sem `usecases/` ⇒ ≤1 hook na raiz | SPEC | ✅ |
| ARC-02 | uma chamada React Query por hook, um método de repositório | `src/features/architecture.test.ts:63` — `queries: 1`; `:67` — `calls: 1` | SPEC | ✅ |
| ARC-03 | em `src/features/`, só `repository.ts`/`adapters.ts` importam `realm`, `@realm/react`, `@/db` | Só configuração: `eslint.config.js:12-24` (`group: ["realm","@realm/*","@/db","@/db/*"]`); nenhum teste automatizado prova que a regra dispara. Sondas: `import "@/db"`, `@realm/react`, `realm`, `@/db/schemas/deck` → lint falha (ok); **`import "../../../db"` e `"../../db/schemas"` → lint passa** (bypass). Além disso, o config isenta `*.test.ts(x)`, que importam `realm`/`@/db`; o spec não prevê essa exceção | SPEC | ❌ gap + ⚠️ spec-precision gap |
| ARC-04 | padrão descrito em ARCHITECTURE.md e `AD-001` em STATE.md | `ARCHITECTURE.md:33`, `:37-38` (regras ARC-05/03/02 e layout `:25-31`); `.specs/STATE.md:7-13` (`### AD-001`) — evidência documental, não teste | SPEC | ✅ |

## Invariants

| Invariant | Evidence (`file:line`) | Breaking mutation attempted | Result |
| --- | --- | --- | --- |
| INV-01 | `src/features/decks/repository.test.ts:112` — `new Set(names).size` `toBe(names.length)` após cada passo (100 passos, seed 42) | M3: comparação sem `toLocaleLowerCase` no lado armazenado | ✅ killed |
| INV-02 | `src/features/decks/repository.test.ts:246` — `objects(Card)` `toHaveLength(inDecks)` após cada passo. Obs.: o loop só usa operações de baralho; operações de cartão não entram na propriedade (CRD-01/05 cobrem diretamente) | M2: remove sem `realm.delete(deck.cards)` | ✅ killed |
| INV-03 | `src/features/cards/repository.test.ts:239` — `snapshot()` `toEqual(initial)` após cada uma das 100 operações de deck+card | M5: `remove` de cartão apaga ReviewLogs do `cardId` | ✅ killed |

## Discrimination

Mutações escolhidas pelo verificador, aplicadas em worktree descartável (`git worktree add … fdea6f5 --detach`, `node_modules` por symlink), rodando `npx jest src/features/decks src/features/cards` (ou `npx eslint <arquivo>` nas sondas L).

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| M1 | `src/features/decks/repository.ts:33` | exclusão do próprio id removida (`ownId && false`) | ✅ (DCK-10) |
| M2 | `src/features/decks/repository.ts:76` | removido `realm.delete(deck.cards)` | ✅ (DCK-05, DCK-09, INV-02, HK-02) |
| M3 | `src/features/decks/repository.ts:34` | nome armazenado comparado sem `toLocaleLowerCase` | ✅ (DCK-07, INV-01) |
| M4 | `src/features/cards/repository.ts:59` | `push` → `unshift` | ✅ (CRD-01, CRD-02, HK-02) |
| M5 | `src/features/cards/repository.ts:80` | `remove` também apaga ReviewLog do cartão | ✅ (CRD-08) |
| M6 | `src/features/cards/usecases/use-create-card.ts:22` | sem invalidar `["decks"]` | ✅ (HK-02) |
| M7 | `src/features/cards/usecases/use-delete-card.ts:17` | sem invalidar `cardKeys.all` | ✅ (HK-02, HK-05) |
| M8 | `src/features/cards/usecases/use-update-card.ts:18` | invalidação com `exact: true` | ✅ (HK-02) |
| M9 | `src/features/decks/usecases/use-delete-deck.ts:18` | sem invalidar `["cards"]` | ✅ (HK-02 cards) |
| M10 | `src/features/decks/usecases/use-update-deck.ts:18` | invalidação com `exact: true` | ✅ (HK-02) |
| M11 | `src/lib/query-client.ts:8` | mutations sem `networkMode: "always"` | ✅ (HK-03) |
| M12 | `src/features/decks/usecases/use-create-deck.ts:14` | `onSuccess` → `onSettled` | ✅ (HK-06) |
| M13 | `src/features/cards/usecases/use-create-card.ts:19` | `onSuccess` → `onSettled` | ❌ survived — equivalente frente ao spec (refetch devolve os mesmos valores); não contado como lacuna |
| M14 | `src/features/decks/repository.ts:68` | só grava `description` quando informada (`!== undefined`) | ❌ survived → F1 (DCK-04) |
| M15 | `src/features/cards/repository.ts:73` | `update` também reescreve `dueDate = now()` | ✅ (CRD-04) |
| M16 | `src/features/decks/repository.ts:55` | `description` aparada/vazia → undefined | ❌ survived — fora do spec (nenhum AC normaliza `description`); não contado |
| M17 | `src/features/cards/usecases/use-create-card.ts:19` | `onMutate` com update otimista sem rollback | ❌ survived → F2 (HK-06) |
| M18 | `src/features/decks/usecases/use-create-deck.ts:14` | mesmo `onMutate` otimista em decks | ✅ (HK-06) |
| L1 | `src/features/decks/usecases/use-deck.ts:1` | `import "@/db"` | ✅ lint falha (`no-restricted-imports`) |
| L2 | `src/features/decks/usecases/use-deck.ts:1` | `import "../../../db"` | ❌ survived → F3 (ARC-03) |
| L3 | `src/features/decks/index.ts:1` | `import { useRealm } from "@realm/react"` | ✅ lint falha |
| L4 | `src/features/decks/interfaces.ts:1` | `import type Realm from "realm"` | ✅ lint falha |
| L5 | `src/features/decks/interfaces.ts:1` | `import type … from "@/db/schemas/deck"` | ✅ lint falha |
| L6 | `src/features/decks/interfaces.ts:1` | `import type … from "../../db/schemas"` | ❌ survived → F3 (ARC-03) |

**Result**: 24 injected · 18 killed · 6 survived (M13 e M16 equivalentes/fora do spec; **4 relevantes**: M14, M17, L2, L6)
**Isolation**: scratch worktree removido com `git worktree remove --force`; porcelain da árvore real igual à baseline (limpa) antes de escrever este arquivo

## Amendments Reconciled

Nenhuma emenda registrada.

## UAT

Não aplicável nesta feature (sem telas; só dados e hooks).

## Change Review

- Scope matches spec In scope: ✅ — repositórios, hooks, `QueryClientProvider` em `src/app/_layout.tsx`, padrão documentado. Nada de Out of scope (sem telas, busca, contagem de vencidos).
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅ — sem `.only`/`.skip`/`console.log`. `.specs/PROJECT.md` e `.specs/TESTING.md` atualizados (docs de suporte, coerentes com o diff).
- Tests anchored and necessary: ✅ — cada teste nomeado pelo AC/INV. `src/testing/providers.test.tsx` e `src/lib/query-client.test.ts` testam infra de suporte.
- Observações (menores):
  1. `use-delete-deck.ts:18` e `use-create-card.ts:22`/`use-delete-card.ts:18` usam literais `["cards"]`/`["decks"]` em vez de `cardKeys.all`/`deckKeys.all` — evita import entre features, mas as chaves podem divergir silenciosamente se um `keys.ts` mudar.
  2. `usecases/keys.ts` é arquivo não-hook dentro de `usecases/`; ARC-01 fala em "um hook por arquivo". Documentado em `ARCHITECTURE.md:29`, mas o spec não o prevê.
  3. `listByDeck` de baralho inexistente devolve `[]` (`src/features/cards/repository.ts:38`); comportamento não especificado nem testado.
  4. Em `cards.create`, a validação de texto precede a checagem do baralho (`CARD_*_EMPTY` vence `DECK_NOT_FOUND`); spec silencioso.
  5. Nenhuma superengenharia relevante: `AppError` genérico, `createRandom` e `renderHookWithProviders` têm mais de um uso.

## Gaps & Fix Tasks

1. **DCK-04 — semântica de "name e/ou description" indefinida; update sem `description` apaga a descrição** (`src/features/decks/repository.ts:68`; sonda confirmou `null`). Nenhum teste fixa o comportamento (M14 sobreviveu). → Emenda de clarificação no spec (omitir = manter? ou `description` sempre obrigatória no update?) + F1: teste que fixe o comportamento escolhido (`update(id, { name })` em baralho com descrição).
2. **HK-06 — sem cobertura para hooks de cartão** (`src/features/cards/usecases/cards.test.tsx:148-160` não verifica as leituras montadas após rejeição; M17 sobreviveu). → F2: após `useCreateCard`/`useUpdateCard` rejeitado, `list.data`/`item.data`/`decks.data` iguais aos de antes.
3. **ARC-03 — enforcement incompleto**: imports relativos para `src/db` (`../../../db`, `../../db/schemas`) passam no lint (L2, L6); não há teste automatizado de que a regra dispara. → F3: estender `no-restricted-imports` (ex.: padrões `**/db`, `**/db/*`) ou checagem em `architecture.test.ts` que varra imports de `src/features/**` (exceto repository/adapters/testes).
4. **ARC-03 — spec-precision**: o spec não isenta arquivos de teste, mas `eslint.config.js:16` isenta e os testes importam `realm`/`@/db`. → Emenda de clarificação no ARC-03 ("exceto `*.test.ts(x)`").

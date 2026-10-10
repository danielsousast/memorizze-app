# Deck & Card CRUD — Validation

**Verdict**: FAIL
**Risk**: HIGH (from spec)
**Verifier**: independent sub-agent
**Diff range**: `7e36c93..071842e`
**Date**: 2026-10-09

Rodada de re-verificação 2 de 3 (após F1–F3). Completude: T1–T8 e F1–F3 em `[x] done` no plan.md; A-01 e A-02 com `Status: approved` (nenhuma `proposed`).

## Gate

- **Command**: full gate (plan.md → Verification Commands): `npm test && npx tsc --noEmit && npx expo lint`
- **Result**: primeira execução verde — 59 passed, 0 failed, 0 skipped (11 suites) @ `071842e`; `tsc --noEmit` exit 0; `expo lint` exit 0
- **Estabilidade**: **o gate não é determinístico.** `deck hooks › HK-03 runs reads and writes while offline` falha de forma intermitente no código sem mutação: 2/6 execuções de `npm test` na árvore real, 2/10 execuções isoladas de `decks.test.tsx` e 2/8 execuções do escopo da feature no worktree. Falha sempre em `src/features/decks/usecases/decks.test.tsx:123` — `expect(result.current.create.isSuccess).toBe(true)` (`Received: false`), lido logo após o `act` sem `waitFor`. A mutação concluiu (o `mutateAsync` resolveu); só o estado do observer ainda não tinha sido notificado (hipótese: o `notifyManager` do React Query agenda as notificações num tick posterior). Os demais testes de hook usam `waitFor` para ler `isError`/`isSuccess`.
- **Test count**: 10 → 59 (+49; contagem de `it(` em `7e36c93`, e `describe.each` de `architecture.test.ts` sobre 2 features)
- **Skips**: none

## Acceptance Criteria Evidence

Spec com as emendas aplicadas (A-01 em DCK-04, A-02 em ARC-03).

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| DCK-01 | name aparado, `createdAt` = agora, 0 cartões, devolve o baralho | `src/features/decks/repository.test.ts:46` — `expect(deck).toEqual({ id, name: "Inglês", description: "x", createdAt: t0, cardCount: 0 })`; `:53` — 1 registro gravado | SPEC | ✅ |
| DCK-02 | todos por `createdAt` crescente, com `cardCount` | `src/features/decks/repository.test.ts:66` — nomes `["A","B","C"]` (criados fora de ordem); `:67` — `cardCount` `[0,0,2]` | SPEC | ✅ |
| DCK-03 | id existente → baralho; inexistente → `null` | `src/features/decks/repository.test.ts:74` — `toEqual(created)`; `:75`, `:76` — `toBeNull()` (id válido ausente e id inválido) | SPEC | ✅ |
| DCK-04 (A-01) | grava novos valores, name aparado, `createdAt` e cartões intactos; `description` omitida mantém; `""` remove | `src/features/decks/repository.test.ts:126` — `toEqual({ id, name: "Espanhol", description: "y", createdAt: t0, cardCount: 2 })`; `:135` — ids dos cartões iguais; `:142` — `update(id, { name: "B" }).description` `toBe("d")`; `:143` — releitura `"d"`; `:146` — sem `description` após `""`; `:147` — campo Realm `toBeNull()` | SPEC | ✅ |
| DCK-05 | apaga o baralho e todos os seus cartões | `src/features/decks/repository.test.ts:203` — deck `toBeNull()`; `:205` — cada cartão `toBeNull()` | SPEC | ✅ |
| DCK-06 | `DECK_NAME_EMPTY`, nada gravado | `src/features/decks/repository.test.ts:82` — `toThrow(objectContaining({ code: "DECK_NAME_EMPTY" }))`; `:85` — 0 decks; update `:172`, `:175` — valores intactos | SPEC | ✅ |
| DCK-07 | `DECK_NAME_DUPLICATE` ignorando caixa/espaços, nada gravado | `src/features/decks/repository.test.ts:92` — code `DECK_NAME_DUPLICATE`; `:95` — 1 deck; update `:162`, `:165` — `getById` igual ao anterior | SPEC | ✅ |
| DCK-08 | `DECK_NOT_FOUND` em update/remove/criação de cartão, nada gravado | `src/features/decks/repository.test.ts:183`, `:186`, `:189` — code `DECK_NOT_FOUND`; `:192-193` — estado intacto; `src/features/cards/repository.test.ts:96-98` — code `DECK_NOT_FOUND`; `:99` — 0 cards | SPEC | ✅ |
| DCK-09 | cartões de outros baralhos e todos os ReviewLog inalterados | `src/features/decks/repository.test.ts:229` — cartões de B iguais; `:230-232` — 2 cards, 2 logs, `cardId`s preservados; demais campos dos logs via INV-03 (`src/features/cards/repository.test.ts:239`) | SPEC | ✅ |
| DCK-10 | update mantendo o próprio nome em outra caixa aceito | `src/features/decks/repository.test.ts:154` — `.name` `toBe("INGLÊS")` | SPEC | ✅ |
| CRD-01 | textos aparados, ease 2.5, 0/0/0, `dueDate` = `createdAt` = agora, no fim da lista | `src/features/cards/repository.test.ts:43` — `toEqual({ front: "a", back: "b", easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0, dueDate: t0, createdAt: t0 })`; `:54` — `[first.id, card.id]` | SPEC | ✅ |
| CRD-02 | cartões na ordem de inserção | `src/features/cards/repository.test.ts:66` — `toEqual(ids)` (cartão de outro baralho fora) | SPEC | ✅ |
| CRD-03 | id existente → cartão; inexistente → `null` | `src/features/cards/repository.test.ts:74` — `toEqual(card)`; `:75`, `:76` — `toBeNull()` | SPEC | ✅ |
| CRD-04 | novos textos; ease/interval/reps/lapses/due/createdAt idênticos | `src/features/cards/repository.test.ts:119` — `toEqual({ ...before, back: "novo" })`; `:121-129` — `toMatchObject({ front: "a", easeFactor: 1.9, intervalDays: 6, repetitions: 3, lapses: 1, dueDate: due, createdAt: t0 })` | SPEC | ✅ |
| CRD-05 | removido do banco e da lista do baralho | `src/features/cards/repository.test.ts:169` — `toBeNull()`; `:170` — `deckCardIds` `[keep.id]` | SPEC | ✅ |
| CRD-06 | `CARD_FRONT_EMPTY`/`CARD_BACK_EMPTY`, front primeiro, nada gravado | `src/features/cards/repository.test.ts:87-90` — códigos, `("", "")` → FRONT, 0 cards; edição `:137`, `:140`, `:143` — cartão intacto | SPEC | ✅ |
| CRD-07 | `CARD_NOT_FOUND` em edição/exclusão | `src/features/cards/repository.test.ts:150`, `:153`, `:156` — code `CARD_NOT_FOUND` | SPEC | ✅ |
| CRD-08 | ReviewLog do cartão continuam, inalterados | `src/features/cards/repository.test.ts:191-192` — 2 logs com o `cardId`; demais campos via INV-03 (`:239`) | SPEC | ✅ |
| HK-01 | toda leitura/escrita disponível como hook | `src/features/decks/usecases/decks.test.tsx:48-49` (useDecks/useDeck), `:55` (create), `:64` (update), `:69` (delete); `src/features/cards/usecases/cards.test.tsx:61-62` (useCards/useCard), `:71`, `:80`, `:85` | SPEC | ✅ |
| HK-05 | objetos simples, legíveis após exclusão | `src/features/decks/usecases/decks.test.tsx:79` — `not.toBeInstanceOf(Realm.Object)`; `:84` — `kept.name` após remove; `src/features/cards/usecases/cards.test.tsx:138`, `:144` | SPEC | ✅ |
| HK-02 | leituras montadas atualizam conforme a tabela | decks: `src/features/decks/usecases/decks.test.tsx:97` (create→lista), `:103-104` (update→item+lista), `:109-110` (delete→item+lista); cards: `src/features/cards/usecases/cards.test.tsx:99-100` (create→`cardCount`+lista), `:105-106` (delete→`cardCount`+lista), `:117-118` (edit→item+lista), `:129-130` (delete de baralho→cartões) | SPEC | ✅ |
| HK-03 | offline: consultas e mutações dos hooks não pausam | decks: `src/features/decks/usecases/decks.test.tsx:118-119` — `isSuccess`, `fetchStatus` ≠ `"paused"`; `:123` — create `isSuccess` (**intermitente**, ver Gate); config: `src/lib/query-client.test.ts:7-12` — `networkMode: "always"`. Cards: nenhum teste offline (buscado `onlineManager`/`setOnline`/`paused` em `src/features/cards/`: sem ocorrências); mutantes M5 e M15 (override `networkMode: "online"` em `useCards`/`useCreateCard`) sobreviveram | SPEC | ❌ gap (cards + teste intermitente) |
| HK-04 | hook expõe `error.code` | `src/features/decks/usecases/decks.test.tsx:138` — `toBe("DECK_NAME_EMPTY")`; `src/features/cards/usecases/cards.test.tsx:158` — `toBe("CARD_FRONT_EMPTY")` | SPEC | ✅ |
| HK-06 | após escrita rejeitada, leituras montadas mostram os mesmos dados | decks: `src/features/decks/usecases/decks.test.tsx:139` — `list.data` `toBe(before)`; cards (F2): `src/features/cards/usecases/cards.test.tsx:181-183` — `decks.data`, `list.data`, `item.data` `toBe(before.*)` após create e update rejeitados | SPEC | ✅ |
| ARC-01 | `interfaces.ts`, `repository.ts`, `adapters.ts` opcional, `usecases/` um hook por arquivo | `src/features/architecture.test.ts:64` — `arrayContaining(["interfaces.ts","repository.ts"])`; `:69` — nada fora do permitido na raiz; `:102-109` — 1 chamada React Query por arquivo de hook | SPEC | ✅ |
| ARC-05 | um caso de uso → hook na raiz, sem `usecases/` | `src/features/architecture.test.ts:76-77` — com `usecases/`: ≥2 hooks e raiz sem hook; `:79` — sem `usecases/`: ≤1 hook na raiz | SPEC | ✅ |
| ARC-02 | uma chamada React Query por hook, um método de repositório | `src/features/architecture.test.ts:102` — `queries: 1`; `:106` — `calls: 1` | SPEC | ✅ |
| ARC-03 (A-02) | só `repository.ts`, `adapters.ts` e testes importam `realm`, `@realm/react` ou `src/db`, por qualquer caminho | `src/features/architecture.test.ts:93` — `offending` `toEqual([])` (resolve alias e relativo até `src/db`, `:39-47`); `eslint.config.js:24` e `:30` — padrões alias e regex relativa. Sondas (worktree): `../../../db`, `../../../db/schemas`, `@/db`, `realm` em arquivos não isentos → lint e teste falham; `probe.test.ts` com `../../db` → isento | SPEC | ✅ |
| ARC-04 | padrão em ARCHITECTURE.md e `AD-001` em STATE.md | `ARCHITECTURE.md:24-38` (layout, ARC-05, regras ARC-03/02); `.specs/STATE.md:7-13` (`### AD-001`) — evidência documental | SPEC | ✅ |

## Invariants

| Invariant | Evidence (`file:line`) | Breaking mutation attempted | Result |
| --- | --- | --- | --- |
| INV-01 | `src/features/decks/repository.test.ts:112` — `new Set(names).size` `toBe(names.length)` após cada passo (100 passos, seed 42) | M7: exclusão do próprio id removida em `validName` (mata via DCK-10/A-01; INV-01 coberto também por DCK-07) | ✅ killed |
| INV-02 | `src/features/decks/repository.test.ts:258` — `objects(Card)` `toHaveLength(inDecks)` após cada passo | M10: `remove` sem `realm.delete(deck.cards)`; M6: `create` de cartão sem `push` no baralho | ✅ killed |
| INV-03 | `src/features/cards/repository.test.ts:239` — `snapshot()` `toEqual(initial)` após cada uma das 100 operações | (rodada anterior: remove de cartão apagando logs, killed); nesta rodada não repetido | ✅ held |

## Discrimination

Worktree descartável `git worktree add …/scratchpad/verify-wt2 071842e --detach` com `node_modules` por symlink; cada mutante rodou os 6 arquivos de teste da feature (`decks/repository`, `decks.test.tsx`, `cards/repository`, `cards.test.tsx`, `architecture`, `query-client`). Como `decks.test.tsx` HK-03 é intermitente, toda morte foi conferida pelo teste que falhou: M5 e M15 só "morreram" pelo HK-03 de decks (falha intermitente sem relação com o mutante) e foram re-executados 4× cada (2× sem os testes de decks): **sobreviveram em todas**.

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| M1 | `src/features/decks/repository.ts:69` | `if (input.description !== undefined)` → `if (true)` (comportamento pré-F1) | ✅ (DCK-04 A-01) |
| M2 | `src/features/decks/repository.ts:70` | `input.description \|\| undefined` → `input.description` (`""` gravado) | ✅ (DCK-04 A-01) |
| M3 | `src/features/cards/usecases/use-update-card.ts:18` | `onError` grava `null` no `cardKeys.detail(id)` | ✅ (HK-06 cards) |
| M4 | `src/features/cards/usecases/use-create-card.ts:19` | `onSuccess` → `onSettled` | ✅ (HK-06 cards, `:181`). Obs.: frente ao spec é equivalente (refetch devolve valores iguais); morre porque `toBe` exige a mesma referência e os campos `Date` impedem o structural sharing de reaproveitá-la |
| M5 | `src/features/cards/usecases/use-cards.ts:9` | `networkMode: "online"` no `useQuery` | ❌ survived → HK-03 (cards) |
| M6 | `src/features/cards/repository.ts:59` | removido `deck.cards.push(created)` | ✅ (CRD-01/02/05, HK-01/02) |
| M7 | `src/features/decks/repository.ts:33` | removida a exclusão do próprio id | ✅ (DCK-10, DCK-04) |
| M8 | `src/features/cards/usecases/use-delete-card.ts:18` | sem invalidar `["decks"]` | ✅ (HK-02 `cardCount`) |
| M9 | `src/lib/query-client.ts:7` | queries com `networkMode: "online"` | ✅ (query-client, HK-03 decks) |
| M10 | `src/features/decks/repository.ts:79` | removido `realm.delete(deck.cards)` | ✅ (DCK-05, DCK-09, INV-02, HK-02 cards) |
| M11 | `src/features/decks/usecases/use-create-deck.ts:14` | `onError` grava `[]` na lista | ✅ (HK-04/HK-06 decks) |
| M12 | `src/features/decks/usecases/use-update-deck.ts:18` | invalida só `deckKeys.detail("x")` | ✅ (HK-02 decks) |
| M13 | `src/features/cards/repository.ts:73` | `update` também grava `dueDate = now()` | ✅ (CRD-04) |
| M14 | `src/features/decks/usecases/use-delete-deck.ts:18` | sem invalidar `["cards"]` | ✅ (HK-02 cards `:129`) |
| M15 | `src/features/cards/usecases/use-create-card.ts:18` | `networkMode: "online"` no `useMutation` | ❌ survived → HK-03 (cards) |
| L1 | `src/features/decks/usecases/use-probe-rel.ts` (novo) | `import { Deck } from "../../../db"` | ✅ lint (`no-restricted-imports`) + `architecture.test.ts` ARC-03 |
| L2 | `src/features/decks/interfaces-probe.ts` (novo, raiz) | `import { Deck } from "@/db"` | ✅ lint + ARC-03 (e ARC-01: arquivo não permitido) |
| L3 | `src/features/cards/usecases/use-probe-deep.ts` (novo) | `"../../../db/schemas"` e `export … from "../../../db"`; antes, `import type Realm from "realm"` | ✅ lint + ARC-03 |
| L4 | `src/features/cards/probe.test.ts` (novo) | `import { Deck } from "../../db"` em teste | ✅ isento (A-02), nem lint nem ARC-03 acusam |

**Result**: 19 injected · 17 killed · 2 survived (M5, M15 — não equivalentes: offline, `useCards`/`useCreateCard` pausariam, violando HK-03). Nenhum equivalente sobrevivente; M4 é equivalente frente ao spec mas foi morto (teste mais estrito que o spec).
**Isolation**: scratch worktree; mutações e sondas revertidas (`git checkout` / `rm`), worktree removido com `git worktree remove --force`; porcelain da árvore real vazia antes e depois (baseline limpa), alterado só este arquivo.

Sonda extra: `../../db/config` a partir de `cards/usecases/` (aponta para `src/features/db`, não para `src/db`) é barrado pelo lint (regex casa qualquer segmento final `db`) mas não pelo teste — falso positivo inofensivo do lint, não lacuna.

## Amendments Reconciled

| Amendment | AC text | Code | Test |
| --- | --- | --- | --- |
| A-01 (DCK-04: omitida mantém, `""` remove) | ✅ DCK-04 marcado *(A-01)* | ✅ `src/features/decks/repository.ts:68-71` | `src/features/decks/repository.test.ts:142` (omitida → `"d"`), `:146-147` (`""` → removida); mutantes M1 e M2 mortos |
| A-02 (ARC-03: testes isentos, qualquer caminho) | ✅ ARC-03 marcado *(A-02)* | ✅ `eslint.config.js:16` (isenção de testes), `:28-33` (regex relativa); `src/features/architecture.test.ts:38-47`, `:84-85` | `src/features/architecture.test.ts:93`; sondas L1–L4. Obs.: `.specs/STATE.md:8` (AD-001) não menciona a isenção de testes nem caminhos relativos; `ARCHITECTURE.md:37` sim |

## UAT

Não aplicável nesta feature (sem telas; só dados e hooks).

## Change Review

- Scope matches spec In scope: ✅ — repositórios, hooks, `QueryClientProvider` em `src/app/_layout.tsx`, padrão documentado. Nada de Out of scope. Rodada de correção (`c7455e8`, `99a3a23`, `071842e`) toca só o necessário para F1–F3.
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅ — sem `.only`/`.skip`/`xit`/`console.log`/`debugger`/`TODO` no diff de `src/`. `.specs/PROJECT.md` e `.specs/TESTING.md` atualizados de forma coerente.
- Tests anchored and necessary: ✅ com ressalva — cada teste nomeado pelo AC/INV; mas `decks.test.tsx:123` é intermitente (gap 1).
- Observações (menores, não bloqueiam):
  1. `use-delete-deck.ts:18`, `use-create-card.ts:22` e `use-delete-card.ts:18` usam literais `["cards"]`/`["decks"]` em vez de `cardKeys.all`/`deckKeys.all`; as chaves podem divergir em silêncio se um `keys.ts` mudar.
  2. `usecases/keys.ts` e `index.ts` não estão no layout de ARC-01; documentados em `ARCHITECTURE.md:29-30`.
  3. `architecture.test.ts` e o lint não pegam `require("realm")`; o código usa só ESM, risco baixo.
  4. HK-04 via hook só é exercitado na criação (deck e cartão); update/delete herdam o mesmo `useMutation` sem transformação de erro.
  5. Sem superengenharia relevante.

## Gaps & Fix Tasks

1. **Gate intermitente — HK-03 de decks** (`src/features/decks/usecases/decks.test.tsx:123`): `expect(result.current.create.isSuccess).toBe(true)` lido logo após o `act`, sem `waitFor`; falhou em 2/6 `npm test` na árvore real e 2/10 execuções isoladas, sem mutação. PASS exige gate verde de forma confiável. → Fix: `await waitFor(() => expect(result.current.create.isSuccess).toBe(true))`, como os demais testes de hook; confirmar com execuções repetidas (ex.: 10× `npx jest src/features/decks/usecases/decks.test.tsx`).
2. **HK-03 — sem evidência para os hooks de cartão**: nenhum teste roda `useCards`/`useCard`/mutações de cartão offline; M5 (`use-cards.ts`, `networkMode: "online"`) e M15 (`use-create-card.ts`, idem) sobreviveram. → Fix: teste HK-03 em `cards.test.tsx` com `onlineManager.setOnline(false)` (restaurado no `afterEach`), verificando `list`/`item` em `isSuccess` com `fetchStatus` ≠ `"paused"` e uma mutação de cartão concluída (com `waitFor`). Alternativa ou complemento: regra em `architecture.test.ts` que proíba `networkMode` nos arquivos de hook.

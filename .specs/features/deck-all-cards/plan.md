# Deck All Cards — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Done

## Approach

Tela nova `DeckCardsScreen` em `src/features/decks/screens/`, com hook `use-deck-cards-screen.ts` (busca, linhas, navegação), rota fina em `src/app/decks/[deckId]/cards/index.tsx`. O Baralho corta a lista em 5 com um helper puro em `src/domain/` e perde a busca (que migra para a nova tela, reaproveitando `matches` e `CardRow`). O Editor troca `Alert.alert` por `ConfirmDialog` controlado por estado no `useEditCardForm`. Conforma AD-002, AD-003, AD-005, AD-006 e AD-007.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `CardRow` | `src/features/decks/screens/card-row.tsx` | Linhas das duas telas |
| `matches` | `src/domain/text.ts` | Filtro da busca |
| `useDeck`, `useCards` | `@/features/decks`, `@/features/cards` | Leitura |
| `NotFound`, `Screen`, `TextField`, `Fab`, `ConfirmDialog` | `src/components/` | UI |
| Mock `hold` e `renderRouterWithProviders` | `deck-screen.test.tsx`, `src/testing/router.tsx` | Testes |

### Components and interfaces

- **`previewCards(cards, limit = 5)`** e **`PREVIEW_LIMIT`** (`src/domain/cards-list.ts`): `newestFirst(cards)` devolve cópia invertida; `previewCards` pega os primeiros 5. Puro, com teste.
- **DeckCardsScreen** (`deck-cards-screen.tsx`): `{ deckId }`. Carrega `useDeck`; sem deck mostra `NotFound` (ALL-09); com deck renderiza topo (`Baralho`, `+`), `FlatList` com cabeçalho (título, subtítulo, busca).
- **useDeckCardsScreen(deck)** (`use-deck-cards-screen.ts`): `{ rows, all, query, setQuery, goBack, addCard }`. `goBack` usa `router.dismissTo(`/decks/${id}`)`.
- **use-deck-screen.ts**: `rows = previewCards(all)`, `showAll = (all?.length ?? 0) > PREVIEW_LIMIT`, `seeAll` abre `/decks/<id>/cards`; remove `query`/`setQuery`.
- **deck-screen.tsx**: remove `TextField` e a lógica de `Nenhum cartão encontrado`; título `Cartões` + botão `Ver todos` com `Icon chevron-right`.
- **Icon**: adiciona `chevron-right`.
- **use-edit-card-form.ts**: estado `confirming`; `confirmDelete` abre (se não ocupado), `cancelDelete` fecha, `deleteCard` fecha e exclui. Devolve `confirming`, `cancelDelete`, `deleteCard`.
- **card-editor-form** (em `card-editor-screen.tsx`): renderiza `ConfirmDialog` quando recebe as props de exclusão.

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| ALL-09 | `NotFound` com `goHome` | `Baralho não encontrado` |
| ALL-13 | `onError` já existente; o diálogo fecha antes de `mutate` | Mensagem de erro no Editor |

### Architecture impact

**Architecture impact**: none

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Onde mora a tela | `features/decks/screens/` | `CardRow` e `NotFound` do Baralho já moram lá; AD-003 |
| Rota | `src/app/decks/[deckId]/cards/index.tsx` | Convive com `cards/new.tsx` |
| Diálogo no Editor | Estado local no hook do formulário | AD-005 e AD-006 |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Testes DECK-03/04/05 e EDT-05 mudam de lugar | `deck-screen.test.tsx`, `card-editor-screen.test.tsx` | Parece enfraquecer teste | A-01 da spec autoriza; cada AC antigo ganha teste equivalente na tela nova |
| `Modal` no Jest só renderiza com `visible` | `ConfirmDialog` | Falso negativo | Testes abrem pelo botão real |
| 1.000 linhas na tela 3b | `deck-cards-screen.tsx` | Lentidão | `FlatList`; teste ALL-10 |

## Test Strategy

Domínio: teste unitário de `cards-list.ts` (cobertura ≥ 90%). Telas: `renderRouterWithProviders` com Realm em memória. `deck-cards-screen.test.tsx` novo; `deck-screen.test.tsx` e `card-editor-screen.test.tsx` migram os testes afetados. Mutações a checar no fim: limite 5 → 6, `> 5` → `>= 5`, ordem não invertida, `matches` ignorado, `onConfirm` do diálogo sem fechar.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest src/domain src/features/decks src/features/cards && npx tsc --noEmit` | after each task |
| full | `npm run ci` | after the last task |

## Tasks

### T1 — Prévia de 5 cartões no Baralho com "Ver todos"

- **Covers**: ALL-01, ALL-02, ALL-03, ALL-04, ALL-15 (Ver todos)
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/cards-list.ts`, `src/domain/cards-list.test.ts`, `src/components/icon.tsx`, `src/features/decks/screens/{deck-screen.tsx,use-deck-screen.ts,deck-screen.test.tsx}`
- **Change**: helper `newestFirst`/`previewCards`; Baralho mostra 5 linhas, `Ver todos` quando > 5, sem busca; `Icon chevron-right`. Migra DECK-03 (3 cartões continuam na ordem) e remove DECK-04/05 daqui (voltam em T2).
- **Tests**:
  - SPEC ALL-01 · unit — `previewCards` com 8 cartões → os 5 mais recentes na ordem; com 3 → 3
  - SPEC ALL-01 · screen — 7 cartões → 5 `card-row`, o mais recente primeiro
  - SPEC ALL-02 · screen — 6 cartões → `Ver todos`; 5 cartões → ausente
  - SPEC ALL-03 · screen — toque em `Ver todos` → pathname `/decks/<id>/cards`
  - SPEC ALL-04 · screen — `Buscar cartões` ausente com 8 cartões
  - SPEC ALL-15 · screen — `Ver todos` com role, label e `minHeight` ≥ 44 (estende A11Y-01)
  - REGRESSION · screen — DECK-06 e PERF-01 continuam verdes
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Tela Todos os cartões com busca

- **Covers**: ALL-05, ALL-06, ALL-07, ALL-08, ALL-09, ALL-10, ALL-15
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/{deck-cards-screen.tsx,use-deck-cards-screen.ts,deck-cards-screen.test.tsx}`, `src/app/decks/[deckId]/cards/index.tsx`, `src/features/screen-logic.test.ts` (se listar telas)
- **Change**: tela, hook e rota novos. Move para cá os testes de busca DECK-04/05.
- **Tests**:
  - SPEC ALL-05 · screen — `Baralho`, `Adicionar cartão`, `Todos os cartões`, `Inglês · 3 cartões` e placeholder `Buscar na frente ou no verso`
  - SPEC ALL-05 · screen — `Baralho` → pathname do Baralho; `Adicionar cartão` → `/decks/<id>/cards/new`
  - SPEC ALL-06 · screen — 8 cartões → 8 linhas, mais recente primeiro; toque abre `/cards/<id>/edit`
  - SPEC ALL-07 · screen — `ESQUE` acha `forget`; `facil` acha `fácil`; `  ` mostra tudo
  - SPEC ALL-08 · screen — `zzz` → `Nenhum cartão encontrado`; baralho vazio → `Nenhum cartão ainda` sem busca
  - SPEC ALL-09 · screen — id inexistente → `Baralho não encontrado` e `Voltar ao início`
  - SPEC ALL-10 · screen — 1.000 cartões → < 100 linhas
  - SPEC ALL-15 · screen — botões com role, label e 44 pt; campo `Buscar cartões`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Excluir cartão no Editor com ConfirmDialog

- **Covers**: ALL-11, ALL-12, ALL-13, ALL-14
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/features/cards/screens/{use-edit-card-form.ts,card-editor-screen.tsx,card-editor-screen.test.tsx}`
- **Change**: `Alert.alert` → `ConfirmDialog`. Migra os 5 testes `EDT-05`/`EDT-08`/`ERR-01` que fazem spy em `Alert`.
- **Tests**:
  - SPEC ALL-11 · screen — `Excluir cartão` → título `Excluir cartão?`, mensagem, `Excluir`, `Cancelar`
  - SPEC ALL-12 · screen — `Excluir` remove o cartão e fecha o Editor sem `Cartão não encontrado`; `Cancelar` fecha o diálogo e mantém o cartão
  - SPEC ALL-13 · screen — falha de escrita → mensagem do Editor, cartão intacto, diálogo fechado
  - SPEC ALL-14 · screen — exclusão pendente → `Salvar` e `Excluir cartão` desabilitados
- **Done when**: tests above pass; `npm run ci` green; lint limpo
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1 ∥ T3 (arquivos disjuntos)
- **Wave 2**: T2

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Lista agrupada com divisores | Estilo do design 3/3b | F9 |
| Toast ao excluir cartão | Depende da decisão sobre "Desfazer" | F2 |

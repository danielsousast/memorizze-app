# Refactor para as regras de código (AD-005) — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Executed

## Approach

Refactor sem mudança de comportamento, por tela, protegido pelos testes existentes. Cada tarefa extrai a lógica de uma tela para um hook `use-<tela>.ts` em `screens/` (AD-006), troca ternários aninhados por funções puras ou early returns e troca arrows nas props por handlers nomeados. Regras de texto e plural que hoje estão no corpo dos componentes viram funções puras testadas em `src/domain/`. A última tarefa sobe as duas regras de lint para `error`. Conforma com AD-001 (só `repository.ts` toca Realm), AD-002 (UI via React Query) e AD-003 (telas em `screens/`).

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| Hooks de caso de uso | `src/features/*/usecases/` | Chamados pelos hooks de tela, sem mudança |
| `plural`, `matches` | `src/domain/text.ts` | Base das novas funções de rótulo |
| `stepGoal`, `canStep` | `src/domain/goal.ts` | Usados pelo `useProfileScreen` |
| `sessionReducer` | `session-view.tsx` | Move para `use-study-session.ts` |
| `nameErrorMessage`, `GENERIC_ERROR` | `profile/screens/name-errors.ts` | Reaproveitados pelos hooks de nome |
| Testes de tela | `src/features/*/screens/*.test.tsx` | Rede de segurança; não mudam |

### Components and interfaces

Todos em `src/features/<feature>/screens/`; cada hook devolve um objeto plano que a tela só renderiza.

- **`useStudySession(cards, deckId)`**: `{ state, card, position, revealed, labels, error, pending, reveal, answer(grade), confirmExit }`. Contém reducer, trava `busy`, skip de cartão apagado (QUE-05), `BackHandler` (EXT-03) e `Alert` de saída.
- **`useCreateCardForm(deckId)`** / **`useEditCardForm(card, remove)`**: `{ front, back, errors, formError, pending, frontRef?, setFront, setBack, cancel, save, saveAnother?, confirmDelete? }`. `toFieldErrors` e `closeEditor` vão junto.
- **`useDeckScreen(deck)`**: `{ rows, hasCards, matureCount, query, setQuery, studyLabel, study, addCard, openOptions, goHome }`. A exclusão monta a mensagem com `deleteDeckMessage(cardCount)`.
- **`useDeckForm(deck?)`**, **`useEditNameForm()`**, **`useWelcomeForm()`**: `{ name, setName, ..., nameError, formError, pending, submit, cancel }`.
- **`useProfileScreen()`**: `{ profile, reviewsToday, stats, error, decrease, increase, editName }`; inclui `useFocusEffect` de refetch (HOM-07).
- **Funções puras** (`src/domain/labels.ts`, novo): `tomorrowLabel(count)`, `tomorrowSummaryLabel(count)`, `studyTimeLabel(minutes)`. `deleteDeckMessage(count)` fica em `deck-messages.ts`; a cor da borda do `TextField` sai por `if` em função local.
- **Linhas de lista** (`DeckItem`, `CardRow`): ligam o próprio `onPress` com handler nomeado; `renderItem` e `keyExtractor` são funções de módulo.

### Error handling

Sem mudança: cada hook mantém as mesmas mensagens e códigos (EDG-01 e EDG-02 garantem pelos testes existentes).

### Architecture impact

**Architecture impact**: none — hooks de tela cabem em `screens/` e não entram em ARC-02/ARC-05; AD-006 registra a convenção.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Hooks de tela vs `usecases/` | `screens/use-*.ts`, AD-006 | `usecases/` obriga uma chamada React Query por hook (ARC-02) |
| Handler de item de lista | Componente-linha com handler nomeado | Evita arrow em `renderItem` e mantém props estáveis |
| Ternário de 3 ramos | Função pura nomeada ou early return | Regra do usuário; testável |
| Lint | `warn` até T8, depois `error` | O gate não quebra no meio do refactor |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Perder a trava `busy` ao mover para o hook | `session-view.tsx`, `card-editor-screen.tsx`, forms | Toque duplo grava duas vezes | Testes existentes de toque duplo rodam em cada tarefa; manter `useRef` dentro do hook |
| Mudar ordem de efeitos (skip de cartão apagado, `BackHandler`) | `session-view.tsx` | Sessão trava ou sai sem confirmar | Mover o bloco inteiro sem reescrever; testes `study-session`, `study-exit` |
| `react/jsx-no-bind` acusar handler criado no corpo do componente | todas | Aviso persiste | Handler declarado como função nomeada no hook ou no módulo e passado por referência |

## Test Strategy

REGRESSION: as suítes de tela, view e componente existentes passam sem edição. SPEC: testes unitários novos para cada função pura (`domain/labels`, `deleteDeckMessage`) e uma checagem de imports por tela (HOK-01 a HOK-05). Discriminação: 3 mutações manuais (T3 remover a trava `busy`, T4 trocar o mapeamento `CARD_FRONT_EMPTY`↔`CARD_BACK_EMPTY`, T1 inverter o ramo `tomorrow === 0`), cada uma deve derrubar um teste.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest <paths da tarefa> && npx tsc --noEmit` | após cada tarefa |
| full | `npm test && npx expo lint && npx tsc --noEmit` | após cada onda e antes do Verify |

## Tasks

### T1 — Textos e rótulos como funções puras
- **Covers**: HOK-06, TER-01, PRP-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/labels.ts`, `src/domain/labels.test.ts`, `src/features/study/screens/summary-view.tsx`, `src/features/study/screens/empty-view.tsx`, `src/features/decks/screens/streak-card.tsx`, `src/features/profile/screens/week-chart.tsx`, `src/features/profile/screens/stats-section.tsx`
- **Change**: `tomorrowLabel`, `tomorrowSummaryLabel`, `studyTimeLabel` e o rótulo do dia em funções puras; `SummaryView`, `EmptyView`, `StreakCard`, `WeekChart` e `StatsSection` só renderizam; `onPress` de `router.back`/`dismissTo`/`replace` viram handlers nomeados; o ternário aninhado de `summary-view` some.
- **Tests**:
  - SPEC TER-01 · unit — `tomorrowSummaryLabel(undefined)` → `""`, `0` → `Amanhã: nenhum cartão para revisar`, `3` → `Amanhã: 3 cartões para revisar`
  - SPEC HOK-06 · unit — `studyTimeLabel(0)` → `< 1 min de estudo`, `5` → `5 min de estudo`
  - REGRESSION · component — suítes `study-summary`, `study-empty`, `week-chart`, `profile-screen` passam sem edição
  - SPEC PRP-02 · lint — `npx eslint` nos arquivos da tarefa sem avisos de `react/jsx-no-bind`
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T2 — Props simples: TextField, lista de baralhos, fallback do banco
- **Covers**: PRP-01, PRP-02, TER-01
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/components/text-field.tsx`, `src/components/text-field.test.tsx`, `src/features/decks/screens/home-screen.tsx`, `src/app/_layout.tsx`
- **Change**: `onFocus`/`onBlur` viram handlers nomeados e a cor da borda sai do ternário aninhado; `HomeScreen` usa `renderItem`/`keyExtractor` de módulo e `DeckItem` liga o próprio `onPress`; o `fallback` de `_layout.tsx` vira componente nomeado.
- **Tests**:
  - SPEC TER-01 · component — `TextField` com erro usa a cor de erro; só com foco usa `accent`; sem ambos usa `border`
  - REGRESSION · component — `home-screen.test.tsx`, `root-stack.test.tsx` passam sem edição
  - SPEC PRP-01 · lint — `npx eslint` nos arquivos da tarefa sem avisos de `react/jsx-no-bind` (`renderItem`, `keyExtractor`, `fallback`)
  - SPEC PRP-02 · lint — `npx eslint` nos arquivos da tarefa sem avisos de `react/jsx-no-bind`
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T3 — Sessão de estudo em `useStudySession`
- **Covers**: HOK-01, HOK-07, PRP-02, EDG-02
- **Depends on**: T1
- **Risk**: MEDIUM — reducer, trava de toque duplo e efeitos
- **Touches**: `src/features/study/screens/use-study-session.ts`, `src/features/study/screens/session-view.tsx`, `src/features/study/screens/study-session.test.tsx`
- **Change**: reducer, `busy`, skip de cartão apagado, `BackHandler`, `Alert` de saída e `labels` movem para o hook; `SessionView` só renderiza; o botão de nota vira `AnswerButton` com `onPress` ligado ao grade; `confirmExit` passa por referência.
- **Tests**:
  - SPEC HOK-01 · unit — `session-view.tsx` não importa `useReducer`, `useRef`, `useEffect`, `BackHandler`, `Alert` (leitura do arquivo)
  - SPEC EDG-02 · component — dois toques seguidos em uma nota gravam uma resposta só (teste existente de `study-answer`)
  - REGRESSION · component — `study-session`, `study-answer`, `study-exit`, `study-summary` passam sem edição
  - SPEC HOK-07 · unit — todo `use-*.ts` novo está em `screens/` e `architecture.test.ts` passa sem edição
  - SPEC PRP-02 · lint — `npx eslint` nos arquivos da tarefa sem avisos de `react/jsx-no-bind`
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T4 — Editor de cartão em hooks de formulário
- **Covers**: HOK-02, HOK-07, PRP-02, EDG-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/features/cards/screens/use-create-card-form.ts`, `src/features/cards/screens/use-edit-card-form.ts`, `src/features/cards/screens/card-editor-screen.tsx`
- **Change**: estado, `busy`, `toFieldErrors`, `closeEditor`, `Alert` de exclusão e foco do campo movem para os hooks; `CardEditorScreen` só liga props a handlers nomeados (`cancel`, `save`, `saveAnother`).
- **Tests**:
  - SPEC HOK-02 · unit — `card-editor-screen.tsx` não importa `useState`, `useRef`, `Alert`, `AppError`, `router`
  - SPEC EDG-02 · component — salvar duas vezes seguidas cria um cartão só
  - REGRESSION · component — `card-editor-screen.test.tsx` passa sem edição
  - SPEC HOK-07 · unit — todo `use-*.ts` novo está em `screens/` e `architecture.test.ts` passa sem edição
  - SPEC PRP-02 · lint — `npx eslint` nos arquivos da tarefa sem avisos de `react/jsx-no-bind`
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T5 — Tela de baralho em `useDeckScreen`
- **Covers**: HOK-03, HOK-07, TER-01, PRP-01, PRP-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/use-deck-screen.ts`, `src/features/decks/screens/deck-messages.ts`, `src/features/decks/screens/deck-messages.test.ts`, `src/features/decks/screens/deck-screen.tsx`
- **Change**: busca, filtro, `matureCount`, `Alert` de opções e de exclusão e navegação movem para o hook; `deleteDeckMessage(count)` substitui o ternário aninhado; `CardRow` liga o próprio `onPress`; `renderItem`/`keyExtractor` de módulo.
- **Tests**:
  - SPEC TER-01 · unit — `deleteDeckMessage(0)` → `undefined`, `1` → `O único cartão deste baralho também será excluído.`, `4` → `Os 4 cartões deste baralho também serão excluídos.`
  - SPEC HOK-03 · unit — `deck-screen.tsx` não importa `Alert`, `matches`, `cardStage`, `useState`
  - REGRESSION · component — `deck-screen.test.tsx` passa sem edição
  - SPEC HOK-07 · unit — todo `use-*.ts` novo está em `screens/` e `architecture.test.ts` passa sem edição
  - SPEC PRP-01 · lint — `npx eslint` nos arquivos da tarefa sem avisos de `react/jsx-no-bind` (`renderItem`, `keyExtractor`)
  - SPEC PRP-02 · lint — `npx eslint` nos arquivos da tarefa sem avisos de `react/jsx-no-bind`
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T6 — Formulários de baralho, nome e boas-vindas em hooks
- **Covers**: HOK-04, HOK-07, PRP-02, EDG-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/use-deck-form.ts`, `src/features/decks/screens/deck-form-screen.tsx`, `src/features/profile/screens/use-edit-name-form.ts`, `src/features/profile/screens/edit-name-screen.tsx`, `src/features/profile/screens/use-welcome-form.ts`, `src/features/profile/screens/welcome-screen.tsx`
- **Change**: estado, `busy`, mapeamento de erro e navegação saem das três telas para os hooks; as telas só renderizam e passam handlers nomeados.
- **Tests**:
  - SPEC HOK-04 · unit — as três telas não importam `useState`, `useRef`
  - SPEC EDG-02 · component — salvar duas vezes cria um baralho só
  - REGRESSION · component — `deck-form-screen`, `edit-name-screen`, `welcome-screen` passam sem edição
  - SPEC HOK-07 · unit — todo `use-*.ts` novo está em `screens/` e `architecture.test.ts` passa sem edição
  - SPEC PRP-02 · lint — `npx eslint` nos arquivos da tarefa sem avisos de `react/jsx-no-bind`
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T7 — Perfil em `useProfileScreen`
- **Covers**: HOK-05, HOK-07, PRP-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/use-profile-screen.ts`, `src/features/profile/screens/profile-screen.tsx`
- **Change**: leituras, refetch ao focar, `step` e erro movem para o hook; `StepButton` recebe `onPress` já ligado por `decrease`/`increase`; `editName` navega pelo hook.
- **Tests**:
  - SPEC HOK-05 · unit — `profile-screen.tsx` não importa `@/domain/goal`, `useRef`, `useState`
  - REGRESSION · component — `profile-screen.test.tsx` passa sem edição
  - SPEC HOK-07 · unit — todo `use-*.ts` novo está em `screens/` e `architecture.test.ts` passa sem edição
  - SPEC PRP-02 · lint — `npx eslint` nos arquivos da tarefa sem avisos de `react/jsx-no-bind`
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T8 — Lint em `error` e documentação
- **Covers**: RUL-01, RUL-02, RUL-03, EDG-01
- **Depends on**: T1, T2, T3, T4, T5, T6, T7
- **Risk**: inherit
- **Touches**: `eslint.config.js`, `.specs/STATE.md`, `ARCHITECTURE.md`
- **Change**: `no-nested-ternary` e `react/jsx-no-bind` passam de `warn` para `error`; AD-006 (hooks de tela em `screens/`) entra em `STATE.md`; `ARCHITECTURE.md` cita a convenção em Feature modules.
- **Tests**:
  - SPEC RUL-01 · lint — `npx expo lint` com `no-nested-ternary` em `error` sai com 0 problemas
  - SPEC RUL-02 · lint — `npx expo lint` com `react/jsx-no-bind` em `error` sai com 0 problemas
  - SPEC EDG-01 · unit — `git diff --stat -- '*.test.tsx'` das tarefas T1–T7 mostra só testes novos, nenhuma asserção existente alterada
  - SPEC RUL-03 · full — `npm test` e `npx tsc --noEmit` verdes
- **Done when**: full gate verde
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1 ∥ T2 ∥ T4 ∥ T5 ∥ T6 ∥ T7
- **Wave 2**: T3
- **Wave 3**: T8

## Deferred

- Estilos inline em objeto e extração de `StyleSheet`: fora da regra.
- `src/app/**`: sem lógica a extrair.

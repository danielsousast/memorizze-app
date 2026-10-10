# Refactor para as regras de código (AD-005) — Spec

**Status**: Draft
**Date**: 2026-10-10

## Problem

AD-005 proíbe ternário aninhado, funções criadas inline nas props e lógica de negócio em telas e componentes. O código atual quebra as três: o lint acusa 5 `no-nested-ternary` e 37 `react/jsx-no-bind`, e telas como `session-view` e `card-editor-screen` misturam reducer, validação, mutação, navegação e `Alert` com a UI. Isso dificulta ler, testar e reutilizar a lógica.

## Scope

### In scope

- Remover todo ternário aninhado de `src/**/*.tsx` e `src/**/*.ts` (fora de testes).
- Trocar toda função inline em prop de componente por referência nomeada.
- Mover a lógica de negócio das telas e views de `src/features/*/screens/` para hooks `use-*.ts` na mesma pasta, apoiados em `src/domain/`.
- Subir `no-nested-ternary` e `react/jsx-no-bind` de `warn` para `error`.

### Out of scope

| Item | Reason |
| --- | --- |
| Mudar comportamento, textos, layout ou acessibilidade | Refactor puro; a suíte atual prova a equivalência |
| Mudar repositórios, schema do Realm, hooks de `usecases/` | Já seguem AD-001 e AD-002 |
| Estilos inline (`style={{ ... }}` com objetos) | A regra trata de funções, não de objetos |
| `src/app/**` além do `fallback` de `_layout.tsx` | Rotas já só leem params e renderizam |
| Componentes novos ou nova dependência | Nada além de hooks e handlers nomeados |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | none | Três regras objetivas, lint mede duas delas |
| criticality | low | Fluxos de estudo e cadastro passam por telas tocadas |
| blast_radius | medium | ~14 arquivos de tela e componentes |
| novelty | low | Hooks de tela são um padrão novo no projeto (AD-006) |
| irreversibility | none | Só código, tudo em git |
| integrations | none | Nenhuma |
| state | low | Reducer e estado de formulário mudam de lugar |
| auth | none | Nenhuma |
| concurrency | low | Travas `busy` contra toque duplo são movidas |
| migrations | none | Nenhuma |
| security | none | Nenhuma |
| data_integrity | none | Escrita continua nos mesmos hooks de mutação |

**Declared level**: MEDIUM

## Acceptance Criteria

### P1 — Regras mecânicas

- **RUL-01** — `npx expo lint` termina com 0 avisos de `no-nested-ternary` em `src/`, e a regra está como `error` em `eslint.config.js`.
- **RUL-02** — `npx expo lint` termina com 0 avisos de `react/jsx-no-bind` em `src/`, e a regra está como `error` em `eslint.config.js`.
- **RUL-03** — `npm test` e `npx tsc --noEmit` passam sem alterar nenhuma asserção dos testes existentes de tela, view e componente.

### P2 — Lógica fora da UI

- **HOK-01** — `SessionView` não importa `useReducer`, `useRef`, `useEffect`, `useMemo`, `BackHandler`, `Alert` nem `@/domain/schedule`/`@/domain/session`; o hook `useStudySession` expõe estado, rótulos de intervalo, `reveal`, `answer`, `confirmExit` e `error`.
- **HOK-02** — `CardEditorScreen` não importa `useState`, `useRef`, `Alert`, `AppError` nem `router`; os hooks `useCreateCardForm` e `useEditCardForm` expõem campos, erros, `pending` e handlers.
- **HOK-03** — `DeckScreen` não chama `Alert`, `matches`, `cardStage` nem `useState`; o hook `useDeckScreen` expõe linhas filtradas, `matureCount`, `query` e handlers de abrir opções, estudar, adicionar e excluir.
- **HOK-04** — `DeckFormScreen`, `EditNameScreen` e `WelcomeScreen` não usam `useState`, `useRef` nem mapeiam erros de domínio; `useDeckForm`, `useEditNameForm` e `useWelcomeForm` expõem campos, erros, `pending` e `submit`.
- **HOK-05** — `ProfileScreen` não importa `@/domain/goal` nem `useRef`/`useState`; `useProfileScreen` expõe `reviewsToday`, `stats`, `error`, `step` e `editName`.
- **HOK-06** — `SummaryView`, `EmptyView`, `StreakCard` e `WeekChart` recebem textos prontos de funções puras em `src/domain/` ou de um hook; nenhum calcula minutos, plural ou rótulo de dia no corpo do componente.
- **HOK-07** — Todo arquivo `use-*.ts` novo fica em `src/features/<feature>/screens/` e passa em `src/features/architecture.test.ts` sem mudar esse teste.

### P3 — Ternários e props

- **TER-01** — Cada expressão com três ou mais ramos vira função pura nomeada (`deleteDeckMessage(count)`, `tomorrowLabel(count)`, `borderColorFor(...)`) ou `if`/early return, com teste unitário dos ramos.
- **PRP-01** — `renderItem`, `keyExtractor` e `fallback` são referências estáveis declaradas no módulo ou no hook, nunca arrow na prop.
- **PRP-02** — `onFocus` e `onBlur` de `TextField` e todo `onPress`/`onCancel`/`onAction` de tela são handlers nomeados; os que dependem do item da lista ficam em um componente-linha que recebe `onPress` já ligado.

## Failure & Edge Behavior

- **EDG-01** — IF um teste de tela existente falhar após a extração THEN a tarefa corrige o refactor, nunca a asserção; só uma emenda aprovada altera um teste.
- **EDG-02** — WHILE uma resposta ou envio está em andamento a trava de toque duplo SHALL continuar rejeitando um segundo disparo (resposta da sessão de estudo e envios de formulário), com o mesmo teste.

Other dimensions: input validation, idempotency, auth, concurrency, state transitions, data lifecycle, external dependency, observability N/A because o refactor não altera comportamento observável.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Onde moram os hooks de tela | `src/features/<f>/screens/use-<tela>.ts` (AD-006) | `usecases/` exige uma chamada React Query por hook (ARC-02); hooks de tela compõem vários | no |
| Navegação (`router.push`) conta como lógica | Sim; fica no hook da tela, e o componente recebe `onPress` | O pedido manda tirar efeitos da UI | no |
| Componente de apresentação puro pode ter `useState` de UI | Não há caso hoje fora de `TextField` (foco), que passa a usar handlers nomeados | Foco é estado visual, não de negócio | no |
| `Alert.alert` conta como lógica | Sim; construção das mensagens vai para funções puras, a chamada para o hook | Mensagem tem regra de plural | no |

**Open questions**: none

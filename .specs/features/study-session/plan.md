# Sessão de estudo — Plan

**Spec**: [spec.md](spec.md)
**Risk**: HIGH (from spec)
**Status**: Draft

## Approach

A regra fica pura em `src/domain/`: `schedule` (SM-2 da §5), rótulo de intervalo, streak e o progresso da sessão como funções sem React nem Realm. Uma nova feature `src/features/study/` segue AD-001: um repositório lê a fila, conta os cartões de amanhã, grava a resposta (cartão + `ReviewLog` num único `realm.write`) e calcula o streak; cada hook faz uma chamada React Query (AD-002). A fila vira uma foto em memória ao abrir a sessão: a tela guarda os cartões num `useReducer` e ignora releituras (QUE-02). A sessão é uma única rota por escopo (`/decks/<id>/study` e `/study`) com fases `loading → empty | notFound | studying → summary`; o Resumo substitui a sessão na mesma rota, então voltar sai para a origem (ANS-05). As telas seguem AD-003 e reusam `Button`, `Badge`, `Screen`, `NotFound` e `Icon`.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `endOfLocalDay`, `isDue` | `src/domain/dates.ts` | Limite da fila e de amanhã; ganha `startOfLocalDay` e `addLocalDays` |
| `plural` | `src/domain/text.ts` | `1 cartão` / `N cartões`, `1 dia` / `N dias` |
| Tipo `Card`, `useCard` | `@/features/cards` | Base de `StudyCard`; `useCard` detecta cartão excluído (QUE-05) |
| `Deck.dueCount`, `useDecks`, `useDeck` | `@/features/decks` | Números dos botões de entrada (ENT-01, ENT-02) |
| Padrão `busy` ref + `disabled={isPending}` | `src/features/decks/screens/deck-form-screen.tsx:52` | Toque duplo (ANS-06) |
| `Button`, `Badge`, `Screen`, `NotFound`, `Icon` | `src/components/` | Toda a UI; `Icon` ganha `close`, `calendar`, `flame` |
| Tokens `colors.grade.*`, `sizes.answerButton`, `sizes.progressSession`, `radii.studyCard`, `typography.card`, `typography.label` | `src/theme/` | Já previstos no guia de estilo para estas telas |
| `openTestRealm`, `createRandom`, `renderRouterWithProviders` | `src/testing/` | Realm em memória, seeds de invariantes, testes de tela |

### Components and interfaces

**Domínio (`src/domain/`, puro)**

- `dates.ts` (+): `startOfLocalDay(d): Date`; `addLocalDays(d, n): Date` (dias de calendário via `new Date(y, m, d + n, …)`, seguro no horário de verão).
- `schedule.ts`: `type Grade = 0 | 1 | 2 | 3`; `type SrsState = { easeFactor; intervalDays; repetitions; lapses }`; `schedule(card: SrsState, grade: Grade, now: Date): SrsState & { dueDate: Date }`; `intervalLabel(days): string`; `gradeLabel: Record<Grade, string>` (`Errei`, `Difícil`, `Bom`, `Fácil`). EF: `Math.max(1.3, Math.round(ef × 100) / 100)`.
- `streak.ts`: `currentStreak(reviewedAt: Date[], now: Date): number`. Agrupa por `startOfLocalDay`, ancora em hoje ou ontem e anda para trás com `addLocalDays(-1)`.
- `session.ts`: progresso genérico `SessionState<T extends { id: string }> = { queue: T[]; total; completed; counts: [n, n, n, n]; startedAt: Date; lastAnswerAt?: Date }`.
  - `startSession(cards, now)`, `answerSession(state, updated: T, grade, now)` (Errei → `updated` vai ao fim; outras → sai e `completed + 1`), `skipCurrent(state)` (sai, `completed + 1`, sem contar resposta).
  - `accuracy(counts): number`, `studyMinutes(startedAt, lastAnswerAt): number`.
  - O cartão atualizado entra na fila para que os rótulos do próximo turno usem os valores novos (SES-05 após Errei).

**study (nova feature, AD-001)**

- `interfaces.ts`: `StudyCard = Card & { deckId: string; deckName: string }`; `StudyErrorCode = "CARD_NOT_FOUND"`; `StudyRepository`:
  - `queue(deckId?: string): StudyCard[] | null` — `null` = baralho não encontrado (QUE-04); sem `deckId` = todos.
  - `countDueTomorrow(deckId?: string): number` — `dueDate <= endOfLocalDay(addLocalDays(now, 1))`.
  - `answer(cardId: string, grade: Grade): StudyCard` — um `realm.write`: aplica `schedule` e cria `ReviewLog`.
  - `currentStreak(): number` — `reviewedAt` de todos os logs → `currentStreak`.
- `adapters.ts`: `toStudyCard(card, deck)`.
- `repository.ts`: `createStudyRepository(realm, now)`. Consulta `realm.objects(Card).filtered("dueDate <= $0", fim do dia)` e, com baralho, `AND @links.Deck.cards._id == $1`; `sorted([["dueDate", false], ["createdAt", false]])`. Baralho do cartão: `card.linkingObjects(Deck, "cards")[0]` (Realm 20.2, `Object.d.ts:132`), sem mudar schema.
- `usecases/`: `keys.ts` (`studyKeys.all = ["study"]`, `queue(scope)`, `tomorrow(scope)`, `streak`), `use-study-queue.ts`, `use-due-tomorrow.ts`, `use-streak.ts` (todas com `gcTime: 0`), `use-answer-card.ts` (invalida `["cards"]`, `["decks"]`, `["study"]`).

**Telas e rotas (AD-003)**

| Rota (`src/app/`) | Renderiza |
| --- | --- |
| `study.tsx` → `/study` | `StudyScreen` sem `deckId` |
| `decks/[deckId]/study.tsx` | `StudyScreen deckId` |

- `screens/study-screen.tsx`: lê a fila e escolhe a fase. Declara `<Stack.Screen options={{ gestureEnabled: phase !== "studying" }} />` e, só em `studying`, registra `BackHandler` que abre o alerta (EXT-03).
- `screens/session-view.tsx`: topo (fechar, barra, `k de N`), nome do baralho, cartão frente/verso, respostas. Dono do `useReducer` iniciado uma vez com a fila.
- `screens/empty-view.tsx`: Nada para revisar (EMP-01…03).
- `screens/summary-view.tsx`: Resumo (SUM-01…07), lê `useStreak` e `useDueTomorrow`.
- `decks/screens/deck-screen.tsx` e `home-screen.tsx`: botões de entrada.

### Data

Sem mudança de schema nem de `schemaVersion`. `Card.dueDate` já é indexado e `ReviewLog.reviewedAt` também. O baralho do cartão vem de backlink dinâmico (`linkingObjects` / `@links`), não de propriedade nova.

### Error handling

| Failure (AC) | Handling | User sees |
| --- | --- | --- |
| ANS-08 | `realm.write` é atômico; `onError` guarda a mensagem; reducer e `revealed` não mudam | `Não foi possível salvar a resposta. Tente de novo.`; mesmo cartão, verso visível |
| ANS-06 | `busy` ref síncrono + `disabled={answer.isPending}` | Um só `ReviewLog` |
| QUE-04 | `queue` devolve `null` para id inválido ou inexistente | `NotFound` `Baralho não encontrado` + `Voltar ao início` |
| QUE-05 | `useCard(atual.id)` com `data === null` → `skipCurrent` | Próximo cartão; nenhum log |
| LOAD-01 | `isPending` → só a moldura da tela | Nenhum estado vazio falso |
| Falha do Realm ao abrir | `RealmErrorBoundary` existente | Tela de erro existente |

### Architecture impact

**Architecture impact**: ARCHITECTURE_UPDATE_REQUIRED — nova feature `study` (repositório que escreve em `Card` e `ReviewLog`), domínio `schedule`/`streak`/`session`, rotas `/study` e `/decks/[deckId]/study`, linha nova na matriz de invalidação (responder → `["cards"]`, `["decks"]`, `["study"]`) e o padrão de foto da fila (`gcTime: 0` + reducer). Atualizado no Verify.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| `deckId` do `ReviewLog` | O repositório resolve por backlink do cartão | Funciona igual em `Estudar tudo`; a tela não passa dado que o banco já sabe |
| Fila fixa | Reducer iniciado uma vez com o primeiro `data`; releituras ignoradas | QUE-02 sem bloquear invalidações que Início e Baralho precisam |
| Fila fresca a cada abertura | `gcTime: 0` nas queries de `study` | `staleTime: Infinity` (AD-002) serviria uma fila velha na segunda sessão |
| Resumo | Fase da mesma rota, não rota nova | Sem serializar estatísticas em params; voltar sai da rota (ANS-05) |
| Gesto e voltar do Android | `Stack.Screen` com `gestureEnabled` dinâmico + `BackHandler` | `usePreventRemove` não é exportado pelo `expo-router` 57 |
| `Adicionar novos cartões` | `router.replace("/decks/<id>/cards/new")` | Fechar o editor volta ao Baralho com `dueCount` novo, não a um estado vazio velho |
| Partes da tela | `*-view.tsx` em `screens/`, um arquivo por fase | `study-screen.tsx` continua a única tela (AD-003) |
| Selo do estado vazio com N = 0 | `Amanhã: nenhum cartão` | Lacuna de precisão em EMP-01; segue o padrão de SUM-06. **Confirmar com a aprovação** |
| Tarefas com 10+ ACs (T1, T6, T11) | Mantidas inteiras | T1 é uma função pura dirigida por tabela; T6 e T11 são uma fase de tela com ACs pequenos de texto. Aviso do `validate_plan.py` aceito |
| `Errei` e rótulos | O cartão gravado volta ao fim da fila | Rótulos do próximo turno usam os valores novos (SES-05) |

## Alternatives Considered

| Option | Trade-offs | Verdict |
| --- | --- | --- |
| Foto da fila em `useReducer` + queries `gcTime: 0` | + simples, testável, respeita AD-002; − fila e cache divergem durante a sessão (intencional) | Chosen |
| Fila sempre lida do React Query, filtrando por ids respondidos | + uma fonte só; − cartões que vencem no meio entram (fere QUE-02) e Errei vira lógica de cache | Rejected |
| Resumo como rota própria com `router.replace` | + URL própria; − estatísticas em params de string e mais uma rota | Rejected |
| `linkingObjects` no schema de `Card` | + `card.deck` tipado; − muda schema e `schemaVersion` sem ganho | Rejected |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Sintaxe `@links.Deck.cards._id` e `sorted` com tuplas no Realm 20.2 | `src/features/study/repository.ts` | Fila errada | T4 testa ordem, empate e escopo; fallback `deck.cards.filtered(...)` |
| `gcTime: 0` não forçar releitura | `usecases/use-study-queue.ts` | Segunda sessão com fila velha | Teste QUE-01 abre, sai, cria cartão e reabre |
| Arredondamento em ponto flutuante | `src/domain/schedule.ts` | EF `2.3499…` | EF arredondado a 2 casas; SRS-08 inteiro em tabela |
| Fuso e horário de verão nos testes | `dates`, `streak`, `schedule` | Teste depende da máquina | Datas pelo construtor local; `addLocalDays` por componentes |
| `BackHandler` sem mock no jest-expo | `study-screen.tsx` | EXT-03 sem teste | `jest.spyOn(BackHandler, "addEventListener")` captura e chama o handler |
| `Stack.Screen` dentro da tela no helper de teste | `study-screen.tsx` | Opção não aplicada | Gesto verificado no UAT; teste cobre só o voltar do Android |
| Streak lê todos os logs | `repository.currentStreak` | Lento com anos de uso | Aceito no MVP; Deferred |
| Asserções transversais rasas | testes de tela | Mutantes vivos | A11Y-01 e THM-01 com asserção em cada view |

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Domínio | unit | SPEC, INVARIANT | `src/domain/{schedule,streak,session,dates}.test.ts` |
| Repositório | integração com Realm em memória | SPEC, INVARIANT, CONTRACT | `src/features/study/repository.test.ts` |
| Hooks | `renderHookWithProviders` | SPEC | `src/features/study/usecases/study.test.tsx` |
| Telas | `renderRouterWithProviders` + Realm real + `Alert`/`BackHandler` espionados | SPEC, REGRESSION | `src/features/study/screens/*.test.tsx`, `src/features/decks/screens/*.test.tsx` |
| Arquitetura | unit | REGRESSION | `src/features/architecture.test.ts` (passa a ver `study`) |

Regras de SM-2, streak e progresso são testadas uma vez, no domínio. As telas provam fiação, texto, navegação e o que fica no Realm. Gesto de deslizar, visual contra os PNGs (claro e escuro) e toque real ficam no UAT em development build.

Mutações sugeridas ao verificador:
- Errei sem `lapses + 1`.
- Remover o piso de 1.3 do EF.
- Fácil sobre o intervalo de Bom sem arredondar.
- Errei incrementando `completed`.
- Streak sem o caso "hoje não conta, ancora em ontem".
- Remover o `busy` ref.
- Gravar o `ReviewLog` fora do `realm.write` do cartão.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest <paths da task> && npx tsc --noEmit` | após cada task |
| full | `npm test && npx tsc --noEmit && npx expo lint` | após cada wave e antes do verify |

## Tasks

### T1 — SM-2 agenda cartões e rotula intervalos

- **Covers**: SRS-01, SRS-02, SRS-03, SRS-04, SRS-05, SRS-06, SRS-07, SRS-08, LBL-01, INV-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/schedule.ts`, `src/domain/schedule.test.ts`, `src/domain/dates.ts`, `src/domain/dates.test.ts`
- **Change**: `schedule`, `intervalLabel`, `gradeLabel`, `Grade`, `SrsState`; `startOfLocalDay` e `addLocalDays` em `dates.ts`.
- **Tests**:
  - SPEC SRS-08 · unit — as 10 linhas da tabela, `rep`, `int` e `EF` exatos
  - SPEC SRS-01 · unit — `(4, 20, 1.30, lapses 2)` + Errei → `rep 0`, `int 0`, `EF 1.30`, `lapses 3`
  - SPEC SRS-02 · unit — `(3, 10, 2.00)` + Difícil → `int 12`, `EF 1.85`; `(0, 0)` → `int 1`
  - SPEC SRS-03 · unit — `rep` 0 → 1; 1 → 3; `(2, 3, 2.5)` → 8; EF igual
  - SPEC SRS-04 · unit — `(2, 3, 2.5)` + Fácil → `int 10`, `EF 2.65`; cartão novo → `int 1`
  - SPEC SRS-05 · unit — EF 1.40 + Errei → 1.30; EF 2.50 + Difícil → 2.35 (`toBe`, não `toBeCloseTo`)
  - SPEC SRS-06 · unit — Difícil, Bom e Fácil com `lapses 5` → `lapses 5`
  - SPEC SRS-07 · unit — `now` 10/10 23:50, intervalo 1 → `new Date(2026, 9, 11)`; intervalo 0 → `new Date(2026, 9, 10)`; 31/12 + 1 → 1/1
  - SPEC LBL-01 · unit — 0 → `agora`; 1 → `1 dia`; 2 → `2 dias`; 142 → `142 dias`
  - INVARIANT INV-02 · unit — 100 sequências de 50 notas (`createRandom`, seed fixa) a partir de cartão novo → após cada passo `EF >= 1.3`, `int >= 0`, `rep >= 0`, `lapses` não diminui, `dueDate >= startOfLocalDay(now)`
- **Done when**: tests above pass; cobertura de `src/domain/` ≥ 90%; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Streak atual a partir das datas de revisão

- **Covers**: STK-01, STK-02, STK-03
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/domain/streak.ts`, `src/domain/streak.test.ts`
- **Change**: `currentStreak(reviewedAt, now)`.
- **Tests**:
  - SPEC STK-02 · unit — hoje 10/10: revisões em 08, 09, 10 → 3; 08, 09 → 2; 07, 08 → 0; só 10 → 1; nenhuma → 0
  - SPEC STK-01 · unit — revisão em 09 às 00:00 conta para 09, não para 08
  - SPEC STK-03 · unit — três revisões em 10 → 1; 09 23:59 e 10 00:01 → 2; entrada fora de ordem dá o mesmo resultado
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Progresso da sessão conta cartões e respostas

- **Covers**: ANS-02, ANS-03, SUM-03, SUM-05, INV-03
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/domain/session.ts`, `src/domain/session.test.ts`
- **Change**: `startSession`, `answerSession`, `skipCurrent`, `accuracy`, `studyMinutes`.
- **Tests**:
  - SPEC ANS-02 · unit — fila `[a, b]`, Errei em `a` → fila `[b, a']` (`a'` = cartão atualizado), `completed 0`, `counts[0] 1`
  - SPEC ANS-03 · unit — Difícil, Bom e Fácil → cartão sai, `completed + 1`, contagem da nota + 1
  - SPEC SUM-03 · unit — `counts [3, 4, 15, 5]` → 89; `[1, 0, 0, 0]` → 0; `[0, 0, 1, 0]` → 100
  - SPEC SUM-05 · unit — 12 min 29 s → 12; 12 min 30 s → 13; 59 s → 0 (a view mostra `< 1 min`)
  - INVARIANT INV-03 · unit — 100 sessões aleatórias (seed fixa) com respostas e `skipCurrent` → após cada passo `0 <= completed <= total` e `completed + queue.length === total`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T4 — Repositório monta a fila vencida e conta os cartões de amanhã

- **Covers**: QUE-01, QUE-04, PERF-01, SUM-06
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/features/study/interfaces.ts`, `src/features/study/adapters.ts`, `src/features/study/repository.ts`, `src/features/study/repository.test.ts`, `src/features/study/index.ts`, `src/features/study/usecases/keys.ts`, `src/features/study/usecases/use-study-queue.ts`, `src/features/study/usecases/use-due-tomorrow.ts`, `src/features/study/usecases/study.test.tsx`
- **Change**: feature `study` com `queue` e `countDueTomorrow`, e os hooks `useStudyQueue(deckId?)` e `useDueTomorrow(deckId?)` com `gcTime: 0`.
- **Tests**:
  - SPEC QUE-01 · integration — `now` 10/10 10:00; cartões com `dueDate` 09/10, 10/10 23:00, 11/10 00:00 → fila com os dois primeiros, ordem por `dueDate`; empate de `dueDate` → ordem por `createdAt`; escopo de baralho exclui outros baralhos; sem `deckId` junta todos, cada item com `deckId` e `deckName` certos
  - SPEC QUE-04 · integration — `queue("xyz")` e `queue(<id válido inexistente>)` → `null`; baralho sem vencidos → `[]`
  - SPEC PERF-01 · integration — 1.000 vencidos + 1.000 futuros num baralho → fila com 1.000; `toStudyCard` (espião) chamado 1.000 vezes
  - SPEC SUM-06 · integration — `now` 10/10: `dueDate` 10/10, 11/10 23:59, 12/10 00:00 → `countDueTomorrow` 2 (inclui os de hoje); escopo respeitado
  - SPEC QUE-01 · hook — `useStudyQueue` montado, desmontado; cartão novo criado no Realm; remontado → fila nova inclui o cartão (`gcTime: 0`)
  - REGRESSION · unit — `architecture.test.ts` verde com `study` (ARC-01, 02, 03, 05)
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T5 — Responder grava cartão e ReviewLog juntos e o streak é lido do banco

- **Covers**: ANS-01, ANS-07, ANS-08, SUM-04, INV-01
- **Depends on**: T2, T4
- **Risk**: inherit
- **Touches**: `src/features/study/interfaces.ts`, `src/features/study/repository.ts`, `src/features/study/repository.test.ts`, `src/features/study/index.ts`, `src/features/study/usecases/use-answer-card.ts`, `src/features/study/usecases/use-streak.ts`, `src/features/study/usecases/study.test.tsx`
- **Change**: `answer(cardId, grade)` e `currentStreak()`; hooks `useAnswerCard` (invalida `["cards"]`, `["decks"]`, `["study"]`) e `useStreak`.
- **Tests**:
  - SPEC ANS-01 · integration — `now` fixo, cartão `(2, 3, 2.5)` em baralho B + Bom → Realm tem `rep 3`, `int 8`, `EF 2.5`, `dueDate` = `startOfLocalDay(now) + 8`; um `ReviewLog` com `cardId`, `deckId` de B, `grade 2`, `reviewedAt = now`
  - SPEC ANS-08 · integration — `realm.create` lança ao criar o `ReviewLog` → `answer` lança; cartão com valores antigos; zero logs
  - CONTRACT · integration — `answer` de id inexistente → `AppError` `CARD_NOT_FOUND`, nada gravado
  - SPEC SUM-04 · integration — logs em 08, 09, 10 com `now` 10/10 → `currentStreak()` 3
  - SPEC ANS-07 · hook — `useDecks` montado; `useAnswerCard` com Bom → `waitFor` `dueCount` − 1
  - INVARIANT INV-01 · integration — 100 respostas aleatórias (seed fixa) em 10 cartões, ~20% com falha injetada no `realm.create` → nº de logs = nº de respostas aceitas; cada log casa com uma mudança do cartão
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T6 — Sessão mostra frente, verso e progresso

- **Covers**: SES-01, SES-02, SES-03, SES-04, SES-05, SES-06, QUE-04, LOAD-01, A11Y-01, THM-01
- **Depends on**: T3, T4
- **Risk**: inherit
- **Touches**: `src/app/study.tsx`, `src/app/decks/[deckId]/study.tsx`, `src/features/study/screens/study-screen.tsx`, `src/features/study/screens/session-view.tsx`, `src/features/study/screens/study-session.test.tsx`, `src/components/icon.tsx`, `src/components/icon.test.tsx`
- **Change**: rotas finas e `StudyScreen` com as fases `loading`, `notFound` e `studying`; `SessionView` com topo, nome do baralho, frente, verso e botões com rótulos; ícones `close`, `calendar`, `flame`.
- **Tests**:
  - SPEC SES-01 · screen — 3 vencidos → `1 de 3`; barra com `accessibilityValue` `{ now: 0, max: 3 }`; botão `Sair da sessão`
  - SPEC SES-02 · screen — `/study` com cartões de A e B → nome de A no primeiro cartão
  - SPEC SES-03 · screen — `FRENTE`, texto da frente, `Toque para ver a resposta`, `Mostrar resposta`; sem `VERSO`
  - SPEC SES-04 · screen — tocar o cartão mostra `VERSO`, o verso e `Como foi lembrar?`; `Mostrar resposta` faz o mesmo
  - SPEC SES-05 · screen — cartão novo → `agora`, `1 dia`, `1 dia`, `1 dia`; cartão `(2, 3, 2.5)` → `agora`, `4 dias`, `8 dias`, `10 dias`
  - SPEC SES-06 · screen — com a frente visível, nenhum botão `Errei`/`Difícil`/`Bom`/`Fácil`
  - SPEC A11Y-01 · screen — barra lida como `Cartão 1 de 3`; botão de resposta com label `Bom, 1 dia`; tocáveis com role `button`, label e ≥ 44
  - SPEC QUE-04 · screen — `/decks/xyz/study` → `Baralho não encontrado`; `Voltar ao início` → pathname `/`
  - SPEC LOAD-01 · screen — antes da fila resolver, nem `Nada para revisar hoje` nem `Baralho não encontrado`
  - SPEC THM-01 · screen — esquema escuro → fundo `darkColors.background`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T7 — Início e Baralho abrem a sessão

- **Covers**: ENT-01, ENT-02, ENT-03
- **Depends on**: T6
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/deck-screen.tsx`, `src/features/decks/screens/deck-screen.test.tsx`, `src/features/decks/screens/home-screen.tsx`, `src/features/decks/screens/home-screen.test.tsx`
- **Change**: botão `Estudar · N cartões` abaixo dos selos do Baralho; `Estudar tudo` com selo acima de `Seus baralhos` na Início.
- **Tests**:
  - SPEC ENT-01 · screen — `dueCount` 12 → `Estudar · 12 cartões`; 1 → `Estudar · 1 cartão`; 0 → `Estudar`; baralho sem cartões → `Estudar`
  - SPEC ENT-02 · screen — dois baralhos com 2 e 3 vencidos → `Estudar tudo` + selo `5 cartões`; 1 → `1 cartão`; 0 → sem selo; sem baralhos → sem botão
  - SPEC ENT-03 · screen — tocar `Estudar` → pathname `/decks/<id>/study`; `Estudar tudo` → `/study`
  - REGRESSION · screen — suítes de Início e Baralho verdes (HOME-06, A11Y-01 da M2)
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T8 — Responder agenda o cartão e avança a sessão

- **Covers**: ANS-01, ANS-02, ANS-04, ANS-06, ANS-08, QUE-02, QUE-05
- **Depends on**: T5, T6
- **Risk**: inherit
- **Touches**: `src/features/study/screens/session-view.tsx`, `src/features/study/screens/study-answer.test.tsx`
- **Change**: botões chamam `useAnswerCard`; sucesso aplica `answerSession` e volta à frente; erro mostra a mensagem; `useCard(atual.id) === null` → `skipCurrent`.
- **Tests**:
  - SPEC ANS-01 · screen — Bom no 1º cartão → Realm com um `ReviewLog` `grade 2` e cartão `repetitions 1`
  - SPEC ANS-02 · screen — fila `[a, b]`, Errei em `a` → mostra `b`, `1 de 2`; depois mostra `a` com `Difícil, 1 dia`
  - SPEC ANS-04 · screen — após Bom, o próximo cartão aparece com `FRENTE` e sem `VERSO`
  - SPEC ANS-06 · screen — dois `fireEvent.press` seguidos em `Bom` → um `ReviewLog`
  - SPEC ANS-08 · screen — `realm.write` lança uma vez → `Não foi possível salvar a resposta. Tente de novo.`, mesmo cartão com verso, `1 de N`, zero logs; segunda tentativa grava
  - SPEC QUE-02 · screen — sessão aberta com 1 vencido; outro cartão criado no Realm durante a sessão; responder Bom → fase Resumo, `1 cartão revisto`
  - SPEC QUE-05 · screen — fila `[a, b]`; `b` excluído no Realm; Bom em `a` → Resumo com `2 cartões revistos` e só um log
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T9 — Sair no meio pede confirmação

- **Covers**: EXT-01, EXT-02, EXT-03
- **Depends on**: T6
- **Risk**: inherit
- **Touches**: `src/features/study/screens/study-screen.tsx`, `src/features/study/screens/session-view.tsx`, `src/features/study/screens/study-exit.test.tsx`
- **Change**: `Sair da sessão` abre `Alert.alert`; `Sair` faz `router.back()`; `BackHandler` só em `studying`; `gestureEnabled` dinâmico.
- **Tests**:
  - SPEC EXT-01 · screen — tocar fechar → `Alert.alert("Sair da sessão?", "Seu progresso já foi salvo.", [Continuar, Sair])`
  - SPEC EXT-02 · screen — de `/decks/<id>`: Bom no 1º, fechar, `Sair` → pathname `/decks/<id>`, o log continua no Realm, sem `Sessão concluída`; `Continuar` → mesmo cartão com verso visível
  - SPEC EXT-03 · screen — handler capturado de `BackHandler.addEventListener` retorna `true` e abre o mesmo alerta; após desmontar, o listener foi removido
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T10 — Fila vazia mostra Nada para revisar

- **Covers**: QUE-03, EMP-01, EMP-02, EMP-03, THM-01
- **Depends on**: T6
- **Risk**: inherit
- **Touches**: `src/features/study/screens/study-screen.tsx`, `src/features/study/screens/empty-view.tsx`, `src/features/study/screens/study-empty.test.tsx`
- **Change**: fase `empty` com textos, selo de amanhã (`useDueTomorrow`), `Voltar ao início` e, só com `deckId`, `Adicionar novos cartões`.
- **Tests**:
  - SPEC QUE-03 · screen — baralho sem vencidos → `Nada para revisar hoje`
  - SPEC EMP-01 · screen — textos exatos; 2 cartões para amanhã → `Amanhã: 2 cartões`; 1 → `Amanhã: 1 cartão`; 0 → `Amanhã: nenhum cartão`
  - SPEC EMP-02 · screen — com baralho, `Adicionar novos cartões` → pathname `/decks/<id>/cards/new`; em `/study`, o link não existe
  - SPEC EMP-03 · screen — fechar → pathname de origem, `Alert.alert` não chamado; `Voltar ao início` → `/`
  - SPEC THM-01 · screen — esquema escuro → fundo `darkColors.background`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T11 — Fim da fila mostra o Resumo

- **Covers**: ANS-05, ANS-07, SUM-01, SUM-02, SUM-03, SUM-04, SUM-05, SUM-06, SUM-07, THM-01
- **Depends on**: T8, T10
- **Risk**: inherit
- **Touches**: `src/features/study/screens/study-screen.tsx`, `src/features/study/screens/summary-view.tsx`, `src/features/study/screens/study-summary.test.tsx`
- **Change**: fase `summary` com cabeçalho, três blocos, `Suas respostas`, `Amanhã` e `Concluir`.
- **Tests**:
  - SPEC ANS-05 · screen — última resposta → `Sessão concluída`; `BackHandler` não intercepta mais; `router.back()` → origem, não a sessão
  - SPEC SUM-01 · screen — `Sessão concluída` e `Bom trabalho! Você revisou tudo o que vencia hoje.`
  - SPEC SUM-02 · screen — 2 cartões com Errei, Bom, Fácil → `2 cartões revistos`; 1 cartão → `1 cartão revisto`
  - SPEC SUM-03 · screen — mesma sessão → `67% de acerto`
  - SPEC SUM-04 · screen — logs de ontem no Realm + sessão hoje → `2 dias seguidos`; só hoje → `1 dia seguido`
  - SPEC SUM-05 · screen — contagens `1`, `0`, `1`, `1`; barra com 3 segmentos (Difícil ausente); relógio falso: 2 min 40 s → `3 min de estudo`; 20 s → `< 1 min de estudo`
  - SPEC SUM-06 · screen — 3 cartões para amanhã → `Amanhã: 3 cartões para revisar`; 0 → `Amanhã: nenhum cartão para revisar`
  - SPEC SUM-07 · screen — `Concluir` → pathname de origem (`/decks/<id>` ou `/`)
  - SPEC ANS-07 · screen — Baralho com `Estudar · 2 cartões`; sessão com Bom, Bom; `Concluir` → `Estudar` e selo `para hoje` ausente
  - SPEC THM-01 · screen — esquema escuro → fundo `darkColors.background`
- **Done when**: tests above pass; full gate green
- **Gate**: full
- **Status**: [ ] pending

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2 ∥ T3 ∥ T4
- **Wave 3**: T5 ∥ T6
- **Wave 4**: T7 ∥ T8
- **Wave 5**: T9 → T10 (mesmo arquivo)
- **Wave 6**: T11

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Streak sem ler todos os `ReviewLog` | Volume do MVP é pequeno | M4, com estatísticas |
| Contagens da Início na virada do dia sem escrita | `staleTime: Infinity` (AD-002) | Feature futura |
| Animação de virar o cartão e confete do Resumo | Não estão nos ACs | Polimento pós-M3 |

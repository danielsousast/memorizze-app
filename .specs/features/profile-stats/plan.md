# Estatísticas do Perfil — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Approved

## Approach

Lógica pura em `src/domain/` (maior sequência, contagens por janela, acerto, estágios). Um método `stats()` no repositório do Perfil lê `ReviewLog` e `Card` e devolve dados simples; um hook `useStats` faz uma única query (AD-001, AD-002). A aba Perfil renderiza três componentes novos em `src/features/profile/screens/` (AD-003): tiles de sequência e acerto, gráfico de barras com `View` e barra de estágios. A tela refaz a leitura ao ganhar foco, como já faz com `useReviewsToday`.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `currentStreak` | `src/domain/streak.ts` | Sequência atual; `longestStreak` entra no mesmo arquivo |
| `startOfLocalDay`, `addLocalDays` | `src/domain/dates.ts` | Janelas e dias locais; ganha `formatWeekdayShort` |
| `cardStage` | `src/domain/stage.ts` | Estágio de cada cartão |
| `GoalProgress`, `useFocusEffect` refetch | `profile-screen.tsx` | Padrão de atualização ao focar |
| `createProfileRepository(realm, now)` | `src/features/profile/repository.ts` | Recebe `stats()`; relógio injetável |
| `profileKeys.all` | `src/features/profile/usecases/keys.ts` | `answer` já invalida o prefixo; chave nova `stats` |

### Components and interfaces

- **`src/domain/stats.ts`** (puro): `dailyCounts(dates, now, days): number[]` (do mais antigo a hoje); `accuracy(logs, now, days): number | null`; `stageCounts(cards): { new; learning; mature }`. Ignora datas após `now` (EDG-02).
- **`longestStreak(dates: Date[]): number`** em `streak.ts`.
- **`ProfileStats`** em `interfaces.ts`: `{ currentStreak; longestStreak; accuracy7: number | null; accuracy30: number | null; week: number[]; stages: { new; learning; mature } }`.
- **`ProfileRepository.stats(): ProfileStats`**: um método, uma leitura de `ReviewLog` e `Card`.
- **`useStats()`** (`usecases/use-stats.ts`): `useQuery` com `profileKeys.stats`.
- **`StatsSection`**, **`WeekChart`**, **`StageBar`** (`screens/`): recebem `ProfileStats` e `dailyGoal`.

### Error handling

| Failure (AC) | Handling | User sees |
| --- | --- | --- |
| ERR-01 | `useStats` em erro → `StatsSection` troca os blocos pela mensagem; o cartão `Meta diária` não depende da query | `Não foi possível carregar as estatísticas.` |
| ACC-04 | `accuracy` devolve `null` sem revisões | `—` |
| CRD-04 | `stageCounts` zerado, barra sem segmentos | `0 no total`, trilho cinza |

### Architecture impact

**Architecture impact**: none — `src/domain/stats.ts` já está previsto em ARCHITECTURE.md.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Uma query para tudo | `stats()` único | Um hook, uma leitura; evita quatro estados de erro separados |
| Gráfico | `View` com altura proporcional | Sem dependência nativa (Assumptions) |
| Abreviação do dia | Tabela escrita à mão em `dates.ts` | Mesmo padrão dos meses; sem `Intl` no Hermes |
| Atualização | `refetch` ao focar | Contagem de cartões muda fora do fluxo de `answer` (criar/excluir cartão) |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Janela de dias errada em mudança de horário de verão | `src/domain/stats.ts` | Dia contado duas vezes ou perdido | Só `startOfLocalDay` e `addLocalDays`; teste em 2 dias de DST (EDG-01) |
| Leitura de todo o `ReviewLog` para a maior sequência | `repository.ts` | Lento com histórico grande | Aceito no MVP; um passe só, datas em `Set`; medir no Verify |

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Domain | unit | SPEC, REGRESSION | `src/domain/*.test.ts` |
| Repository | integration (Realm em memória) | SPEC, CONTRACT | `src/features/profile/repository.test.ts` |
| Hook | wiring | SPEC | `src/features/profile/usecases/profile.test.tsx` |
| Screen | router + Realm | SPEC | `src/features/profile/screens/*.test.tsx` |

Mutação (1–3 alvos, MEDIUM): `>= 1` → `> 1` em `accuracy`; `-1` → `0` em `longestStreak`; `days - 1` → `days` em `dailyCounts`.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest <paths da tarefa> && npx tsc --noEmit` | após cada tarefa |
| full | `npm test && npx expo lint && npx tsc --noEmit` | após cada onda e antes do Verify |

## Tasks

### T1 — Calcular a maior sequência

- **Covers**: SEQ-02, SEQ-03, SEQ-04
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/streak.ts`, `src/domain/streak.test.ts`
- **Change**: função pura `longestStreak` ao lado de `currentStreak`.
- **Tests**:
  - SPEC SEQ-03 · unit — os cinco exemplos (`{}`, `{10/10}`, `{09/10}`, `{05,06,07,09,10/10}`, `{07,08/10}`) → atual/maior 0/0, 1/1, 1/1, 2/3, 0/2
  - SPEC SEQ-02 · unit — sem datas → 0; datas repetidas no mesmo dia contam 1; 23:59 e 00:00 seguintes contam 2 dias
  - SPEC SEQ-04 · unit — para 100 conjuntos aleatórios (`createRandom`), `longestStreak ≥ currentStreak`
  - REGRESSION · unit — `currentStreak` mantém os testes atuais de `streak.test.ts`
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T2 — Calcular acerto, contagens diárias e estágios por janela local

- **Covers**: ACC-01, ACC-02, ACC-03, ACC-04, EDG-01, EDG-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/stats.ts`, `src/domain/stats.test.ts`, `src/domain/dates.ts`, `src/domain/dates.test.ts`
- **Change**: funções puras `dailyCounts`, `accuracy`, `stageCounts` e `formatWeekdayShort`.
- **Tests**:
  - SPEC ACC-03 · unit — notas 0,0,1,2,2,2,3,3,3,3 → 80; 2 de 3 → 67
  - SPEC ACC-01 · unit — revisão de 6 dias atrás entra, de 7 dias atrás não
  - SPEC ACC-02 · unit — revisão de 29 dias atrás entra, de 30 dias atrás não
  - SPEC ACC-04 · unit — sem revisões na janela → `null`
  - SPEC EDG-01 · unit — logs 23:59 e 00:00 seguintes caem em posições vizinhas de `dailyCounts`, também numa mudança de horário de verão
  - SPEC EDG-02 · unit — log com data após `now` não entra em `dailyCounts` nem em `accuracy`
  - REGRESSION · unit — `stageCounts` usa `cardStage`: `repetitions 0` → novo, `intervalDays 20` → aprendendo, `21` → maduro; `formatWeekdayShort` de domingo a sábado → `Dom`…`Sáb`
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T3 — Ler as estatísticas do Realm em uma query

- **Covers**: enabler for T4
- **Depends on**: T1, T2
- **Risk**: inherit
- **Touches**: `src/features/profile/interfaces.ts`, `src/features/profile/repository.ts`, `src/features/profile/usecases/keys.ts`, `src/features/profile/usecases/use-stats.ts`, `src/features/profile/index.ts`, `src/features/profile/repository.test.ts`, `src/features/profile/usecases/profile.test.tsx`
- **Change**: `stats()` no repositório e `useStats()` com a chave `profileKeys.stats`.
- **Tests**:
  - CONTRACT · repository — Realm com logs e cartões conhecidos e `now` fixo → `stats()` devolve sequências, `accuracy7`/`accuracy30`, `week` (7 posições) e `stages` esperados
  - CONTRACT · repository — Realm vazio → zeros, `null` nos acertos, `week` de sete zeros
  - REGRESSION · hook — `useStats` devolve dados simples e `answer` invalida `profileKeys.stats` (nova leitura após responder um cartão)
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T4 — Mostrar sequência atual, maior sequência e acerto no Perfil

- **Covers**: SEQ-01, SEQ-02, ACC-01, ACC-02, ACC-04, ERR-01, UPD-01, A11Y-01
- **Depends on**: T3
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/stats-section.tsx`, `src/features/profile/screens/profile-screen.tsx`, `src/features/profile/screens/profile-screen.test.tsx`
- **Change**: `StatsSection` com quatro tiles abaixo da meta; `ProfileScreen` refaz a leitura ao focar e mostra a mensagem de erro no lugar da seção.
- **Tests**:
  - SPEC SEQ-01 · screen — 12 dias seguidos → `12 dias` em `Sequência atual`; 1 dia → `1 dia`
  - SPEC SEQ-02 · screen — maior sequência 41 → `41 dias` em `Maior sequência`; sem revisões → `0 dias`
  - SPEC ACC-01 · screen — 87% em 7 dias → `87%` em `Acerto · 7 dias`
  - SPEC ACC-02 · screen — 84% em 30 dias → `84%` em `Acerto · 30 dias`
  - SPEC ACC-04 · screen — sem revisões → `—` nos dois tiles
  - SPEC ERR-01 · screen — `stats()` lança → `Não foi possível carregar as estatísticas.` e o cartão `Meta diária` continua visível
  - SPEC UPD-01 · screen — grava um `ReviewLog`, sai e volta para a aba → sequência e acerto mudam
  - SPEC A11Y-01 · screen — labels `Sequência atual, 12 dias` e `Acerto 7 dias, 87%`
  - REGRESSION · screen — testes atuais de meta, nome e `Revisões hoje` continuam passando
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [x] done

### T5 — Mostrar o gráfico dos últimos 7 dias

- **Covers**: CHT-01, CHT-02, CHT-03, CHT-04, CHT-05
- **Depends on**: T4
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/week-chart.tsx`, `src/features/profile/screens/stats-section.tsx`, `src/features/profile/screens/week-chart.test.tsx`
- **Change**: `WeekChart` com 7 barras, valor acima, rótulos de dia, `Hoje` em destaque, linha `meta G` e total no cabeçalho.
- **Tests**:
  - SPEC CHT-01 · component — `week` = [32,24,35,30,41,28,18] → sete valores nessa ordem
  - SPEC CHT-02 · component — hoje = sábado → rótulos `Dom, Seg, Ter, Qua, Qui, Sex, Hoje`, e só o último usa a cor de destaque
  - SPEC CHT-03 · component — total 208 → `208 revisões`; total 1 → `1 revisão`
  - SPEC CHT-04 · component — meta 30 e maior dia 41 → barra de 41 com altura útil cheia, barra de 30 em 30/41; todos abaixo da meta → escala = meta; dia 0 → valor `0` e altura mínima > 0; `meta 30` visível
  - SPEC CHT-05 · component — um único label `Últimos 7 dias: Sáb 32, Dom 24, …, Hoje 18`
- **Done when**: testes acima passam; quick gate verde
- **Gate**: quick
- **Status**: [ ] pending

### T6 — Mostrar os cartões por estágio

- **Covers**: CRD-01, CRD-02, CRD-03, CRD-04, THM-01, A11Y-01
- **Depends on**: T5
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/stage-bar.tsx`, `src/features/profile/screens/stats-section.tsx`, `src/features/profile/screens/stage-bar.test.tsx`
- **Change**: `StageBar` com título, total, barra de três segmentos e contagens `Novos`, `Aprendendo`, `Maduros`.
- **Tests**:
  - SPEC CRD-01 · component — 96/128/268 → `492 no total` e as três contagens com os nomes certos
  - SPEC CRD-02 · component — segmento com 0 não é renderizado; ordem Novos, Aprendendo, Maduros
  - SPEC CRD-03 · component — 96/128/268 → pesos de largura 96:128:268 (19,5%, 26,0%, 54,5%)
  - SPEC CRD-04 · component — 0/0/0 → `0 no total`, três `0`, nenhum segmento
  - SPEC THM-01 · screen — Perfil nos esquemas claro e escuro: fundos dos cartões vêm de `colors.surface`, destaque de `colors.accent`
  - SPEC A11Y-01 · component — label `Cartões novos, 96`
  - REGRESSION · screen — `profile-screen.test.tsx` completo
- **Done when**: testes acima passam; full gate verde
- **Gate**: full
- **Status**: [ ] pending

## Execution Waves

- **Wave 1**: T1 ∥ T2
- **Wave 2**: T3
- **Wave 3**: T4
- **Wave 4**: T5
- **Wave 5**: T6

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| UAT visual em development build (PNG 7 claro e escuro) | Precisa de dispositivo | Verify |

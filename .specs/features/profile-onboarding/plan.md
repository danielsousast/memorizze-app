# Perfil e entrada — Plan

**Spec**: [spec.md](spec.md)
**Risk**: HIGH (from spec)
**Status**: Approved

## Approach

A regra pura fica em `src/domain/`: o passo da meta (`stepGoal`) e o mês por extenso de `createdAt`. Uma nova feature `src/features/profile/` segue AD-001: o repositório lê o perfil (o mais antigo, PRF-06), cria (idempotente, INV-01), atualiza nome ou meta e conta as revisões do dia local por consulta ao `reviewedAt` indexado; cada hook faz uma chamada React Query (AD-002). A entrada usa `Stack.Protected` do Expo Router 57: um `RootStack` lê o perfil, não renderiza nada enquanto a leitura não termina (ENT-03) e protege a Boas-vindas com `guard={!profile}` e o resto do app com `guard={!!profile}`. Quando o perfil nasce, o guard muda, o Expo Router tira a Boas-vindas do histórico e leva à âncora `(tabs)` (WEL-02). As abas usam `Tabs` de `expo-router/js-tabs` num grupo `(tabs)` com `index` e `profile`; o resto do app continua no `Stack` raiz, por cima das abas (TAB-02). As telas seguem AD-003 e reusam `TextField`, `Button`, `Badge`, `Screen`, `Icon` e o streak do M3 (`useStreak`).

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `startOfLocalDay`, `addLocalDays`, `MONTHS` | `src/domain/dates.ts` | Limites do dia em REV-01; `MONTHS` alimenta `formatMonthYear` |
| `currentStreak`, `useStreak` | `src/domain/streak.ts`, `@/features/study` | Streak do cartão da Início (HOM-02) |
| `plural` | `src/domain/text.ts` | `1 dia seguido` / `N dias seguidos` |
| Formulário com `busy` ref, mapa de códigos e `GENERIC_ERROR` | `src/features/decks/screens/deck-form-screen.tsx` | Boas-vindas (WEL-06) e modal `Editar nome` |
| Padrão de repositório e adapters | `src/features/decks/` | `createProfileRepository(realm, now)` |
| `TextField` (repassa `maxLength`), `Button`, `Badge`, `Screen`, `Icon` | `src/components/` | Toda a UI; `Icon` ganha `house`, `person`, `minus` |
| Token `sizes.progressGoal` (10) | `src/theme/layout.ts` | Barra da meta |
| `openTestRealm`, `createRandom`, `renderHookWithProviders`, `renderRouterWithProviders` | `src/testing/` | Realm em memória, seeds, hooks e telas |

### Components and interfaces

**Domínio (`src/domain/`, puro)**

- `goal.ts`: `GOAL_MIN = 5`, `GOAL_MAX = 200`, `GOAL_STEP = 5`; `stepGoal(goal: number, direction: 1 | -1): number` (múltiplo de 5 seguinte ou anterior, limitado a 5..200; GOL-06); `canStep(goal, direction): boolean` (GOL-02).
- `dates.ts` (+): `formatMonthYear(d): string` → `março de 2026`.

**profile (nova feature, AD-001)**

- `interfaces.ts`: `Profile = { id; name; dailyGoal; createdAt }`; `ProfileErrorCode = "PROFILE_NAME_EMPTY" | "PROFILE_NAME_TOO_LONG" | "PROFILE_NOT_FOUND"`; `ProfileInput = { name?: string; dailyGoal?: number }`; `ProfileRepository`:
  - `get(): Profile | null` — o de `createdAt` mais antigo (PRF-06).
  - `create(name: string): Profile` — valida; se já existe perfil, devolve o existente sem gravar (INV-01).
  - `update(input: ProfileInput): Profile` — valida o nome quando presente; grava no perfil de `get()`.
  - `countReviewsToday(): number` — `ReviewLog` com `reviewedAt >= startOfLocalDay(now)` e `< startOfLocalDay(addLocalDays(now, 1))`.
- `adapters.ts`: `toProfile(object)`.
- `repository.ts`: `createProfileRepository(realm, now = () => new Date())` + `useProfileRepository()`. Nome: `trim`; vazio → `PROFILE_NAME_EMPTY`; > 30 → `PROFILE_NAME_TOO_LONG`; tudo antes do `realm.write`.
- `usecases/`: `keys.ts` (`profileKeys.all = ["profile"]`, `profile`, `reviewsToday`), `use-profile.ts`, `use-reviews-today.ts`, `use-create-profile.ts`, `use-update-profile.ts` (mutações invalidam `["profile"]`).
- `use-answer-card.ts` (study) passa a invalidar também `["profile"]` (revisões hoje).

**Navegação**

- `src/navigation/root-stack.tsx` (PROJECT-SPEC §9): `RootStack` lê `useProfile`; `isPending` → `null`. Declara `Stack.Protected guard={!profile}` com `welcome` e `Stack.Protected guard={!!profile}` com `(tabs)`, os modais existentes e `edit-name` (modal). `unstable_settings = { anchor: "(tabs)" }` no layout raiz.
- `src/app/_layout.tsx`: providers como hoje; troca o `Stack` inline por `<RootStack />`.
- `src/app/(tabs)/_layout.tsx`: `Tabs` (`expo-router/js-tabs`), `headerShown: false`, rótulos `Início` e `Perfil`, ícones `house` e `person`, cores do tema.
- Rotas: `src/app/index.tsx` → `src/app/(tabs)/index.tsx` (URL `/` igual); novas `(tabs)/profile.tsx`, `welcome.tsx`, `edit-name.tsx`.
- `src/testing/router.tsx`: opção `{ navigator }` para trocar o `Stack` injetado pelo `RootStack` nos testes de entrada.

**Telas (AD-003)**

| Tela | Arquivo | ACs |
| --- | --- | --- |
| Boas-vindas | `src/features/profile/screens/welcome-screen.tsx` | WEL-01..06 |
| Perfil | `src/features/profile/screens/profile-screen.tsx` | PRF-01..03, GOL-01..06 |
| Editar nome | `src/features/profile/screens/edit-name-screen.tsx` | PRF-04, PRF-05 |
| Início | `src/features/decks/screens/home-screen.tsx` + `streak-card.tsx` | HOM-01..07 |
| Barra da meta | `src/components/goal-progress.tsx` (`label`, `done`, `goal`, `suffix?`) | HOM-04, HOM-05, PRF-02 |

Mensagens do nome (`Digite seu nome.`, `Use no máximo 30 caracteres.`) ficam em `src/features/profile/screens/name-errors.ts`, usadas pela Boas-vindas e pelo modal.

HOM-07: `HomeScreen` e `ProfileScreen` chamam `refetch` de streak e revisões hoje em `useFocusEffect`; a troca de dia é pega ao voltar a tela.

### Data

Nenhuma mudança de schema. `Profile` já tem `name`, `dailyGoal` (padrão 20) e `createdAt`; `ReviewLog.reviewedAt` já é indexado.

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| WEL-03 | Repositório lança `PROFILE_NAME_EMPTY` antes do `realm.write` | `Digite seu nome.` no campo |
| WEL-04 | `maxLength={30}` no campo; repositório lança `PROFILE_NAME_TOO_LONG` | `Use no máximo 30 caracteres.` no campo |
| ERR-01 | Qualquer outro erro da mutação | `Não foi possível salvar. Tente de novo.` (`accessibilityRole="alert"`); tela e valor gravado intactos |
| WEL-06 | `busy` ref + `disabled={isPending}`; `create` idempotente | Um só `Profile` |
| PRF-06 | `get()` ordena por `createdAt` | Perfil mais antigo |
| GOL-05, GOL-06 | Valor exibido como gravado; `stepGoal` normaliza no toque | `23` → `+` 25 |

### Architecture impact

**Architecture impact**: ARCHITECTURE_UPDATE_REQUIRED — abas Início/Perfil no grupo `(tabs)`, entrada protegida por `Stack.Protected` em `src/navigation/root-stack.tsx`, feature `profile`, linha `["profile"]` na matriz de invalidação.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Desvio de entrada | `Stack.Protected` no `RootStack` (AD-004) | API oficial do Expo Router 57; limpa o histórico ao mudar o guard |
| Onde fica o `RootStack` | `src/navigation/` | Não é rota nem tela; PROJECT-SPEC §9 prevê a pasta |
| Tabs | `expo-router/js-tabs` | `Tabs` de `expo-router` está marcado `@deprecated` na 57; native tabs ainda é `unstable` |
| Modal de nome | Rota raiz `/edit-name` | Evita `/profile` (aba) e `/profile/edit` competindo pelo mesmo segmento |
| Streak na Início | Reusa `useStreak` de `@/features/study` | Uma fonte só; o Resumo já usa |
| Revisões hoje | Consulta Realm com faixa do dia | `reviewedAt` indexado; não carrega todos os logs |

## Alternatives Considered

| Option | Trade-offs | Verdict |
| --- | --- | --- |
| `Stack.Protected` com guard pelo perfil | + oficial, declarativo, histórico limpo; − testes precisam do `RootStack` no helper | Chosen |
| `<Redirect href="/welcome">` na Início e o inverso na Boas-vindas | + simples; − pisca a tela errada, cada rota precisa lembrar do guard, voltar pode reabrir a Boas-vindas | Rejected |
| Layout raiz renderiza Boas-vindas ou o `Stack` conforme o perfil | + sem rota nova; − Boas-vindas fora do router, sem URL e sem teste de navegação | Rejected |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| `Stack.Protected` e âncora não se comportarem como a doc no `renderRouter` | `src/navigation/root-stack.tsx` | ENT/WEL-02 sem prova | T4 testa as três entradas e o voltar; fallback: `router.replace("/")` após criar |
| `Stack.Screen` declarado para rota ausente no mapa de teste gera aviso | testes com `RootStack` | Ruído no Jest | Mapas de teste de entrada incluem todas as rotas declaradas (stubs) |
| Mover `index.tsx` para `(tabs)` quebra imports de teste | `home-screen.test.tsx` | Suíte vermelha | T4 atualiza o import e o mapa de rotas (REGRESSION) |
| `HOME-01` do M2 espera `Olá` sem nome | `home-screen.test.tsx` | Teste antigo contradiz HOM-01 | T7 atualiza a asserção citando HOM-01 |
| Tabs dentro do helper de teste | `src/testing/router.tsx` | TAB-01 sem prova | Mapa inclui `(tabs)/_layout`; asserção em `accessibilityState.selected` |
| Splash some antes da leitura do perfil | `_layout.tsx` | Tela de fundo vazia por um instante | Aceito: ENT-03 só exige não mostrar as telas; leitura local leva ms |
| Virada do dia com a Início aberta sem trocar de tela | `home-screen.tsx` | Números do dia anterior até voltar à tela | Aceito; HOM-07 cobre ao voltar a ficar visível |

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Domínio | unit | SPEC, INVARIANT | `src/domain/{goal,dates}.test.ts` |
| Repositório | integração com Realm em memória | SPEC, INVARIANT, CONTRACT | `src/features/profile/repository.test.ts` |
| Hooks | `renderHookWithProviders` | SPEC, REGRESSION | `src/features/profile/usecases/profile.test.tsx`, `src/features/study/usecases/study.test.tsx` |
| Telas e navegação | `renderRouterWithProviders` (+ `RootStack`) com Realm real | SPEC, REGRESSION | `src/features/profile/screens/*.test.tsx`, `src/navigation/root-stack.test.tsx`, `src/features/decks/screens/home-screen.test.tsx` |
| Arquitetura | unit | REGRESSION | `src/features/architecture.test.ts` (passa a ver `profile`) |

Regras de passo da meta e de dia local são testadas uma vez, no domínio e no repositório. As telas provam fiação, texto, navegação e o que fica no Realm. Visual contra os PNGs (claro e escuro) e a barra de abas real ficam no UAT em development build.

Mutações sugeridas ao verificador:
- `stepGoal` sem o limite de 200.
- `countReviewsToday` com `<=` no limite de amanhã.
- `create` sem a checagem de perfil existente.
- `get()` sem ordenar por `createdAt`.
- Subtítulo do cartão ignorando "revisou hoje".
- `guard` da Boas-vindas sempre `true`.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest <paths da task> && npx tsc --noEmit` | após cada task |
| full | `npm test && npx tsc --noEmit && npx expo lint` | após cada wave e antes do verify |

## Tasks

### T1 — Meta anda de 5 em 5 dentro de 5..200 e a data vira mês e ano

- **Covers**: GOL-06, GOL-02, PRF-01, INV-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/goal.ts`, `src/domain/goal.test.ts`, `src/domain/dates.ts`, `src/domain/dates.test.ts`
- **Change**: `stepGoal`, `canStep` e constantes; `formatMonthYear`.
- **Tests**:
  - SPEC GOL-06 · unit — 23 → `+` 25, `−` 20; 3 → `+` 5; 250 → `−` 200; 20 → `+` 25, `−` 15
  - SPEC GOL-02 · unit — `canStep(200, 1)` e `canStep(5, -1)` → `false`; `canStep(195, 1)` → `true`
  - SPEC PRF-01 · unit — `formatMonthYear(new Date(2026, 2, 15))` → `março de 2026`; dezembro → `dezembro de …`
  - INVARIANT INV-02 · unit — 100 sequências de 50 passos (`createRandom`, seed fixa) a partir de 20 → após cada passo `5 <= meta <= 200` e `meta % 5 === 0`
- **Done when**: tests above pass; cobertura de `src/domain/` ≥ 90%; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Repositório lê, cria e atualiza o perfil e conta as revisões de hoje

- **Covers**: REV-01, REV-02, PRF-06, INV-01, WEL-03, WEL-04, PRF-05, GOL-01
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/features/profile/{interfaces,adapters,repository,index}.ts`, `src/features/profile/usecases/*`, `src/features/profile/repository.test.ts`, `src/features/profile/usecases/profile.test.tsx`, `src/features/study/usecases/use-answer-card.ts`, `src/features/study/usecases/study.test.tsx`
- **Change**: feature `profile` com repositório, adapters e quatro hooks; resposta de cartão invalida `["profile"]`.
- **Tests**:
  - SPEC REV-02 · integração — `now` 10/10 12:00; logs 09/10 23:59, 10/10 00:00, 10/10 23:59 → `countReviewsToday() === 2`; sem logs → 0; 3 logs do mesmo cartão hoje → 3
  - SPEC REV-01 · integração — logs com notas 0, 1, 2, 3 hoje → 4
  - SPEC PRF-06 · integração — dois `Profile` (createdAt 2026-01-02 e 2026-01-01) → `get().name` é o de 01/01
  - SPEC WEL-04 · integração — `create("a".repeat(31))` → `PROFILE_NAME_TOO_LONG`, 0 perfis; 30 caracteres → cria
  - SPEC WEL-03 · integração — `create("   ")` → `PROFILE_NAME_EMPTY`, 0 perfis; `create("  Ana  ")` → `name === "Ana"`, `dailyGoal === 20`, `createdAt === now`
  - INVARIANT INV-01 · integração — 100 sequências aleatórias de `create`/`update` (`createRandom`) → após cada passo `realm.objects(Profile).length <= 1`
  - SPEC PRF-05 · integração — `update({ name: " Bia " })` → `"Bia"`; `update({ name: "" })` → `PROFILE_NAME_EMPTY` e nome antigo intacto
  - SPEC GOL-01 · integração — `update({ dailyGoal: 25 })` grava 25
  - CONTRACT · hook — `useProfile` devolve objeto simples (`id` string de 24 hex), sem `Realm.Object`; mutações invalidam `["profile"]`
  - REGRESSION · hook — `useAnswerCard` passa a invalidar `["profile"]` e continua invalidando `["cards"]`, `["decks"]`, `["study"]`
  - REGRESSION · unit — `architecture.test.ts` verde com a feature nova
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Boas-vindas cria o perfil com o nome digitado

- **Covers**: WEL-01, WEL-03, WEL-04, WEL-06, ERR-01, A11Y-01
- **Depends on**: T2
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/welcome-screen.tsx`, `src/features/profile/screens/name-errors.ts`, `src/features/profile/screens/welcome-screen.test.tsx`, `src/app/welcome.tsx`
- **Change**: tela do PNG 1 com campo (`maxLength={30}`) e `Começar`; mapa de mensagens do nome.
- **Tests**:
  - SPEC WEL-01 · tela — textos, três selos, campo `Como podemos te chamar?` com placeholder e botão `Começar`; ilustração com `accessibilityElementsHidden`
  - SPEC WEL-03 · tela — `Começar` com `"   "` → `Digite seu nome.` e 0 perfis no Realm
  - SPEC WEL-04 · tela — campo com `maxLength === 30`
  - SPEC WEL-06 · tela — dois `press` seguidos em `Começar` → 1 `Profile`
  - SPEC ERR-01 · tela — repositório espionado lança erro genérico → `Não foi possível salvar. Tente de novo.`, 0 perfis, ainda na Boas-vindas
  - SPEC A11Y-01 · tela — `Começar` com role `button`, label e altura ≥ 44
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T4 — App abre na Boas-vindas sem perfil e na Início com perfil

- **Covers**: ENT-01, ENT-02, ENT-03, WEL-02, WEL-05
- **Depends on**: T3
- **Risk**: inherit
- **Touches**: `src/navigation/root-stack.tsx`, `src/navigation/root-stack.test.tsx`, `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx` (movido de `src/app/index.tsx`), `src/testing/router.tsx`, `src/testing/router.test.tsx`, `src/features/decks/screens/home-screen.test.tsx`
- **Change**: `RootStack` com dois `Stack.Protected`; grupo `(tabs)` só com a Início (âncora); helper de teste aceita `navigator`.
- **Tests**:
  - SPEC ENT-01 · navegação — Realm sem perfil, URL `/` → pathname `/welcome`, texto `Começar`
  - SPEC ENT-02 · navegação — Realm com perfil → pathname `/`, `home-screen` visível
  - SPEC ENT-03 · navegação — `useProfile` pendente (query nunca resolve) → nem `Começar` nem `home-screen`
  - SPEC WEL-02 · navegação — sem perfil, digita `Ana`, `Começar` → pathname `/`, `home-screen` visível; voltar não mostra `Começar`
  - SPEC WEL-05 · navegação — com perfil, `router.push("/welcome")` → não mostra `Começar`
  - REGRESSION · tela — suíte da Início verde com o novo caminho da rota
  - REGRESSION · unit — `router.test.tsx` verde sem `navigator` (Stack padrão)
- **Done when**: tests above pass; full gate green (toca o layout raiz)
- **Gate**: full
- **Status**: [ ] pending

### T5 — Barra de abas Início e Perfil só nas telas principais

- **Covers**: TAB-01, TAB-02
- **Depends on**: T4
- **Risk**: inherit
- **Touches**: `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/profile.tsx`, `src/features/profile/screens/profile-screen.tsx` (título só), `src/components/icon.tsx`, `src/components/icon.test.tsx`, `src/navigation/tabs.test.tsx`
- **Change**: `Tabs` (`expo-router/js-tabs`) com `Início` e `Perfil`, ícones `house` e `person`, cores do tema; ícone `minus` para o stepper.
- **Tests**:
  - SPEC TAB-01 · navegação — em `/` e `/profile`, abas `Início` e `Perfil` visíveis; a atual com `accessibilityState.selected === true`; tocar `Perfil` → pathname `/profile`
  - SPEC TAB-02 · navegação — em `/decks/<id>` e `/study`, sem aba `Perfil` na tela
  - REGRESSION · unit — `icon.test.tsx` cobre `house`, `person`, `minus`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

### T6 — Início mostra o cartão de streak e o progresso da meta

- **Covers**: HOM-02, HOM-03, HOM-04, HOM-05, THM-01
- **Depends on**: T4
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/streak-card.tsx`, `src/features/decks/screens/home-screen.tsx`, `src/features/decks/screens/home-screen.test.tsx`, `src/components/goal-progress.tsx`, `src/components/goal-progress.test.tsx`
- **Change**: cartão do PNG 2/2b abaixo do cabeçalho, com e sem baralhos; `GoalProgress` compartilhado.
- **Tests**:
  - SPEC HOM-02 · tela — logs em 08, 09, 10/10 (hoje 10/10) → `3 dias seguidos`; só hoje → `1 dia seguido`; sem baralhos o cartão aparece
  - SPEC HOM-03 · tela — três linhas da tabela: sem logs → `Sua sequência começa no primeiro estudo`; logs 08 e 09 → `Estude hoje para chegar a 3`; logs 09 e 10 → `Você já estudou hoje`
  - SPEC HOM-04 · tela — meta 30, 18 logs hoje → `18 de 30 revisões`, barra com largura `60%`
  - SPEC HOM-05 · componente — `done 34`, `goal 30` → `34 de 30 revisões`, barra `100%`
  - SPEC THM-01 · tela — esquema escuro → fundo do cartão `darkColors.surface`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

### T7 — Início cumprimenta pelo nome, leva `Estudar tudo` no cartão e se atualiza ao voltar

- **Covers**: HOM-01, HOM-06, HOM-07
- **Depends on**: T6
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/home-screen.tsx`, `src/features/decks/screens/streak-card.tsx`, `src/features/decks/screens/home-screen.test.tsx`
- **Change**: `Olá, {nome}`; `Estudar tudo` e selo dentro do cartão só com baralhos; `useFocusEffect` refaz streak e revisões hoje.
- **Tests**:
  - SPEC HOM-01 · tela — perfil `Marina` → `Olá, Marina` e a data longa (atualiza a asserção `Olá` do M2, citando HOM-01)
  - SPEC HOM-06 · tela — com baralhos, `Estudar tudo` dentro de `streak-card` (`within`); sem baralhos, sem `Estudar tudo` e com `Nenhum baralho ainda`
  - SPEC HOM-07 · navegação — Início → `/study` (stub) → grava `ReviewLog` hoje → volta → `1 de 20 revisões` e `Você já estudou hoje`
  - REGRESSION · tela — selo `N cartões` de ENT-02 do M3 e navegação para `/study` seguem iguais
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

### T8 — Aba Perfil mostra quem estuda, desde quando e a meta do dia

- **Covers**: PRF-01, PRF-02, PRF-03
- **Depends on**: T5, T6
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/profile-screen.tsx`, `src/features/profile/screens/profile-screen.test.tsx`
- **Change**: topo do PNG 7: título, avatar, nome, `Estudando desde`, cartão `Meta diária` com valor e `Revisões hoje`.
- **Tests**:
  - SPEC PRF-01 · tela — perfil `marina`, `createdAt` 15/03/2026 → avatar `M`, `marina`, `Estudando desde março de 2026`
  - SPEC PRF-02 · tela — meta 30, 18 logs hoje → `Meta diária`, `revisões por dia`, `30`, `Revisões hoje`, `18 de 30`
  - SPEC PRF-03 · tela — cabeçalho com role `button` e label `Editar nome, marina`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

### T9 — Tocar no nome abre o modal e salva o nome novo

- **Covers**: PRF-04, PRF-05, ERR-01
- **Depends on**: T8
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/edit-name-screen.tsx`, `src/features/profile/screens/edit-name-screen.test.tsx`, `src/features/profile/screens/profile-screen.tsx`, `src/app/edit-name.tsx`, `src/navigation/root-stack.tsx`
- **Change**: rota modal `/edit-name` com campo preenchido e `Salvar`; o cabeçalho do Perfil navega para ela.
- **Tests**:
  - SPEC PRF-04 · navegação — tocar o cabeçalho → pathname `/edit-name`, título `Editar nome`, campo com o nome atual
  - SPEC PRF-05 · navegação — `  Bia  ` + `Salvar` → volta a `/profile` com `Bia`; Realm `name === "Bia"`; na Início `Olá, Bia`
  - SPEC PRF-05 · tela — vazio → `Digite seu nome.`, nome antigo no Realm
  - SPEC ERR-01 · tela — repositório lança erro genérico → `Não foi possível salvar. Tente de novo.`, modal aberto, nome antigo no Realm
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

### T10 — Stepper muda a meta e a Início acompanha

- **Covers**: GOL-01, GOL-02, GOL-03, GOL-04, GOL-05, ERR-01
- **Depends on**: T1, T9
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/profile-screen.tsx`, `src/features/profile/screens/profile-screen.test.tsx`
- **Change**: botões `−` e `+` com `stepGoal`, gravação por toque, desativados nos limites.
- **Tests**:
  - SPEC GOL-01 · tela — meta 20, `Aumentar meta` → `25` na tela e no Realm; `Diminuir meta` → `20`
  - SPEC GOL-02 · tela — meta 200 → `Aumentar meta` com `accessibilityState.disabled`; meta 5 → `Diminuir meta` desativado
  - SPEC GOL-03 · tela — labels `Aumentar meta`, `Diminuir meta`; valor com label `Meta diária, 30 revisões por dia`
  - SPEC GOL-04 · navegação — meta 20 → `+` no Perfil → aba Início → `0 de 25 revisões`
  - SPEC GOL-05 · tela — meta 23 gravada → mostra `23`; `+` → 25
  - SPEC ERR-01 · tela — repositório lança erro → mensagem de erro e Realm com o valor antigo
- **Done when**: tests above pass; full gate green
- **Gate**: full
- **Status**: [ ] pending

## Execution Waves

- **Wave 1**: T1 ∥ T2
- **Wave 2**: T3
- **Wave 3**: T4
- **Wave 4**: T5
- **Wave 5**: T6
- **Wave 6**: T7 ∥ T8
- **Wave 7**: T9
- **Wave 8**: T10

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Estatísticas, maior sequência, gráfico, estágios | Escopo dividido | `profile-stats` |
| Atualizar números na virada do dia sem trocar de tela | Exigiria timer; HOM-07 cobre o retorno à tela | Nunca, salvo pedido |
| `dueCount` da Início na virada do dia | Comportamento do M2, fora deste spec | Issue futura |

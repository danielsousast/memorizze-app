# STATE

<!-- Section-scoped writes only. Decisions: append. Handoff: replace. Never rewrite the whole file. -->

## Decisions

### AD-001
- **Decision**: Cada feature vive em `src/features/<feature>/` com `interfaces.ts`, `repository.ts` (único acesso ao Realm), `adapters.ts` se houver conversão e `usecases/` com um hook por arquivo; cada hook faz uma única chamada React Query que invoca um único método do repositório; feature com um só caso de uso não tem `usecases/`.
- **Reason**: Camadas previsíveis e testáveis; telas nunca tocam o Realm.
- **Trade-off**: Mais arquivos por feature; operações compostas exigem um método de repositório dedicado.
- **Scope**: `src/features/**` (decks, cards, study, profile)
- **Source**: `.specs/features/deck-card-crud/plan.md`
- **Date**: 2026-10-09
- **Status**: active

### AD-002
- **Decision**: A UI lê e grava via React Query (`@tanstack/react-query`, `networkMode: "always"`, `staleTime: Infinity`); toda escrita passa por um hook de mutação que invalida os prefixos de query afetados.
- **Reason**: Pedido do usuário; cache explícito e objetos simples em vez de `Realm.Object` vivos.
- **Trade-off**: Sem reatividade automática do Realm; uma escrita fora dos hooks deixa o cache velho.
- **Scope**: Todas as features; vale também para a sessão de estudo (M3)
- **Source**: `.specs/features/deck-card-crud/plan.md`
- **Date**: 2026-10-09
- **Status**: active

### AD-003
- **Decision**: Telas vivem em `src/features/<feature>/screens/<nome>-screen.tsx`; as rotas em `src/app/` só leem params e renderizam a tela. UI compartilhada fica em `src/components/`.
- **Reason**: PROJECT-SPEC §9 ("telas + hooks" por feature); AGENTS.md mantém `src/app/` só com rotas e testes fora dele.
- **Trade-off**: Telas que usam duas features importam o barrel público da outra (`@/features/cards`).
- **Scope**: `src/features/**/screens/`, `src/app/**`, `src/components/`
- **Source**: `.specs/features/deck-card-screens/plan.md`
- **Date**: 2026-10-09
- **Status**: active

### AD-004
- **Decision**: A entrada do app usa `Stack.Protected` do Expo Router num `RootStack` (`src/navigation/root-stack.tsx`): a Boas-vindas só existe sem `Profile` e o resto do app só com `Profile`. Abas Início e Perfil vivem no grupo `src/app/(tabs)/` com `Tabs` de `expo-router/js-tabs`; as demais telas ficam no `Stack` raiz, sem barra de abas.
- **Reason**: API oficial do Expo Router 57; o guard limpa o histórico, então voltar não reabre a Boas-vindas, e nenhuma rota precisa repetir a checagem.
- **Trade-off**: Testes de navegação que dependem do guard precisam montar o `RootStack` no helper de teste (`navigator`).
- **Scope**: `src/app/_layout.tsx`, `src/app/(tabs)/`, `src/navigation/`
- **Source**: `.specs/features/profile-onboarding/plan.md`
- **Date**: 2026-10-10
- **Status**: active

### AD-005
- **Decision**: Regras de código: (1) sem ternário aninhado; (2) sem funções criadas inline nas props de componentes; (3) sem lógica de negócio em telas e componentes, que só renderizam e ligam props, e a lógica vai para hooks da feature apoiados em `src/domain/`.
- **Reason**: Pedido do usuário; leitura simples, props estáveis e telas testáveis sem a UI.
- **Trade-off**: Mais arquivos de hook e handlers nomeados; as duas regras mecânicas estão como `error` no lint.
- **Scope**: `src/**/*.tsx`
- **Source**: pedido do usuário, 2026-10-10 (AGENTS.md "Code Rules")
- **Date**: 2026-10-10
- **Status**: active

### AD-006
- **Decision**: Hooks de tela (`use-<tela>.ts`) ficam em `src/features/<feature>/screens/` ao lado da tela; compõem hooks de `usecases/` e funções de `src/domain/`, e a tela só renderiza e liga props.
- **Reason**: `usecases/` obriga uma chamada React Query por hook (ARC-02); um hook de tela compõe vários.
- **Trade-off**: `src/features/architecture.test.ts` não inspeciona esses hooks; a checagem é `src/features/screen-logic.test.ts`.
- **Scope**: `src/features/*/screens/`
- **Source**: `.specs/features/code-rules-refactor/plan.md`
- **Date**: 2026-10-10
- **Status**: active

## Handoff
- **Feature**: code-rules-refactor (MEDIUM) — T1–T8 implementadas e commitadas localmente; verificada por agente independente (PASS); full gate verde (448 testes, lint 0 problemas, tsc); 3 mutações do plano detectadas
- **Where**: feature concluída; nenhuma asserção de teste existente foi alterada
- **Next step**: UAT de profile-stats em dispositivo segue pendente. Push só com go-ahead explícito
- **Open amendments**: none
- **Blockers**: none
- **Updated**: 2026-10-10

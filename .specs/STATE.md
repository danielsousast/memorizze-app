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

## Handoff
- **Feature**: profile-onboarding (HIGH) — 10/10 tasks implementadas e commitadas em `main` (local, sem push). Verificação independente: PASS-WITH-GAPS (`validation.md`); gate completo verde (363 testes, tsc, lint)
- **Where**: falta UAT em development build (Boas-vindas, cartão de streak, Perfil, barra de abas real, voltar no iOS/Android, teclado, claro/escuro vs `design/`). M3 study-session segue com UAT pendente. `profile-stats` (segunda metade do M4) ainda não especificado
- **Next step**: decidir F2 (rotas `study`/`decks/[deckId]` fora do guard do `RootStack`: proteger via amendment ou aceitar); UAT; push só com go-ahead explícito
- **Open amendments**: none (F2 aguarda decisão do usuário)
- **Blockers**: none
- **Updated**: 2026-10-10

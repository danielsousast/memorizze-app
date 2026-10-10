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

## Handoff
- **Feature**: deck-card-screens (HIGH) — telas Início, Baralho, Form de baralho e Editor de cartão; fecha o M2
- **Where**: spec aprovado (com A-01); plan.md em Draft, validado (10 tasks, 4 waves), aguardando aprovação. deck-card-crud completa, commits locais em `main` sem push
- **Next step**: aprovar o plano, depois Execute pela Wave 1 (T1 ∥ T3)
- **Open amendments**: none
- **Blockers**: none
- **Updated**: 2026-10-09

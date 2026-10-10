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
- **Feature**: study-session (HIGH) — M3 implementado em 2026-10-10; sessão de estudo, Nada para revisar e Resumo
- **Where**: verificada (PASS, verificador independente, 51/51 ACs, 7/7 mutantes mortos, 283 testes). Commits locais em `main`, sem push. UAT em dispositivo pendente: deslizar para voltar desativado na sessão (iOS) e visual contra os PNGs 5a/5b/6/8, claro e escuro
- **Next step**: UAT em development build; depois M4 (perfil, streak e meta na Início); push só com go-ahead explícito
- **Open amendments**: none (SUM-03 corrigido para 89% em 2026-10-10)
- **Blockers**: none
- **Updated**: 2026-10-10

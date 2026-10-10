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

## Handoff
- **Feature**: deck-card-crud — T1–T8 e F1–F5 feitas; Verify FAIL no round 3/3 (verificador independente), escalado ao usuário
- **Where**: único gap é HK-03 dos hooks de baralho (`useDeck`, `useUpdateDeck`, `useDeleteDeck` sem teste offline; 3 mutantes `networkMode: "online"` sobreviveram). Ver `validation.md`
- **Next step**: usuário decide sobre F6 (estender o teste HK-03 de baralhos, padrão de F5) + round 4 de verificação
- **Open amendments**: none
- **Blockers**: limite de 3 rounds de fix → re-verify atingido
- **Updated**: 2026-10-09

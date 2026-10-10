# Study Onboarding and Exit — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

O design novo pede uma folha "Como responder" (5c) na primeira sessão de estudo e o app ainda confirma a saída da sessão com `Alert.alert`, que AD-007 aposenta. Sem a folha, quem nunca estudou não sabe o que Errei/Difícil/Bom/Fácil fazem.

## Scope

### In scope

- Folha `Como responder` (5c) na primeira sessão, com flag persistida no `Profile` (migração Realm 2 → 3).
- Sair da sessão (botão fechar e voltar do Android) com `ConfirmDialog` no lugar de `Alert.alert`.

### Out of scope

| Item | Reason |
| --- | --- |
| Rever a folha depois (Ajustes, "Ver tutorial") | Fora do design; F5 decide |
| Restaurar a flag ao sair da conta | F7 apaga o Realm inteiro |
| Conferência visual de 5a/5b/6/8 | Feita no UAT em dispositivo; divergências viram itens de F9 |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | 5c define layout e textos |
| criticality | low | Aviso de ajuda; a sessão funciona sem ele |
| blast_radius | low | `useStudySession` e `Profile` têm poucos chamadores |
| novelty | low | Mesmos padrões de overlay e repositório |
| irreversibility | low | Um booleano |
| integrations | none | Sem rede nem módulo nativo |
| state | low | Flag persistida + estado local da folha e do diálogo |
| auth | none | N/A |
| concurrency | none | Usuário único |
| migrations | low | Propriedade nova com default; `schemaVersion` 3 |
| security | none | N/A |
| data_integrity | low | Perfis existentes ganham `false` pelo default |

**Declared level**: MEDIUM
**Override**: none

## Acceptance Criteria

### P1 — Folha "Como responder"

- **ONB-01** — WHEN uma sessão com pelo menos um cartão abre e `Profile.studyTutorialSeen` é `false` THEN o app SHALL mostrar a folha sobre o primeiro cartão com: rótulo `SUA PRIMEIRA SESSÃO`, título `Como responder`, o texto `Depois de ver a resposta, diga como foi lembrar. O Memorizze usa isso para decidir quando o cartão volta.`, quatro linhas (`Errei` — `Não lembrei. Volta em instantes.`; `Difícil` — `Lembrei com esforço. Volta logo.`; `Bom` — `Lembrei bem. Intervalo normal.`; `Fácil` — `Sabia na hora. Demora mais a voltar.`), a dica `Seja honesto: errar faz parte e ajuda a fixar.` e o botão `Entendi, vamos lá`. Cada rótulo usa as cores do grau correspondente.
- **ONB-02** — WHEN o usuário toca em `Entendi, vamos lá`, no fundo ou no voltar do Android THEN a folha fecha e a sessão segue no mesmo cartão e lado.
- **ONB-08** — WHEN a folha fecha por ONB-02 THEN o app SHALL gravar `Profile.studyTutorialSeen = true`.
- **ONB-03** — IF `studyTutorialSeen` é `true` THEN nenhuma sessão mostra a folha. Sessão vazia (tela 8), baralho inexistente e Resumo nunca a mostram.
- **ONB-04** — O `schemaVersion` do Realm passa a 3; perfis existentes abrem com `studyTutorialSeen = false`.

### P1 — Sair da sessão

- **EXT-01** — WHEN o usuário toca em fechar com a sessão em andamento THEN o app SHALL abrir o `ConfirmDialog` neutro com ícone `sign-out`, título `Sair da sessão?`, mensagem `Seu progresso já foi salvo.`, botões `Sair` e `Continuar`. Substitui EXT-01 de `study-session`.
- **EXT-02** — `Sair` fecha o diálogo e volta à tela de origem sem Resumo; as respostas já dadas continuam gravadas. `Continuar` fecha o diálogo e mantém o cartão e o lado visíveis.
- **EXT-03** — O botão voltar do Android abre o mesmo diálogo, só enquanto há cartão em estudo; o listener sai ao desmontar e no Resumo.

## Failure & Edge Behavior

- **ONB-05** — IF gravar a flag falha THEN a folha SHALL fechar mesmo assim e a sessão continua; a flag fica `false` e a folha volta na próxima sessão. Sem mensagem de erro.
- **ONB-06** — WHILE a folha está aberta o voltar do Android a fecha (ONB-02) e não abre o diálogo de saída; fechar a sessão só é possível depois.
- **EXT-04** — WHILE o diálogo de saída está aberto o cartão não pode ser virado nem respondido (o `Modal` bloqueia o toque).

Other dimensions: input bounds N/A; idempotency coberta por ONB-02 (gravar `true` duas vezes é inofensivo); auth N/A porque perfil local; concurrency N/A porque usuário único; observability N/A porque app offline sem telemetria; data lifecycle coberto por ONB-04.

### Acessibilidade

- **ONB-07** — O botão `Entendi, vamos lá` tem `accessibilityRole="button"`, label igual ao texto e altura ≥ 44 pt; o título da folha tem `accessibilityRole="header"`.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Quem já usa o app vê a folha uma vez | Sim | Default `false` no schema; custo mínimo | no |
| Fechar pelo fundo conta como visto | Sim | Evita reaparecer sem o usuário ter lido | no |
| Ícone do diálogo de saída | `sign-out` (já existe) | Design 7b usa o mesmo para sair | no |
| Local da flag | `Profile` | Pedido no Handoff; F7 apaga junto | no |

**Open questions**: none

## Amendments

### A-01 — Alerta de saída vira ConfirmDialog
- **Type**: behavior-change
- **Discovered in**: Specify
- **Change**: `study-session` EXT-01..03 passam a valer como EXT-01..03 desta spec (diálogo no lugar de `Alert.alert`, botões `Sair` e `Continuar`).
- **Reason**: AD-007.
- **Affected**: EXT-01, EXT-02, EXT-03 de `study-session`; `study-exit.test.tsx` migra
- **Risk impact**: none
- **Status**: approved

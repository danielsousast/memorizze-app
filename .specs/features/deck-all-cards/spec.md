# Deck All Cards — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

O design novo separa a lista de cartões em duas telas: o Baralho (3) mostra só os 5 primeiros com "Ver todos", e "Todos os cartões" (3b) traz a lista completa com busca. Hoje o Baralho lista tudo e tem a busca; com 1.000 cartões a tela fica longa e destoa do design. A exclusão de cartão no Editor ainda usa `Alert.alert`, que AD-007 aposenta.

## Scope

### In scope

- Nova rota `decks/[deckId]/cards` com a tela "Todos os cartões" (3b): voltar, botão `+`, título, subtítulo, busca, lista completa.
- Baralho mostra só os 5 cartões mais recentes e o link "Ver todos" quando há mais de 5; a busca sai do Baralho.
- Excluir cartão no Editor passa a usar `ConfirmDialog` (AD-007).

### Out of scope

| Item | Reason |
| --- | --- |
| Menu `⋯`, excluir baralho, toast | F2 `deck-menu-and-delete`, bloqueada por decisões pendentes |
| Lista agrupada num cartão com divisores (design) | Mantém o `CardRow` atual; ajuste visual fica para F9 |
| Ordenação ou filtro por estágio | Fora do design |
| Toast "Cartão excluído" | Depende da decisão do "Desfazer" (F2) |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | 3b e 3 definem layout e textos; a busca já existe |
| criticality | low | Exclusão de cartão já existe e continua confirmada |
| blast_radius | low | `useDeckScreen` e `useEditCardForm` têm 1 chamador cada |
| novelty | low | Mesmos padrões de tela, hook e rota |
| irreversibility | low | Só a troca de `Alert` por `ConfirmDialog` toca a exclusão |
| integrations | none | Sem rede nem módulo nativo |
| state | low | Texto da busca em `useState`, sem persistência |
| auth | none | N/A |
| concurrency | none | Usuário único |
| migrations | none | Sem schema |
| security | none | N/A |
| data_integrity | none | Sem escrita nova |

**Declared level**: MEDIUM
**Override**: none

## Acceptance Criteria

### P1 — Prévia no Baralho

- **ALL-01** — O Baralho lista no máximo os 5 cartões mais recentes, na ordem mais recente primeiro, abaixo do título `Cartões`.
- **ALL-02** — WHERE o baralho tem mais de 5 cartões o título `Cartões` tem o botão `Ver todos` (com seta) à direita; com 5 ou menos o botão não aparece.
- **ALL-03** — WHEN o usuário toca em `Ver todos` THEN o app SHALL abrir `/decks/<id>/cards`.
- **ALL-04** — O Baralho não mostra campo de busca.

### P1 — Tela Todos os cartões

- **ALL-05** — A tela mostra o link `Baralho` (volta ao Baralho), o botão `Adicionar cartão` (ícone `+`, abre o Editor em modo criar), o título `Todos os cartões`, o subtítulo `<nome> · <N cartões>` e o campo de busca com placeholder `Buscar na frente ou no verso`.
- **ALL-06** — A lista tem todos os cartões do baralho, mais recentes primeiro, com as linhas de `CardRow` (frente, verso, estágio); tocar numa linha abre o Editor em modo edição.
- **ALL-07** — A busca filtra por frente ou verso, sem diferenciar maiúsculas nem acentos (regra de `matches`); texto vazio ou só espaços mostra tudo.
- **ALL-08** — IF a busca não acha nada THEN a tela SHALL mostrar `Nenhum cartão encontrado`; IF o baralho não tem cartões THEN `Nenhum cartão ainda` e nenhum campo de busca.
- **ALL-09** — IF o id do baralho não existe THEN a tela SHALL mostrar `Baralho não encontrado` com o botão `Voltar ao início`.
- **ALL-10** — Um baralho com 1.000 cartões renderiza menos de 100 linhas de uma vez (`FlatList`).

### P1 — Excluir cartão com diálogo

- **ALL-11** — WHEN o usuário toca em `Excluir cartão` no Editor THEN o app SHALL abrir o `ConfirmDialog` destrutivo com título `Excluir cartão?`, mensagem `Esta ação não pode ser desfeita.`, ícone `trash`, botões `Excluir` e `Cancelar`.
- **ALL-12** — WHEN o usuário confirma THEN o cartão é excluído e o Editor fecha; WHEN cancela THEN o diálogo fecha e o cartão fica intacto.

## Failure & Edge Behavior

- **ALL-13** — IF a exclusão falha THEN o Editor SHALL fechar o diálogo, manter o cartão e mostrar `Não foi possível excluir. Tente de novo.` (comportamento atual de EDT-05/ERR-01).
- **ALL-14** — WHILE a exclusão está pendente o diálogo não pode ser reaberto e `Salvar` e `Excluir cartão` ficam desabilitados (EDT-08).

Other dimensions: input bounds N/A because a busca só filtra em memória; idempotency coberta por ALL-14; auth N/A because perfil local; concurrency N/A because usuário único; observability N/A because app offline sem telemetria; data lifecycle coberto por ALL-11/12 com confirmação.

### Acessibilidade

- **ALL-15** — Todo botão novo (`Ver todos`, `Baralho`, `Adicionar cartão`) tem `accessibilityRole="button"`, `accessibilityLabel` e área de toque de pelo menos 44 pt; a busca tem o label `Buscar cartões`.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Limite da prévia | 5 cartões | Design 3 mostra 5 linhas e "Ver todos" | no |
| Busca sai do Baralho | Só na tela 3b | O design 3 não tem busca; evita duas buscas | no |
| Mensagem do diálogo | `Esta ação não pode ser desfeita.` | Texto do 3d adaptado para cartão | no |
| Voltar da tela 3b | `router.dismissTo` para o Baralho | Evita empilhar Baralho duplicado | no |
| Vazio no Baralho | Mantém `Nenhum cartão ainda` e esconde `Ver todos` | Sem cartões não há o que listar | no |

**Open questions**: none

## Amendments

### A-01 — Busca e lista completa saem do Baralho
- **Type**: behavior-change
- **Discovered in**: Specify
- **Change**: a spec `deck-card-screens` DECK-03 (lista completa), DECK-04 e DECK-05 (busca) passam a valer na tela Todos os cartões (ALL-06 a ALL-08); no Baralho valem ALL-01 e ALL-04. DECK-06 vale nas duas telas (ALL-08). DECK-10 não muda. EDT-05 troca `Alert` por `ConfirmDialog` (ALL-11, ALL-12).
- **Reason**: o design 3 limita a prévia a 5 cartões e move a busca para 3b.
- **Affected**: DECK-03, DECK-04, DECK-05, EDT-05 (modified); testes DECK-03/04/05 e EDT-05 migram
- **Risk impact**: none
- **Status**: approved

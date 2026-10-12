# Sign Out and Wipe — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

O app não tem conta. Quem quer recomeçar ou entregar o aparelho não tem como apagar baralhos, cartões e histórico. O design 7/7b pede o botão Sair no Perfil com confirmação.

## Scope

### In scope

- Botão `Sair` e nota no fim do Perfil; `ConfirmDialog` destrutivo (7b) com contagens reais.
- Apagar todo o Realm numa transação e voltar à Boas-vindas (AD-004).

### Out of scope

| Item | Reason |
| --- | --- |
| ~~Linha "Fazer backup antes" do diálogo~~ | Entrou pela emenda A-01 (F6 pronta) |
| ~~Apagar preferências e tema~~ | Entrou pela emenda A-03: o apagamento remove o perfil e as preferências, e o tema volta ao do sistema (THM-05) |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | Design 7b define textos e botões |
| criticality | medium | Perde todos os dados do usuário |
| blast_radius | low | Um método de repositório, um hook, uma tela |
| novelty | low | Mesmos padrões de overlay e repositório |
| irreversibility | high | `deleteAll` não tem desfazer |
| integrations | none | Sem rede nem módulo nativo |
| state | low | Estado local do diálogo |
| auth | none | Perfil local, sem conta |
| concurrency | none | Usuário único |
| migrations | none | Sem mudança de schema |
| security | low | Apaga dados locais; sem segredo |
| data_integrity | medium | Tudo ou nada numa transação |

**Declared level**: HIGH
**Override**: a irreversibilidade é a própria função pedida, só atinge dados locais do próprio dono e passa por confirmação explícita com contagens; o app não tem conta nem dado remoto, então o dano fica limitado ao aparelho e à escolha deliberada do usuário.

## Acceptance Criteria

### P1 — Sair

- **SOUT-01** — WHEN o usuário toca em `Sair` no Perfil THEN o app SHALL abrir o `ConfirmDialog` destrutivo, ícone `sign-out`, título `Sair e apagar dados?`, botões `Apagar e sair` e `Cancelar`.
- **SOUT-02** — A mensagem SHALL ser `Sair apaga seus N baralhos, M cartões e todo o histórico deste aparelho.` com as contagens reais (singular quando 1).
- **SOUT-03** — WHEN o usuário confirma THEN o app SHALL apagar Profile, Deck, Card e ReviewLog e mostrar a Boas-vindas.
- **SOUT-06** *(A-01, A-02)* — O diálogo SHALL mostrar, entre a mensagem e os botões, um link discreto `Fazer backup antes`, sem legenda (design 7b mostrava um cartão com a data do último backup).
- **SOUT-07** *(A-01)* — WHEN o usuário toca em `Fazer backup antes` THEN o app SHALL fechar o diálogo, exportar o backup como em BKP-01/BKP-04 e, ao terminar, reabrir o diálogo com a legenda atualizada; nada é apagado.
- **SOUT-05** — WHEN o usuário cancela THEN nada é apagado e o Perfil continua aberto.

## Failure & Edge Behavior

- **SOUT-04** — IF apagar falha THEN nada é apagado (transação única), o diálogo fecha e um toast mostra `Não foi possível apagar os dados.`

- **SOUT-08** *(A-01)* — IF o export falha THEN o diálogo continua fechado, um toast mostra `Não foi possível exportar.` e nada é apagado.

Other dimensions: input bounds N/A; idempotency N/A porque apagar o vazio é inofensivo; auth N/A porque perfil local; concurrency N/A porque usuário único; observability N/A porque app offline.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Backup antes de sair | Fora até a F6 | Sem F6 não há o que oferecer | yes |
| Texto do toast de erro | `Não foi possível apagar os dados.` | Proposto no chat | yes |

**Open questions**: none

## Amendments

### A-01 — Linha "Fazer backup antes" no diálogo do Sair
- **Type**: scope-change
- **Discovered in**: resume F7 (reservada em BKP "Out of scope" de backup-restore)
- **Change**: SOUT-06, SOUT-07 e SOUT-08 entram; a linha sai de Out of scope.
- **Reason**: pedido do usuário ("resume F7"); F6 entregou o export; o design 7b já mostra a linha. O diálogo fecha durante o export porque `Modal` cobre a folha de compartilhamento e o toast (AD-007), e reabre ao terminar para o usuário confirmar com a legenda nova.
- **Affected**: SOUT-06..08 (new)
- **Risk impact**: none (HIGH mantido; só reaproveita export já verificado)
- **Status**: approved

### A-02 — Link discreto, sem legenda
- **Type**: behavior-change
- **Discovered in**: UAT do usuário
- **Change**: SOUT-06 vira um link sem fundo e sem a legenda do último backup.
- **Reason**: pedido do usuário: o botão não precisa da legenda e pesava no diálogo.
- **Affected**: SOUT-06 (modified)
- **Risk impact**: none
- **Status**: approved

### A-03 — Preferências e tema entram no apagamento
- **Type**: clarification
- **Discovered in**: verificação independente (gap 2)
- **Change**: "Apagar preferências e tema" sai de Out of scope. Hoje o `deleteAll` apaga o `Profile` com as preferências e o tema volta ao do sistema (THM-05, `src/navigation/root-stack.test.tsx:170`).
- **Reason**: a F5 entregou as preferências; a spec ficou atrás do comportamento já testado.
- **Affected**: Out of scope (modified); nenhum AC novo
- **Risk impact**: none
- **Status**: approved

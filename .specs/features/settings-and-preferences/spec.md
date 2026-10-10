# Settings and Preferences — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

A engrenagem do Perfil não leva a lugar nenhum. O usuário não escolhe o tema (o app só segue o sistema) e não limita quantos cartões novos entram por dia (RF4 hoje despeja todos os vencidos, incluindo centenas de novos). O design 9 pede a tela Ajustes.

## Scope

### In scope

- Rota `/settings` (design 9) aberta pela engrenagem do Perfil, com voltar para o Perfil.
- Preferência de tema: Automático, Claro, Escuro, persistida e aplicada ao app inteiro.
- Preferência "Cartões novos por dia" que limita a fila de estudo (RF4).
- Linha de versão do app ("Memorizze 1.0.0").
- Novos componentes compartilhados `SegmentedControl` e `SettingsRow`.
- Preferências guardadas no `Profile` (migração Realm 3→4); o Sair já as apaga e volta o tema ao do sistema.

### Out of scope

| Item | Reason |
| --- | --- |
| Lembrete diário, horário, `Switch` | Feature própria `daily-reminder` (permissão, módulo nativo, agendamento) |
| Cartão "Backup e restauração" e nota "Tudo fica só neste aparelho" | Feature F6 `backup-restore`; a linha só aparece com a F6 |
| Contagem "vencem hoje" do Início/Baralho respeitar o limite | Mantém o total de vencidos; ver Assumptions |
| Idioma | Decisão aberta do PROJECT-SPEC §13 |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | medium | Regra de "novo" e de orçamento diário precisa de definição (NEW-01..06) |
| criticality | medium | A fila de estudo é o núcleo do app; erro esconde cartões |
| blast_radius | high | `useTheme` é usado em todas as telas; `queue` serve Início, Baralho e Estudo |
| novelty | medium | Primeiro override de tema e primeiro uso de `Appearance` |
| irreversibility | low | Preferências são reversíveis; migração só adiciona campos |
| integrations | none | Sem rede nem módulo nativo novo |
| state | medium | Preferência persistida e refletida em tempo real em toda a UI |
| auth | none | Perfil local |
| concurrency | none | Usuário único |
| migrations | high | Realm 3→4 com campos novos em dados existentes |
| security | none | Sem segredo |
| data_integrity | medium | Orçamento diário deriva de `ReviewLog`; contagem errada some ou repete cartões |

**Declared level**: HIGH

## Acceptance Criteria

### P1 — Tela Ajustes

- **SET-01** — WHEN o usuário toca na engrenagem do Perfil THEN o app SHALL abrir `/settings` com título `Ajustes`, link `‹ Perfil` que volta, seções `APARÊNCIA` e `ESTUDO` como no design 9, claro e escuro.
- **SET-02** — A tela SHALL mostrar no rodapé `Memorizze <versão do app.json>`.
- **SET-03** — `/settings` SHALL existir só com perfil criado (AD-004).

### P1 — Tema

- **THM-01** — O `SegmentedControl` SHALL oferecer `Automático`, `Claro`, `Escuro` (ícones sol e lua nos dois últimos), com a opção atual selecionada; o padrão é `Automático`.
- **THM-02** — WHEN o usuário escolhe uma opção THEN todo o app SHALL passar ao tema escolhido na hora e persistir a escolha.
- **THM-03** — Com `Automático`, o app SHALL seguir o tema do sistema, inclusive quando ele muda em execução. A nota `Automático acompanha o tema do sistema.` aparece sob o controle.
- **THM-04** — Ao reabrir o app, o tema SHALL ser o salvo, sem trocar de cor depois do primeiro desenho com perfil carregado.
- **THM-05** — WHEN o usuário usa Sair THEN o tema SHALL voltar a seguir o sistema e a preferência some junto com o perfil.

### P1 — Novos por dia

- **NEW-01** — A linha `Cartões novos por dia` SHALL mostrar o valor atual e, ao toque, abrir uma `BottomSheet` com as opções `5`, `10`, `20`, `30`, `50` e `Sem limite`; escolher uma salva e fecha a folha.
- **NEW-02** — Cartão novo é o de `repetitions = 0`. A fila (todos os baralhos ou um baralho) SHALL conter todos os vencidos não novos mais, no máximo, `limite − já introduzidos hoje` cartões novos, na ordem atual (`dueDate`, `createdAt`).
- **NEW-03** — "Introduzido hoje" é o cartão cujo primeiro `ReviewLog` de todos os tempos cai no dia local atual. O orçamento é único por dia, somando todos os baralhos.
- **NEW-04** — Cartão introduzido hoje que ainda está com `repetitions = 0` (errou) SHALL continuar na fila sem gastar orçamento de novo.
- **NEW-05** — `Sem limite` SHALL reproduzir o comportamento atual (todos os vencidos).
- **NEW-06** — Mudar o limite SHALL valer na próxima fila aberta; sessão em andamento não muda.
- **NEW-07** — O padrão é `10` para perfis novos e para perfis migrados.

## Failure & Edge Behavior

- **SET-04** — IF gravar a preferência falha THEN a seleção SHALL voltar ao valor anterior e um toast mostra `Não foi possível salvar.`
- **NEW-08** — Orçamento esgotado e só há novos vencidos: Estudar mostra o estado vazio `Nada para revisar hoje` (design 8).
- **NEW-09** — Cartão com `Redefinir progresso` volta a `repetitions = 0` mas já tem log antigo; ele entra como novo na fila e não gasta orçamento (NEW-03).
- **MIG-01** — A migração 3→4 SHALL manter nome, meta, baralhos, cartões e logs, e preencher tema `Automático` e limite `10`.

Other dimensions: input bounds N/A porque as opções são fixas; idempotency N/A porque escolher a mesma opção não muda nada; auth N/A porque perfil local; concurrency N/A porque usuário único; observability N/A porque app offline.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Lembrete separado em `daily-reminder` | Sim; Ajustes mostra só `Tema` e `Cartões novos por dia` até lá | Isola permissão e agendamento nativo; uma migração a menos de risco aqui | no |
| Padrão `10` também para quem já tem dados | `10` (valor do design 9) | Um padrão só; reduz fila de quem tem muitos novos | no |
| Opções de novos por dia | 5, 10, 20, 30, 50, Sem limite | Sem picker numérico; folha já existe | no |
| Contagem "vencem hoje" | Inalterada (total de vencidos, inclui novos acima do limite) | Mudar mexe em Início e Baralho; fora do pedido | no |
| Onde guardar | Campos novos no `Profile` | O wipe já apaga tudo; sem segundo armazenamento | no |

**Open questions**: none

## Amendments

none

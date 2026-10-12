# Daily Reminder — Spec

**Status**: Approved
**Date**: 2026-10-11

## Problem

O design 9 mostra `Lembrete diário` e `Horário` em Ajustes, mas a tela só tem Tema, Novos por dia e Backup. Sem lembrete, quem usa repetição espaçada esquece de estudar e perde o streak. O escopo do MVP já prevê uma notificação local agendada no aparelho (PROJECT-SPEC §2).

## Scope

### In scope

- Linha `Lembrete diário` com `Switch` e subtítulo `Notificação local, funciona offline`, e linha `Horário` com valor `HH:00` (design 9), na seção `ESTUDO` acima de `Cartões novos por dia`.
- Notificação local diária no horário escolhido, via `expo-notifications` (dependência e config plugin novos).
- Pedido de permissão do sistema ao ligar o Switch.
- Preferência guardada no `Profile` (migração Realm 5→6).
- Reagendar ou cancelar quando o usuário muda a preferência, usa Sair ou restaura um backup.

### Out of scope

| Item | Reason |
| --- | --- |
| Notificação push remota | Fora do MVP (PROJECT-SPEC §2) |
| Minutos livres no horário | Decisão do usuário: horas cheias |
| Suprimir o lembrete se o usuário já estudou hoje | O gatilho diário é fixo; exigiria reagendar a cada sessão |
| Contagem de cartões vencidos no texto | Texto estático; o gatilho não calcula conteúdo |
| Reagendar após reinício do aparelho por código próprio | O SO mantém o agendamento local; ver REM-11 |
| Reminder dentro do arquivo de backup | Permissão e agendamento são do aparelho |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | medium | Horário, padrão e permissão negada decididos; texto e canal definidos aqui |
| criticality | low | Falha perde um lembrete, nunca dados de estudo |
| blast_radius | medium | Toca Ajustes, Sair, restauração de backup e `app.json` |
| novelty | high | Primeiro uso de `expo-notifications` e de permissão do sistema |
| irreversibility | low | Notificação cancelável; preferência reversível |
| integrations | high | API de notificações do SO (iOS e Android) |
| state | medium | Estado duplicado: preferência no Realm e agendamento no SO; precisam concordar |
| auth | none | Perfil local |
| concurrency | low | Toques rápidos no Switch ou no horário podem sobrepor agendamentos |
| migrations | high | Realm 5→6 com campos novos em dados existentes |
| security | none | Sem segredo; permissão de notificação é do sistema |
| data_integrity | low | Campos novos só adicionam; backup não muda |

**Declared level**: HIGH
**Override**: o cálculo dá CRITICAL por novelty, integrations e migrations altos, mas o pior caso é perder um lembrete: sem dinheiro, auth, dado irreversível nem sistema de registro. A migração 5→6 só adiciona dois campos (padrão do 3→4) e a integração é uma API local do SO, cancelável. Falha injetada e concorrência (REM-17, REM-19) entram nos testes mesmo assim.

## Acceptance Criteria

### P1 — Linhas em Ajustes

- **REM-01** — Ajustes SHALL mostrar na seção `ESTUDO`, nesta ordem, `Lembrete diário` (subtítulo `Notificação local, funciona offline`, com `Switch`), `Horário` (valor `HH:00`, seta) e `Cartões novos por dia`, claro e escuro, como no design 9.
- **REM-02** — O padrão é lembrete desligado e horário `19:00`, para perfis novos e migrados.
- **REM-03** — Com o lembrete desligado, a linha `Horário` SHALL ficar visível e desativada (sem abrir a folha, com estado `disabled` para leitores de tela).

### P1 — Ligar e desligar

- **REM-04** — WHEN o usuário liga o `Switch` e a permissão ainda não foi decidida THEN o app SHALL pedir a permissão de notificação do sistema.
- **REM-05** — WHEN a permissão está concedida e o usuário liga o `Switch` THEN o app SHALL agendar a notificação diária no horário atual e salvar `ligado`.
- **REM-06** — WHEN o usuário desliga o `Switch` THEN o app SHALL cancelar a notificação agendada e salvar `desligado`.
- **REM-07** — A notificação SHALL ter título `Hora de revisar` e corpo `Seus cartões estão esperando. Leva só alguns minutos.`, disparar todo dia no horário escolhido, em horário local, e funcionar offline.
- **REM-08** — Com o app aberto no horário, a notificação SHALL aparecer como banner (sem som nem selo).

### P1 — Horário

- **REM-09** — WHEN o usuário toca em `Horário` (com o lembrete ligado) THEN o app SHALL abrir uma `BottomSheet` com as horas cheias `06:00` a `22:00`, a atual marcada; escolher uma salva, reagenda a notificação para o novo horário e fecha a folha.
- **REM-10** — Existe no máximo uma notificação do lembrete agendada. Mudar o horário ou religar SHALL substituir a anterior, nunca somar.

### P2 — Ciclo de vida

- **REM-11** — WHEN o app abre com perfil e o lembrete está ligado e permitido THEN o app SHALL garantir que a notificação diária esteja agendada no horário salvo (reagenda se o SO a perdeu).
- **REM-12** — WHEN o app abre com o lembrete ligado e a permissão foi revogada nos Ajustes do sistema THEN o app SHALL salvar `desligado` sem avisar.
- **REM-13** — WHEN o usuário usa Sair THEN o app SHALL cancelar a notificação agendada junto com a limpeza dos dados.
- **REM-14** — WHEN o usuário restaura um backup THEN o lembrete SHALL ficar desligado e a notificação cancelada (o arquivo de backup não guarda o lembrete).

## Failure & Edge Behavior

- **REM-15** — IF o usuário nega a permissão THEN o `Switch` SHALL ficar desligado, nada é agendado nem salvo como ligado, e um toast mostra `Ative as notificações nas configurações do aparelho.` com a ação `Abrir ajustes` que abre os Ajustes do sistema para o app.
- **REM-16** — IF o sistema já negou de forma definitiva (não pergunta de novo) THEN ligar o `Switch` SHALL cair em REM-15 sem exibir pedido.
- **REM-17** — IF agendar, cancelar ou gravar a preferência falha THEN o `Switch` e o horário SHALL voltar ao valor anterior e um toast mostra `Não foi possível salvar.`
- **REM-18** — Após qualquer falha de REM-17, a notificação agendada SHALL concordar com a preferência salva.
- **REM-19** — WHILE uma alteração do lembrete está em andamento o `Switch` e o `Horário` SHALL ignorar novos toques, para não sobrepor agendamentos.
- **REM-20** — No Android 8+, a notificação SHALL usar um canal próprio `Lembrete diário` criado antes do pedido de permissão (necessário no Android 13+).
- **MIG-01** — A migração 5→6 SHALL manter nome, meta, baralhos, cartões, logs e preferências, e preencher lembrete desligado e horário 19.

Other dimensions: input bounds N/A porque as horas são fixas (6 a 22); idempotency coberto por REM-10; auth N/A porque perfil local; concurrency coberto por REM-19; observability N/A porque app offline; fuso e horário de verão: o gatilho `DAILY` do SO usa a hora local do aparelho, sem lógica própria.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Horário por folha de horas cheias | 06:00 a 22:00 | Padrão de Novos por dia; sem dependência nativa extra | yes |
| Padrão desligado, 19:00 | Desligado | Permissão só no momento em que o usuário pede | yes |
| Permissão negada | Switch desligado + toast com `Abrir ajustes` | Caminho de recuperação claro | yes |
| Texto da notificação | `Hora de revisar` / `Seus cartões estão esperando. Leva só alguns minutos.` | Estático e curto; gatilho não calcula contagem | no |
| Backup não leva o lembrete | Restaurar desliga o lembrete | Permissão e agendamento pertencem ao aparelho; formato do backup não muda | no |
| Revogação nos Ajustes do sistema | Detectada ao abrir o app (REM-11), desliga em silêncio | Evita Switch ligado sem efeito | no |
| Toque na notificação | Só abre o app, sem rota própria | Fora do pedido; abre na tela atual | no |

**Open questions**: none

## Amendments

none

# Perfil e entrada — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

O app abre direto na Início e nunca cria o `Profile`: não há nome, meta diária nem abas. A Início não mostra streak nem progresso da meta. Esta feature entrega a primeira metade do M4: RF1 completo e a parte de RF5/RF6 que a Início usa (revisões hoje vs. meta, streak atual). Decisões e motivos: [context.md](context.md).

## Scope

### In scope

- Tela Boas-vindas (PNG 1) e criação do perfil.
- Desvio de entrada: sem perfil → Boas-vindas; com perfil → Início.
- Barra de abas Início | Perfil.
- Início: `Olá, {nome}` e cartão de streak + meta diária + `Estudar tudo` (PNGs 2 e 2b).
- Aba Perfil: cabeçalho (avatar, nome, `Estudando desde`), edição do nome, meta diária com stepper e `Revisões hoje` (topo do PNG 7).
- Contagem de revisões do dia local (domínio).

### Out of scope

| Item | Reason |
| --- | --- |
| Maior sequência, % de acerto 7/30 dias, gráfico de 7 dias, cartões por estágio | Feature `profile-stats` |
| Nome no Resumo da sessão | Não pedido no RF1 |
| Excluir ou reiniciar o perfil | Fora do PROJECT-SPEC |
| Vários perfis | PROJECT-SPEC §2 |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | medium | Edição do nome, limites da meta e variações do cartão não estão no design; resolvido em context.md |
| criticality | high | Boas-vindas e o desvio de entrada são o onboarding e a rota raiz; um erro tranca o usuário fora |
| blast_radius | medium | Reestrutura `src/app/_layout.tsx` com abas; 21 chamadas de navegação e 8 arquivos de teste montam a rota `index` |
| novelty | medium | Primeiras abas, primeiro redirect e primeiro uso do `Profile` |
| irreversibility | low | Dados locais; revert do commit basta |
| integrations | none | Sem rede |
| state | medium | Primeira criação e edição do registro único `Profile` |
| auth | none | Perfil local, sem login |
| concurrency | low | Toque duplo em `Começar` pode criar dois perfis; coberto por WEL-06 e INV-01 |
| migrations | none | Schema `Profile` já existe com todos os campos |
| security | low | Nome digitado só é exibido como `Text` |
| data_integrity | low | Streak e revisões hoje são derivados de `ReviewLog` |

**Declared level**: HIGH

## Acceptance Criteria

### P1 — Entrada e Boas-vindas

- **ENT-01** — WHEN o app abre sem `Profile` THEN o app SHALL mostrar a Boas-vindas.
- **ENT-02** — WHEN o app abre com `Profile` THEN o app SHALL mostrar a Início.
- **ENT-03** — WHILE o perfil não foi lido, o app não mostra nem a Boas-vindas nem a Início.
- **WEL-01** — A Boas-vindas mostra a marca `Memorizze`, o título `Lembre mais, estudando menos.`, o texto `Flashcards com repetição espaçada. Poucos minutos por dia, no seu ritmo.`, os selos `100% offline`, `Sem login`, `Dados só no aparelho`, o campo `Como podemos te chamar?` (placeholder `Seu nome ou apelido`) e o botão `Começar`. A ilustração do cartão é decorativa e não é lida pelo leitor de tela.
- **WEL-02** — WHEN o usuário toca `Começar` com um nome válido THEN o app SHALL criar o `Profile` com o nome sem espaços nas pontas, `dailyGoal = 20`, `createdAt = agora` e substituir a Boas-vindas pela Início; voltar não reabre a Boas-vindas.
- **WEL-03** — IF o nome, sem espaços nas pontas, está vazio THEN o app SHALL mostrar `Digite seu nome.` no campo e não criar o perfil.
- **WEL-04** — O campo aceita no máximo 30 caracteres. IF um nome com mais de 30 caracteres chega ao repositório THEN ele SHALL recusar com `Use no máximo 30 caracteres.` e não gravar.
- **WEL-05** — Com perfil existente, a rota da Boas-vindas não é alcançável por nenhum botão do app.

### P1 — Abas

- **TAB-01** — Início e Perfil mostram a barra de abas `Início` e `Perfil`; a aba atual fica destacada e tem estado `selected` para acessibilidade.
- **TAB-02** — Baralho, sessão de estudo, Resumo e os modais abrem sem a barra de abas.

### P1 — Início

- **HOM-01** — O cabeçalho mostra a data longa (como hoje) e `Olá, {nome}`.
- **HOM-02** — Abaixo do cabeçalho, com ou sem baralhos, aparece o cartão de streak com `N dias seguidos` (`1 dia seguido`), N = streak atual (STK-02 do M3).
- **HOM-03** — Subtítulo do cartão:

  | Streak | Revisou hoje? | Subtítulo | Ícone |
  | --- | --- | --- | --- |
  | 0 | não | `Sua sequência começa no primeiro estudo` | neutro |
  | N ≥ 1 | não | `Estude hoje para chegar a N+1` | destaque |
  | N ≥ 1 | sim | `Você já estudou hoje` | destaque |

- **HOM-04** — O cartão mostra `Meta diária` e `M de G revisões`, M = revisões de hoje (REV-01) e G = `dailyGoal`, com a barra preenchida em `min(M, G) / G`.
- **HOM-05** — Com M ≥ G, a barra fica cheia e o texto continua `M de G revisões` (ex.: `34 de 30 revisões`).
- **HOM-06** — Com baralhos, `Estudar tudo` (com o selo de cartões vencidos, como ENT-02 do M3) fica dentro do cartão, abaixo da barra. Sem baralhos, o cartão não tem o botão e o estado vazio do M2 continua abaixo dele.
- **HOM-07** — WHEN a Início volta a ficar visível (fim de sessão, troca de aba, volta do Baralho) THEN streak, M e o subtítulo SHALL refletir as revisões gravadas e o dia local corrente.

### P1 — Revisões hoje (domínio)

- **REV-01** — Revisões de hoje = número de `ReviewLog` com `reviewedAt` no dia local de `now`, de qualquer nota (Errei conta).
- **REV-02** — Exemplos (hoje = 10/10): revisões às 09/10 23:59, 10/10 00:00 e 10/10 23:59 → 2; nenhuma → 0; 3 revisões do mesmo cartão hoje → 3.

### P1 — Perfil

- **PRF-01** — A aba mostra o título `Perfil`, um avatar com a primeira letra do nome em maiúscula, o nome e `Estudando desde {mês} de {ano}` a partir de `createdAt` (ex.: `Estudando desde março de 2026`).
- **PRF-02** — O cartão `Meta diária` mostra `revisões por dia`, o stepper com o valor atual, `Revisões hoje` e `M de G` com a mesma barra de HOM-04.
- **PRF-03** — O cabeçalho é um botão com label `Editar nome, {nome}`.
- **PRF-04** — WHEN o usuário toca o cabeçalho THEN o app SHALL abrir o modal `Editar nome` com o campo preenchido e o botão `Salvar`.
- **PRF-05** — WHEN o usuário salva um nome válido THEN o app SHALL gravar o nome sem espaços nas pontas, fechar o modal e mostrar o novo nome no Perfil e em `Olá, {nome}` na Início. Validação e mensagens iguais a WEL-03 e WEL-04.

### P1 — Meta diária

- **GOL-01** — WHEN o usuário toca `+` THEN `dailyGoal` SHALL subir 5 e ser gravado na hora; `−` desce 5.
- **GOL-02** — `dailyGoal` fica entre 5 e 200. Em 200, `+` fica desativado; em 5, `−` fica desativado.
- **GOL-03** — Os botões têm labels `Aumentar meta` e `Diminuir meta`; o valor é lido como `Meta diária, G revisões por dia`.
- **GOL-04** — Depois de mudar a meta, a Início mostra o novo G sem reabrir o app.

### P2 — Tema e acessibilidade

- **THM-01** — As telas usam os tokens de `src/theme` e seguem os PNGs 1, 2, 2b e 7 (topo) claros e escuros.
- **A11Y-01** — Todo tocável novo tem role, label e alvo ≥ 44pt.

## Failure & Edge Behavior

- **ERR-01** — IF a gravação do perfil (criar, nome ou meta) falha THEN o app SHALL mostrar `Não foi possível salvar. Tente de novo.`, manter a tela e o valor anterior gravado.
- **WEL-06** — WHILE a criação do perfil está em andamento, `Começar` ignora toques; dois toques seguidos criam um só `Profile`.
- **GOL-05** — IF o `dailyGoal` gravado está fora de 5..200 ou não é múltiplo de 5 (dado anterior a esta feature) THEN o app SHALL mostrar o valor como está.
- **GOL-06** — Com um `dailyGoal` assim, `+` e `−` levam ao múltiplo de 5 seguinte e anterior, limitado a 5..200. Exemplos: 23 → `+` 25, `−` 20; 3 → `+` 5; 250 → `−` 200.
- **PRF-06** — IF existe mais de um `Profile` (dado anterior a esta feature) THEN o app SHALL usar o de `createdAt` mais antigo.

Other dimensions: auth N/A because perfil local sem login; external-dependency failure N/A because sem rede (falha do Realm cai em ERR-01 ou `RealmErrorBoundary`); data lifecycle N/A because o perfil não é excluído nesta feature; observability N/A because app offline sem telemetria; concurrency além de WEL-06 N/A because usuário único.

## Invariants

- **INV-01** — Para qualquer sequência de toques em `Começar`, existe no máximo um `Profile` criado pelo app.
- **INV-02** — Para qualquer sequência de toques em `+` e `−` a partir de um valor válido, `dailyGoal` fica em 5..200 e é múltiplo de 5.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Divisão do M4 | `profile-onboarding` + `profile-stats` | Spec único passaria de ~4k tokens | yes |
| Editar o nome | Tocar no cabeçalho abre modal `Editar nome` | O PNG 7 não mostra; segue o formulário de baralho | yes |
| Stepper da meta | 5 em 5, de 5 a 200, grava na hora | Padrão 20 e design 30 são múltiplos de 5 | yes |
| Cartão da Início sem baralhos | Aparece, sem `Estudar tudo` | PNG 2b | yes |
| Subtítulos do cartão | Tabela HOM-03 | 0 e N vêm dos PNGs; "já estudou" é discrição do agente | yes |
| Validação do nome | Trim; 1–30 caracteres; campo limitado a 30 | PROJECT-SPEC §4 | yes |
| Avatar do perfil | Primeira letra do nome | PNG 7 mostra uma letra | yes |
| Revisões hoje | Conta todas as notas | RF5 fala de revisões, não de acertos | yes |
| Selos `Novo`/`Em dia` e estado vazio da Início | Sem mudança | Já entregues no M2/M3 | yes |

**Open questions**: none

# Sessão de estudo — Spec

**Status**: Draft
**Date**: 2026-10-10

## Problem

O app já cria baralhos e cartões (M2), mas não tem como estudar. Cartões nascem vencidos e nada os agenda. Esta feature entrega o M3 (RF4): sessão de estudo por baralho ou de todos os baralhos, agendamento SM-2 (PROJECT-SPEC §5), estado vazio e Resumo. O `schedule` puro do M1 ainda não existe e entra aqui. Decisões e motivos: [context.md](context.md).

## Scope

### In scope

- `src/domain`: `schedule` (SM-2 da §5), intervalo para rótulo, início do dia local e streak atual (RF6).
- Botões "Estudar" (Baralho) e "Estudar tudo" (Início).
- Telas Sessão (frente e verso, PNGs 5a/5b), Nada para revisar (PNG 8) e Resumo (PNG 6), claro e escuro.
- Gravação de cada resposta: cartão reagendado + `ReviewLog` numa única transação.

### Out of scope

| Item | Reason |
| --- | --- |
| Nome do perfil no Resumo; streak e meta diária na Início | M4 (RF1, RF6), context.md |
| Maior streak histórico | M4 (RF6), exibido no Perfil |
| Passos de aprendizado em minutos | Muda a §5; Deferred Ideas |
| Limite de cartões novos por dia | PROJECT-SPEC §13 em aberto |
| Barra de abas | M4 |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | medium | Design contradiz a §5 (minutos) e usa dados do M4; resolvido em context.md |
| criticality | high | Sessão de estudo é o fluxo central do app (RF4) |
| blast_radius | medium | Altera as telas Início e Baralho, os campos de agendamento de `Card` e invalida `["decks"]` e `["cards"]` |
| novelty | medium | Primeira fila de sessão em memória e primeira escrita que cruza `Card` e `ReviewLog` |
| irreversibility | low | Dados locais de desenvolvimento; revert do commit basta |
| integrations | none | Sem rede |
| state | medium | Registros novos (`ReviewLog`) e atualização do cartão na mesma transação |
| auth | none | Perfil local |
| concurrency | low | Usuário único; toque duplo coberto por ANS-06 |
| migrations | low | Schemas existem; só muda se o plano escolher `linkingObjects` para achar o baralho do cartão |
| security | low | Texto do cartão já é renderizado como `Text` no M2 |
| data_integrity | medium | `ReviewLog` é imutável e base de estatísticas e streak (M4) |

**Declared level**: HIGH

## Acceptance Criteria

### P1 — Agendamento SM-2 (domínio)

`schedule(card, grade, now)` usa os valores do cartão **antes** da resposta. Notas: 0 = Errei, 1 = Difícil, 2 = Bom, 3 = Fácil.

- **SRS-01** — Errei: `repetitions = 0`, `intervalDays = 0`, `easeFactor − 0.20`, `lapses + 1`.
- **SRS-02** — Difícil: `repetitions + 1`, `intervalDays = max(1, round(intervalDays × 1.2))`, `easeFactor − 0.15`.
- **SRS-03** — Bom: `repetitions + 1`, `easeFactor` sem mudança. `intervalDays`: `repetitions` antes = 0 → 1; = 1 → 3; ≥ 2 → `round(intervalDays × easeFactor)`.
- **SRS-04** — Fácil: `repetitions + 1`, `intervalDays = round(intervalo de Bom × 1.3)`, `easeFactor + 0.15`.
- **SRS-05** — `easeFactor` nunca fica abaixo de 1.3 e é arredondado a 2 casas. Exemplo: EF 1.40 + Errei → 1.30; EF 2.50 + Difícil → 2.35.
- **SRS-06** — Difícil, Bom e Fácil não alteram `lapses`.
- **SRS-07** — `dueDate` = início do dia local de `now` (00:00) + `intervalDays` dias de calendário. Exemplo: `now` 2026-10-10 23:50, intervalo 1 → 2026-10-11 00:00 local.
- **SRS-08** — Tabela de exemplos (`rep, int, EF` antes → resultado `rep, int, EF`):

  | Antes | Nota | Depois |
  | --- | --- | --- |
  | 0, 0, 2.50 | Errei | 0, 0, 2.30 |
  | 0, 0, 2.50 | Difícil | 1, 1, 2.35 |
  | 0, 0, 2.50 | Bom | 1, 1, 2.50 |
  | 0, 0, 2.50 | Fácil | 1, 1, 2.65 |
  | 1, 1, 2.50 | Bom | 2, 3, 2.50 |
  | 1, 1, 2.50 | Fácil | 2, 4, 2.65 |
  | 2, 3, 2.50 | Bom | 3, 8, 2.50 |
  | 2, 3, 2.50 | Fácil | 3, 10, 2.65 |
  | 3, 10, 2.00 | Difícil | 4, 12, 1.85 |
  | 4, 20, 1.30 | Errei | 0, 0, 1.30 |

- **LBL-01** — Rótulo de intervalo: 0 → `agora`; 1 → `1 dia`; n ≥ 2 → `n dias`.

### P1 — Streak (domínio)

- **STK-01** — Um dia local conta quando tem ao menos uma revisão (`reviewedAt` naquela data local).
- **STK-02** — Streak atual = dias consecutivos que contam terminando hoje; se hoje não conta, terminando ontem; se nenhum dos dois conta, 0. Exemplos (hoje = 10/10): revisões em 08, 09, 10 → 3; em 08, 09 → 2; em 07, 08 → 0; em 10 apenas → 1; nenhuma → 0.
- **STK-03** — Várias revisões no mesmo dia contam uma vez. Uma revisão às 23:59 e outra às 00:01 do dia seguinte contam dois dias.

### P1 — Entrada na sessão

- **ENT-01** — A tela Baralho mostra, abaixo dos selos, o botão `Estudar · N cartões` (`1 cartão`) com N = `dueCount`; com `dueCount = 0`, o texto é `Estudar`. O botão aparece mesmo sem cartões.
- **ENT-02** — Com baralhos, a Início mostra acima de `Seus baralhos` o botão `Estudar tudo` com o selo `N cartões` (`1 cartão`), N = soma dos `dueCount`; com N = 0, sem selo. Sem baralhos, a Início continua como HOME-06 (sem o botão).
- **ENT-03** — WHEN o usuário toca `Estudar` THEN o app SHALL abrir a sessão do baralho; `Estudar tudo` abre a sessão de todos os baralhos.

### P1 — Fila

- **QUE-01** — A fila é lida no momento em que a sessão abre: cartões do baralho (ou de todos os baralhos) com `dueDate <= fim do dia local`, em ordem crescente de `dueDate`; empate por `createdAt` crescente.
- **QUE-02** — A fila não muda depois de aberta: cartões que vencem durante a sessão (virada do dia, outro acesso) entram só na próxima sessão.
- **QUE-03** — IF a fila está vazia ao abrir THEN o app SHALL mostrar a tela Nada para revisar (EMP-01).

### P1 — Sessão

- **SES-01** — O topo mostra o botão fechar (`Sair da sessão`), a barra de progresso e `k de N`: N = cartões na fila ao abrir; k = cartões concluídos + 1. A barra preenche `concluídos / N`.
- **SES-02** — Abaixo do topo aparece o nome do baralho do cartão atual (em `Estudar tudo`, muda a cada cartão).
- **SES-03** — Frente: rótulo `FRENTE`, o texto da frente, a dica `Toque para ver a resposta` e o botão `Mostrar resposta`.
- **SES-04** — WHEN o usuário toca o cartão ou `Mostrar resposta` THEN o app SHALL mostrar o verso: `FRENTE` com a frente em destaque menor, `VERSO` com o texto do verso, `Como foi lembrar?` e os botões `Errei`, `Difícil`, `Bom`, `Fácil`.
- **SES-05** — Cada botão de resposta mostra na segunda linha o rótulo (LBL-01) do intervalo que `schedule` daria àquele cartão naquele instante. Exemplo, cartão novo: `agora`, `1 dia`, `1 dia`, `1 dia`.
- **SES-06** — Os botões de resposta só aparecem com o verso visível.

### P1 — Resposta

- **ANS-01** — WHEN o usuário responde THEN o app SHALL, numa única transação, gravar no cartão o resultado de `schedule(cartão, nota, agora)` e criar um `ReviewLog` com `cardId`, `deckId` do baralho do cartão, `grade` e `reviewedAt = agora`.
- **ANS-02** — WHEN a resposta é Errei THEN o cartão SHALL ir para o fim da fila da sessão e `concluídos` não muda.
- **ANS-03** — WHEN a resposta é Difícil, Bom ou Fácil THEN o cartão SHALL sair da fila e `concluídos` aumenta 1.
- **ANS-04** — Depois de gravar, o próximo cartão da fila aparece com a frente visível.
- **ANS-05** — WHEN a fila esvazia THEN o app SHALL substituir a sessão pelo Resumo; voltar a partir do Resumo não reabre a sessão.
- **ANS-06** — WHILE uma resposta está sendo gravada, os quatro botões ignoram toques; dois toques seguidos gravam um só `ReviewLog`.
- **ANS-07** — Depois de uma resposta, Início e Baralho mostram `dueCount` e estágios atualizados ao voltar, sem reabrir o app.

### P1 — Sair no meio

- **EXT-01** — WHEN o usuário toca fechar com a sessão em andamento THEN o app SHALL mostrar o alerta `Sair da sessão?`, mensagem `Seu progresso já foi salvo.`, botões `Continuar` e `Sair`.
- **EXT-02** — `Sair` volta à tela de origem (Baralho ou Início) sem Resumo; as respostas já dadas continuam gravadas. `Continuar` fecha o alerta e mantém o cartão e o lado visíveis.
- **EXT-03** — O gesto de deslizar para voltar fica desativado na sessão; o botão voltar do Android abre o mesmo alerta de EXT-01.

### P1 — Nada para revisar

- **EMP-01** — A tela mostra o botão fechar, `Nada para revisar hoje`, `Você está em dia! A memória também se fortalece no descanso.`, o selo `Amanhã: N cartões` (SUM-06) e o botão `Voltar ao início`.
- **EMP-02** — Na sessão de um baralho, aparece também o link `Adicionar novos cartões`, que abre o Editor de cartão em modo criar para esse baralho. Em `Estudar tudo`, o link não aparece.
- **EMP-03** — Fechar volta à tela de origem sem alerta; `Voltar ao início` volta à Início.

### P1 — Resumo

- **SUM-01** — O Resumo mostra `Sessão concluída` e `Bom trabalho! Você revisou tudo o que vencia hoje.`
- **SUM-02** — Bloco `N cartões revistos` (`1 cartão revisto`), N = cartões da fila.
- **SUM-03** — Bloco `P% de acerto`, P = `round(100 × respostas com nota ≥ 1 / total de respostas da sessão)`. Exemplo: 3 Errei, 4 Difícil, 15 Bom, 5 Fácil → 24/27 → `89%`. (Emenda: o exemplo original, 27/30 = 90%, não batia com as contagens.)
- **SUM-04** — Bloco `N dias seguidos` (`1 dia seguido`) com o streak atual (STK-02) calculado depois da sessão.
- **SUM-05** — `Suas respostas`: contagem de cada nota (`Errei`, `Difícil`, `Bom`, `Fácil`) sobre todas as respostas, barra segmentada proporcional às contagens (nota com 0 não aparece na barra) e `M min de estudo`, M = minutos arredondados da abertura da sessão até a última resposta; abaixo de 1 min, `< 1 min de estudo`.
- **SUM-06** — `Amanhã: N cartões para revisar` (`1 cartão`; 0 → `Amanhã: nenhum cartão para revisar`), N = cartões do mesmo escopo da sessão com `dueDate <=` fim do dia local de amanhã.
- **SUM-07** — `Concluir` volta à tela de origem (Baralho ou Início).

### P2 — Acessibilidade, tema e desempenho

- **A11Y-01** — Botões de resposta têm label `<nota>, <rótulo>` (ex.: `Bom, 3 dias`); a barra de progresso é lida como `Cartão k de N`; todos os tocáveis seguem A11Y-01 do M2 (role, label, ≥ 44pt).
- **THM-01** — As telas usam os tokens de `src/theme` e seguem os PNGs claros e escuros.
- **PERF-01** — Com 1.000 cartões vencidos num baralho, a fila é montada por consulta ao `dueDate` indexado, sem carregar cartões não vencidos.

## Failure & Edge Behavior

- **ANS-08** — IF a gravação de uma resposta falha THEN o app SHALL mostrar `Não foi possível salvar a resposta. Tente de novo.`, manter o mesmo cartão com o verso visível, não alterar fila nem contadores e não deixar cartão ou `ReviewLog` gravados pela metade.
- **QUE-04** — IF a sessão de baralho abre com id inexistente ou inválido THEN o app SHALL mostrar `Baralho não encontrado` e o botão `Voltar ao início`.
- **QUE-05** — IF um cartão da fila não existe mais quando chega a vez dele THEN o app SHALL pulá-lo, contando-o como concluído e sem gravar resposta.
- **LOAD-01** — WHILE a fila não foi lida, a sessão não mostra o estado vazio.

Other dimensions: input bounds N/A because a nota vem de quatro botões fixos e o texto do cartão já foi validado no M2; idempotency coberta por ANS-06; auth N/A because perfil local; concurrency N/A além de ANS-06 because usuário único e a sessão ocupa a tela toda; data lifecycle N/A because `ReviewLog` é imutável e sobrevive à exclusão do cartão (ARCHITECTURE.md); external-dependency failure N/A because sem rede (falha do Realm cai em ANS-08 ou `RealmErrorBoundary`); observability N/A because app offline sem telemetria.

## Invariants

- **INV-01** — Para qualquer sequência de respostas, o número de `ReviewLog` criados é igual ao número de respostas aceitas, e cada um corresponde a exatamente uma atualização do cartão; nunca existe um sem o outro.
- **INV-02** — Para qualquer cartão válido e sequência de notas, `schedule` mantém `easeFactor >= 1.3`, `intervalDays >= 0`, `repetitions >= 0`, `lapses` nunca diminui e `dueDate >=` início do dia local de `now`.
- **INV-03** — Em qualquer ponto da sessão, `0 <= concluídos <= N` e `concluídos + cartões restantes na fila = N`.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Rótulos dos botões | Intervalo real de `schedule` | O design usa minutos que a §5 não tem | yes |
| Conteúdo do Resumo | Tudo do PNG 6, menos o nome | Nome depende do perfil (M4) | yes |
| Contagem com Errei | Progresso por cartões; acerto e distribuição por respostas | Mesmo critério do M4 (RF5) | yes |
| Entrada | Botões sempre visíveis, como nos PNGs 2 e 3 | Tela 8 cobre o caso vazio | yes |
| Sair no meio | Alerta de confirmação | Escolha do usuário | yes |
| Virada do dia na sessão | Fila fixa; agendamento com a hora real | Previsível e simples | yes |
| Arredondamento | `Math.round` (meio para cima); EF com 2 casas | Evita deriva de ponto flutuante no EF | no |
| Bom × EF na 3ª resposta em diante | Usa o EF de antes da resposta | Bom não muda o EF, então é igual | no |
| Fácil num cartão novo | 1 dia (round(1 × 1.3)) | Consequência direta da §5 | no |
| `Adicionar novos cartões` em Estudar tudo | Não aparece | Sem baralho alvo; repetiria `Voltar ao início` (ajusta context.md) | no |
| Rótulo de intervalos longos | Sempre em dias (`142 dias`) | Escopo enxuto | no |
| Streak no M3 | Só o atual; maior streak no M4 | O Resumo só usa o atual | no |

**Open questions**: none

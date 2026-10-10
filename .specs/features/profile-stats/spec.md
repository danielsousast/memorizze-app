# Estatísticas do Perfil — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

A aba Perfil mostra só nome e meta diária. O PNG 7 prevê, abaixo da meta, sequência atual e maior, % de acerto em 7 e 30 dias, gráfico dos últimos 7 dias e cartões por estágio. Sem isso o usuário não vê o progresso além de hoje. Esta feature entrega a segunda metade do M4: RF5 e RF6 completos (a sequência atual e `Revisões hoje` já existem em `profile-onboarding`).

## Scope

### In scope

- Quatro blocos novos no Perfil, abaixo do cartão `Meta diária` (PNG 7, claro e escuro): sequência atual e maior sequência; acerto 7 e 30 dias; gráfico `Últimos 7 dias`; `Seus cartões`.
- Lógica de datas e contagem em `src/domain/` (`streak.ts` ganha a maior sequência; `stats.ts` novo).
- Os blocos refletem revisões e cartões gravados ao voltar para a aba.

### Out of scope

| Item | Reason |
| --- | --- |
| Estatísticas por baralho, outros períodos, exportar | Fora do RF5/RF6 |
| Toque nas barras ou nos estágios | Não está no design |
| Mudar o cálculo da sequência atual da Início | Já entregue (STK-02 do M3) |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | Janelas, divisão por zero e escala do gráfico resolvidas em Assumptions |
| criticality | low | Leitura de métricas; não bloqueia estudo nem entrada |
| blast_radius | low | Só `profile-screen` e novos módulos de domínio |
| novelty | medium | Primeiro gráfico do app, feito sem biblioteca |
| irreversibility | none | Somente leitura |
| integrations | none | Sem rede |
| state | low | Valores derivados de `ReviewLog` e `Card`; nada novo gravado |
| auth | none | Perfil local |
| concurrency | none | Usuário único, só leitura |
| migrations | none | Sem mudança de schema |
| security | none | Só números exibidos |
| data_integrity | low | Datas no fuso local; erro de borda de dia distorce a métrica |

**Declared level**: MEDIUM

## Acceptance Criteria

### P1 — Sequência (RF6)

- **SEQ-01** — O bloco `Sequência atual` mostra `N dias` (`1 dia`), N = sequência atual de `currentStreak`, com ícone de chama, em cartão destacado.
- **SEQ-02** — O bloco `Maior sequência` mostra `N dias` (`1 dia`), N = maior número de dias locais consecutivos com ao menos 1 `ReviewLog`; sem revisões mostra `0 dias`.
- **SEQ-03** — Exemplos (hoje = 10/10; dias com revisão → atual / maior): `{}` → 0 / 0; `{10/10}` → 1 / 1; `{09/10}` → 1 / 1; `{05/10, 06/10, 07/10, 09/10, 10/10}` → 2 / 3; `{07/10, 08/10}` → 0 / 2.
- **SEQ-04** — A maior sequência nunca é menor que a atual.

### P1 — Acerto (RF5)

- **ACC-01** — `Acerto · 7 dias` = `round(100 × revisões com grade ≥ 1 ÷ revisões)` nos últimos 7 dias locais, hoje incluído, exibido como `87%`.
- **ACC-02** — `Acerto · 30 dias` usa a mesma regra nos últimos 30 dias locais, hoje incluído.
- **ACC-03** — Exemplo: 10 revisões com notas 0,0,1,2,2,2,3,3,3,3 → `80%`; 2 de 3 → `67%`.
- **ACC-04** — IF não há revisões na janela THEN o bloco SHALL mostrar `—` no lugar do percentual.

### P1 — Últimos 7 dias (RF5)

- **CHT-01** — O cartão `Últimos 7 dias` mostra 7 barras, do dia 6 dias atrás até hoje, cada uma com a contagem de revisões do dia local (qualquer nota) acima dela.
- **CHT-02** — O rótulo de cada barra é a abreviação pt-BR do dia (`Dom`, `Seg`, `Ter`, `Qua`, `Qui`, `Sex`, `Sáb`); o de hoje é `Hoje`, e a barra de hoje usa a cor de destaque.
- **CHT-03** — O cabeçalho do cartão mostra o total dos 7 dias como `N revisões` (`1 revisão`).
- **CHT-04** — Uma linha pontilhada marca `meta G` (G = `dailyGoal`). A altura de cada barra é `contagem ÷ max(G, maior contagem)` da altura útil; dia com 0 revisões mostra o valor `0` e barra de altura mínima visível.
- **CHT-05** — O gráfico tem um único `accessibilityLabel` que lista os 7 dias com a contagem, ex.: `Últimos 7 dias: Sáb 32, Dom 24, …, Hoje 18`.

### P1 — Seus cartões (RF5)

- **CRD-01** — O cartão `Seus cartões` mostra `N no total` e três contagens: `Novos` (`repetitions = 0`), `Aprendendo` (`repetitions > 0` e `intervalDays < 21`) e `Maduros` (`intervalDays ≥ 21`), usando `cardStage`, de todos os baralhos.
- **CRD-02** — A barra tem três segmentos, na ordem Novos, Aprendendo, Maduros, com largura proporcional à contagem; segmento com 0 cartões não aparece.
- **CRD-03** — Exemplo: 96 novos, 128 aprendendo, 268 maduros → `492 no total`; segmentos 19,5%, 26,0%, 54,5%.
- **CRD-04** — IF não há cartões THEN o cartão SHALL mostrar `0 no total`, as três contagens `0` e a barra vazia (trilho cinza).

### P2 — Atualização, tema e acessibilidade

- **UPD-01** — WHEN a aba Perfil volta a ficar visível (fim de sessão, troca de aba) THEN todos os blocos SHALL refletir os `ReviewLog` e cartões gravados e o dia local corrente.
- **THM-01** — Os blocos usam os tokens de `src/theme` e seguem o PNG 7 e o `7 · Perfil — escuro`.
- **A11Y-01** — Cada bloco numérico é lido como um item (`Sequência atual, 12 dias`, `Acerto 7 dias, 87%`, `Cartões novos, 96`); os rótulos não dependem só de cor.

## Failure & Edge Behavior

- **ERR-01** — IF a leitura das estatísticas falha THEN o app SHALL manter o cartão `Meta diária` e mostrar, no lugar dos blocos novos, `Não foi possível carregar as estatísticas.`
- **EDG-01** — Um `ReviewLog` às 23:59 e outro às 00:00 do dia seguinte caem em dias diferentes no gráfico, no acerto e na sequência.
- **EDG-02** — Revisões com data futura (relógio alterado) não entram nas janelas de 7 e 30 dias nem no gráfico.

Other dimensions: input validation N/A porque não há entrada do usuário; idempotency N/A porque só leitura; concurrency N/A porque usuário único; state transitions N/A porque sem estado novo; data lifecycle N/A porque nada é gravado ou apagado; observability N/A porque app offline sem telemetria.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Janela de 7/30 dias | Hoje + 6 (ou 29) dias locais anteriores | Casa com o gráfico de 7 dias | no |
| Acerto sem revisões | `—` | Evita 0% enganoso | no |
| Escala do gráfico | `max(meta, maior dia)` | PNG 7 mostra barra de 41 acima da linha de 30 | no |
| Maior sequência | Calculada sobre todo o histórico de `ReviewLog` | RF6: maior streak histórico | no |
| Seus cartões | Todos os baralhos, `cardStage` do M3 | PROJECT-SPEC RF5 | no |
| Sem biblioteca de gráficos | Barras com `View` | Gráfico simples; evita dependência nativa | no |

**Open questions**: none

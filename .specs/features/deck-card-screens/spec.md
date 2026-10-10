# Deck & Card Screens — Spec

**Status**: Done
**Date**: 2026-10-09

## Problem

O app tem repositórios e hooks de baralhos e cartões (`deck-card-crud`), mas nenhuma tela: `src/app/index.tsx` ainda é o placeholder do Expo. O usuário não consegue criar, ver, editar nem excluir nada. Esta feature entrega as telas Início, Baralho, Form de baralho e Editor de cartão, conforme `design/`, e fecha o M2 (RF2 e RF3 de ponta a ponta).

## Scope

### In scope

- Tela Início: lista de baralhos, estado vazio, criar baralho.
- Tela Baralho: detalhes, lista de cartões, busca, adicionar, editar e excluir baralho.
- Form de baralho (modal): criar e editar.
- Editor de cartão (modal): criar, editar e excluir.
- `src/domain/dates.ts` mínimo e estágio do cartão; `dueCount` no `Deck`.
- Componentes de UI compartilhados que essas telas usam (`src/components/`).

### Out of scope

| Item | Reason |
| --- | --- |
| Card de streak e meta diária; nome na saudação | M4 (RF1, RF5, RF6) |
| Botões "Estudar" e "Estudar tudo" | M3 (RF4) |
| Barra de abas e aba Perfil | M4; Stack até lá |
| Boas-vindas e Splash | M4 (RF1) |
| Seletor de baralho no Editor (mover cartão) | Repositório não move cartões; ver context.md |
| Swipe para excluir, ordenação configurável | Ver context.md, Deferred Ideas |
| Atualizar contagens na virada do dia sem escrita | Ver assumptions |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | medium | Design sem form de baralho, estados vazios, erros nem confirmações; decididos em context.md |
| criticality | medium | Primeiras telas: todo uso do app passa por elas |
| blast_radius | medium | Troca a rota raiz `src/app/index.tsx`, cria `src/components/` e acrescenta `dueCount` ao tipo `Deck` |
| novelty | medium | Primeira UI do projeto: rotas modais, componentes, testes de tela |
| irreversibility | low | Exclusões pedem confirmação; sem dados reais ainda |
| integrations | none | Sem rede |
| state | low | Usa hooks e invalidação existentes; só soma um campo derivado |
| auth | none | Perfil local |
| concurrency | low | Usuário único; duplo toque tratado em DFM-06/EDT-08 |
| migrations | none | Schemas não mudam |
| security | low | Texto do usuário exibido via `Text` |
| data_integrity | low | Conteúdo local, corrigível à mão |

**Declared level**: HIGH

## Acceptance Criteria

### P1 — Vencidos e estágio (domínio)

- **DAT-01** — `endOfLocalDay(now)` devolve 23:59:59.999 do dia local de `now`. Exemplos: 2026-10-09 00:00 → 2026-10-09 23:59:59.999; 2026-10-09 23:59:59.999 → o mesmo instante.
- **DAT-02** — Um cartão está vencido em `now` sse `dueDate <= endOfLocalDay(now)` (PROJECT-SPEC §5). Exemplos: due 2026-10-09 23:59:59.999 → vencido em 2026-10-09 08:00; due 2026-10-10 00:00 → não vencido.
- **STG-01** — Estágio: `repetitions = 0` → Novo; senão `intervalDays < 21` → Aprendendo; senão → Maduro. Exemplos: (0, 30) → Novo; (1, 20) → Aprendendo; (3, 21) → Maduro.
- **DUE-01** — Os hooks de baralho (lista e por id) devolvem `dueCount` = cartões do baralho vencidos no instante da leitura.
- **DUE-02** — WHEN um cartão é criado ou excluído via hook THEN `dueCount` dos baralhos montados SHALL refletir a mudança sem remontar.

### P1 — Início

- **HOME-01** — O topo mostra a data de hoje em pt-BR (`Sexta-feira, 9 de outubro`) e o título `Olá`.
- **HOME-02** — Com baralhos, a seção `Seus baralhos` mostra `N baralhos` (`1 baralho`) e um item por baralho na ordem de DCK-02.
- **HOME-03** — Cada item mostra as iniciais (INI-01), o nome em uma linha com reticências e `N cartões` (`1 cartão`).
- **HOME-04** — Selo do item: `dueCount > 0` → `N hoje` (destaque); `dueCount = 0` e `cardCount > 0` → `✓ Em dia`; `cardCount = 0` → sem selo.
- **HOME-05** — WHEN o usuário toca um item THEN o app SHALL abrir a tela Baralho daquele baralho.
- **HOME-06** — Sem baralhos, a tela mostra `Nenhum baralho ainda`, o texto do design e o botão `Criar primeiro baralho`, que abre o Form de baralho em modo criar. O botão flutuante não aparece.
- **HOME-07** — Com baralhos, o botão flutuante `+` (label `Criar baralho`) abre o Form de baralho em modo criar.
- **INI-01** — Iniciais = as duas primeiras letras da primeira palavra com letras do nome, em maiúsculas. Exemplos: `Inglês — Verbos` → `IN`; `JavaScript` → `JA`; `é` → `É`; `42 respostas` → `RE`; `123` → `#`.

### P1 — Baralho

- **DECK-01** — A tela mostra `‹ Início` (volta), o menu `⋯` (label `Opções do baralho`), o nome e a descrição, se houver.
- **DECK-02** — Selos: `N cartões` sempre; `N para hoje` (destaque) quando `dueCount > 0`; `N maduros` quando há algum Maduro.
- **DECK-03** — A seção `Cartões` lista os cartões do mais recente ao mais antigo. Cada linha mostra a frente e o verso em uma linha cada (quebras de linha viram espaço) e o selo de estágio (STG-01).
- **DECK-04** — A busca filtra a cada tecla por frente ou verso, sem diferenciar maiúsculas nem acentos e ignorando espaços nas pontas. Exemplos: `ESQUE` acha `esquecer`; `facil` acha `fácil`; `  ` mostra todos.
- **DECK-05** — IF a busca não acha nada THEN a lista SHALL mostrar `Nenhum cartão encontrado`.
- **DECK-06** — Baralho sem cartões mostra `Nenhum cartão ainda` e esconde a busca.
- **DECK-07** — O botão flutuante `Adicionar cartão` abre o Editor em modo criar para este baralho.
- **DECK-08** — WHEN o usuário toca um cartão THEN o app SHALL abrir o Editor em modo edição daquele cartão.
- **DECK-09** — O menu `⋯` oferece `Editar baralho` (abre o Form em modo edição), `Excluir baralho` e `Cancelar`.
- **DECK-10** — `Excluir baralho` pede confirmação: título `Excluir “<nome>”?`, mensagem `Os N cartões deste baralho também serão excluídos.` (com 1: `O único cartão deste baralho também será excluído.`; sem mensagem se vazio) *(A-01)*, botões `Cancelar` e `Excluir`. Confirmar exclui e volta ao Início sem o baralho; cancelar não muda nada.

### P1 — Form de baralho

- **DFM-01** — Modo criar: título `Novo baralho`, campos `Nome` e `Descrição` (opcional), `Cancelar` e `Salvar`.
- **DFM-02** — WHEN `Salvar` grava um baralho novo THEN o app SHALL fechar o form e abrir a tela Baralho do novo baralho.
- **DFM-03** — Modo edição: título `Editar baralho`, campos preenchidos. `Salvar` grava nome e descrição (descrição vazia remove, DCK-04) e volta ao Baralho com os novos valores.
- **DFM-04** — `Cancelar` ou o gesto de voltar fecha o form sem gravar.

### P1 — Editor de cartão

- **EDT-01** — Modo criar: título `Novo cartão`, `Cancelar`, o baralho (iniciais + nome, só leitura), campos `Frente` (`Pergunta ou termo`) e `Verso` (`Resposta`) com várias linhas, a dica `Uma ideia por cartão deixa a revisão mais rápida.`, `Salvar` e `Salvar e criar outro`.
- **EDT-02** — WHEN `Salvar` grava um cartão novo THEN o app SHALL voltar ao Baralho, com o cartão no topo da lista e o selo `Novo`.
- **EDT-03** — WHEN `Salvar e criar outro` grava THEN o Editor SHALL continuar aberto com os campos vazios e o foco em `Frente`.
- **EDT-04** — Modo edição: título `Editar cartão`, campos preenchidos, sem `Salvar e criar outro`, com `Excluir cartão`. `Salvar` grava os textos sem mudar o agendamento (CRD-04) e fecha o Editor.
- **EDT-05** — `Excluir cartão` pede confirmação (`Excluir cartão?`, `Cancelar`/`Excluir`). Confirmar exclui, fecha o Editor e o Baralho não mostra mais o cartão.
- **EDT-06** — `Cancelar` ou o gesto de voltar fecha o Editor sem gravar. Quebras de linha digitadas são gravadas como estão.

### P2 — Acessibilidade e tema

- **A11Y-01** — Todo elemento tocável tem `accessibilityRole="button"`, `accessibilityLabel` e área de toque ≥ 44pt.
- **A11Y-02** — O item de baralho é lido como um único elemento: `<nome>, N cartões, N para hoje` (ou `, em dia`).
- **THM-01** — As telas usam os tokens de `src/theme`; com o sistema em modo escuro, o fundo é `darkColors.background`.
- **PERF-01** — Com 1.000 cartões, a lista do Baralho renderiza menos de 100 linhas na montagem (virtualizada).

## Failure & Edge Behavior

- **DFM-05** — IF o hook rejeita com `DECK_NAME_EMPTY` ou `DECK_NAME_DUPLICATE` THEN o form SHALL mostrar sob `Nome` `Dê um nome ao baralho.` ou `Já existe um baralho com esse nome.`, manter os valores digitados e não fechar.
- **DFM-06** — WHILE a gravação está pendente, `Salvar` fica desativado; dois toques seguidos gravam um só baralho.
- **DFM-07** — IF o modo edição abre com um baralho inexistente THEN o form SHALL mostrar `Baralho não encontrado` e o botão `Voltar`.
- **EDT-07** — IF o hook rejeita com `CARD_FRONT_EMPTY` ou `CARD_BACK_EMPTY` THEN o Editor SHALL mostrar sob o campo `Escreva a frente do cartão.` ou `Escreva o verso do cartão.`, manter o texto e não fechar.
- **EDT-08** — WHILE a gravação está pendente, `Salvar`, `Salvar e criar outro` e `Excluir cartão` ficam desativados.
- **EDT-09** — IF o Editor abre com cartão ou baralho inexistente THEN SHALL mostrar `Cartão não encontrado` (ou `Baralho não encontrado`) e o botão `Voltar`.
- **DECK-11** — IF a tela Baralho abre com id inexistente ou inválido THEN SHALL mostrar `Baralho não encontrado` e o botão `Voltar ao início`.
- **ERR-01** — IF uma gravação falha com erro sem código de domínio THEN a tela SHALL mostrar `Não foi possível salvar. Tente de novo.` e não fechar.
- **LOAD-01** — WHILE a leitura inicial não terminou, Início e Baralho não mostram estado vazio.

Other dimensions: input bounds N/A because o repositório não limita tamanho (assumption em deck-card-crud) e os campos só fazem trim; idempotency coberta por DFM-06/EDT-08; auth N/A because perfil local; concurrency N/A because usuário único; external-dependency failure N/A because sem rede (falha do Realm cai em ERR-01 ou `RealmErrorBoundary`); observability N/A because app offline sem telemetria; data lifecycle coberto por DECK-10/EDT-05 com confirmação.

## Invariants

- **INV-01** — Nenhuma ação destas telas altera `easeFactor`, `intervalDays`, `repetitions`, `lapses` ou `dueDate` de um cartão existente.
- **INV-02** — Para qualquer `dueDate` e `now`, `isDue` e `endOfLocalDay` concordam com DAT-02, inclusive na virada do dia.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Vencidos e estágio no M2 | `dates` mínimo + estágio agora | Cartão novo nasce vencido; funções puras | yes |
| Elementos de M3/M4 | Omitidos; sem abas | Sem placeholders falsos | yes |
| UI de criar/editar baralho | Modal com form | Sem design; segue o Editor | yes |
| Editar/excluir | Toque edita; excluir no Editor e no menu `⋯` | Menos gestos e código | yes |
| Título do Início sem perfil | `Olá` | Nome chega no M4 | yes |
| Iniciais | Regra de INI-01 | Design usa códigos de idioma (`EN`), que exigiriam campo novo | yes |
| Após criar baralho | Abre o Baralho novo | Próximo passo natural é adicionar cartões | yes |
| Ordem dos cartões | Mais recentes primeiro, fixa | Design: "Mais recentes" | yes |
| Contagens na virada do dia | Atualizam na próxima escrita ou ao reabrir o app | `staleTime: Infinity` (AD-002); M3 revisita com a sessão | yes |
| Cancelar com texto digitado | Fecha sem aviso | Escopo enxuto; adiado em context.md | yes |

**Open questions**: none

## Amendments

### A-01 — Mensagem de exclusão com um cartão
- **Type**: clarification
- **Discovered in**: Plan (T7)
- **Change**: com 1 cartão, a confirmação diz `O único cartão deste baralho também será excluído.`
- **Reason**: `Os 1 cartão … serão excluídos` é gramaticalmente errado; o spec não fixava o texto.
- **Affected**: DECK-10 (modified)
- **Risk impact**: none
- **Status**: approved

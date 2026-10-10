# Deck & Card CRUD — Spec

**Status**: Approved
**Date**: 2026-10-09

## Problem

Os schemas Realm existem (feature `realm-schemas`), mas nada lê ou grava baralhos e cartões. As telas Início, Baralho e Editor de cartão (M2, RF2, RF3) precisam de operações CRUD com validação e de hooks para consumi-las. Esta feature também fixa o padrão de arquitetura por feature que as próximas (study, profile) vão seguir.

## Scope

### In scope

- Repositórios de Deck e Card: criar, listar, obter por id, atualizar e excluir, com as regras de RF2 e RF3.
- Hooks de caso de uso com React Query (`@tanstack/react-query`), um hook por operação.
- `QueryClientProvider` no layout raiz.
- Padrão de arquitetura por feature (`src/features/<feature>/`), documentado em ARCHITECTURE.md e registrado como decisão em STATE.md.

### Out of scope

| Item | Reason |
| --- | --- |
| Telas e componentes (Início, Baralho, Editor) | Próxima feature do M2; esta entrega só dados e hooks |
| Contagem de cartões vencidos hoje | Depende do módulo de datas do `domain/` (M1) |
| Busca de cartões por texto | Pedido da tela Baralho; entra com a tela |
| Diálogo de confirmação de exclusão | Comportamento de UI; o hook exclui quando chamado |
| Sessão de estudo, `schedule`, ReviewLog | M3 |
| Persistência do cache do React Query | O Realm já é a fonte persistente |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | RF2/RF3 definem as regras; restam defaults (ordem, case) registrados abaixo |
| criticality | medium | CRUD é o fluxo central do app; sem ele nada é estudável |
| blast_radius | medium | Novo provider em `src/app/_layout.tsx`; o padrão vale para todas as features |
| novelty | high | Nova dependência (React Query) e novo padrão de camadas no projeto |
| irreversibility | low | Exclusão em cascata apaga dados do usuário, mas não há dados reais ainda |
| integrations | none | Sem rede |
| state | high | Cache do React Query sobre o Realm exige invalidação correta após cada escrita |
| auth | none | Perfil local, sem login |
| concurrency | low | Usuário único; escritas do Realm serializadas na thread JS |
| migrations | none | Schemas não mudam |
| security | low | Texto do usuário é gravado e exibido via `Text`; sem parsing |
| data_integrity | low | Conteúdo do usuário, local, corrigível à mão |

**Declared level**: HIGH

## Acceptance Criteria

### P1 — Baralhos (RF2)

- **DCK-01** — WHEN um baralho é criado com `name` e `description` opcional THEN o sistema SHALL gravá-lo com `name` sem espaços nas pontas, `createdAt` = instante da criação e 0 cartões, e devolver o baralho criado.
- **DCK-02** — A listagem de baralhos SHALL devolver todos os baralhos em ordem de `createdAt` crescente, cada um com `cardCount` = número de cartões.
- **DCK-03** — Obter baralho por id: id existente → o baralho; id inexistente → `null`.
- **DCK-04** — WHEN um baralho é atualizado com novo `name` e/ou `description` THEN o sistema SHALL gravar os novos valores, com `name` sem espaços nas pontas, sem alterar `createdAt` nem os cartões.
- **DCK-05** — WHEN um baralho é excluído THEN o sistema SHALL apagar o baralho e todos os seus cartões.
- **DCK-09** — Após excluir um baralho, os cartões de outros baralhos e todos os `ReviewLog` continuam no banco, inalterados.

### P1 — Cartões (RF3)

- **CRD-01** — WHEN um cartão é criado em um baralho com `front` e `back` THEN o sistema SHALL gravá-lo com os textos sem espaços nas pontas, `easeFactor` 2.5, `intervalDays`, `repetitions` e `lapses` 0, `dueDate` = `createdAt` = instante da criação, e adicioná-lo ao fim da lista do baralho.
- **CRD-02** — A listagem de cartões de um baralho SHALL devolver os cartões na ordem em que foram adicionados.
- **CRD-03** — Obter cartão por id: id existente → o cartão; id inexistente → `null`.
- **CRD-04** — WHEN `front` e/ou `back` de um cartão são editados THEN o sistema SHALL gravar os novos textos e manter `easeFactor`, `intervalDays`, `repetitions`, `lapses`, `dueDate` e `createdAt` idênticos.
- **CRD-05** — WHEN um cartão é excluído THEN o sistema SHALL removê-lo do banco e da lista do baralho.
- **CRD-08** — Após excluir um cartão, os `ReviewLog` desse cartão continuam no banco, inalterados.

### P1 — Hooks e cache

- **HK-01** — Toda leitura e escrita de DCK-01..05 e CRD-01..05 SHALL estar disponível como hook React.
- **HK-05** — Os dados devolvidos pelos hooks são objetos simples (não `Realm.Object`) e continuam legíveis depois de o registro ser excluído.
- **HK-02** — WHEN uma escrita via hook conclui com sucesso THEN os hooks de leitura montados que dependem do dado SHALL exibir o novo valor sem remontar. Tabela:

  | Escrita | Leituras atualizadas |
  | --- | --- |
  | criar/atualizar/excluir baralho | lista de baralhos; o baralho por id |
  | criar/excluir cartão | lista de baralhos (`cardCount`); cartões do baralho |
  | editar cartão | cartões do baralho; o cartão por id |

- **HK-03** — WHILE o dispositivo está offline os hooks de leitura e escrita SHALL executar normalmente (nenhuma consulta ou mutação fica pausada).

### P1 — Padrão de arquitetura

- **ARC-01** — Cada feature vive em `src/features/<feature>/` com: `interfaces.ts` (tipos e contrato do repositório), `repository.ts` (único acesso ao Realm), `adapters.ts` quando há conversão de dados, e `usecases/` com um hook por arquivo.
- **ARC-05** — Uma feature com um único caso de uso tem esse hook na raiz da feature, sem pasta `usecases/`.
- **ARC-02** — Cada hook de caso de uso faz exatamente uma chamada React Query (`useQuery` ou `useMutation`), e a função dessa chamada invoca exatamente um método do repositório.
- **ARC-03** — Dentro de `src/features/`, só `repository.ts` e `adapters.ts` SHALL importar `realm`, `@realm/react` ou `@/db`.
- **ARC-04** — O padrão de ARC-01..03 SHALL estar descrito em ARCHITECTURE.md e registrado como decisão `AD-001` em `.specs/STATE.md`.

## Failure & Edge Behavior

- **DCK-06** — IF o `name` (após remover espaços nas pontas) está vazio THEN o sistema SHALL rejeitar com o código `DECK_NAME_EMPTY` e não gravar nada.
- **DCK-07** — IF o `name` é igual ao de outro baralho, ignorando espaços nas pontas e maiúsculas/minúsculas THEN o sistema SHALL rejeitar com `DECK_NAME_DUPLICATE` e não gravar nada.
- **DCK-10** — WHEN um baralho é atualizado mantendo o próprio nome (mesmo com outra caixa) THEN o sistema SHALL aceitar a atualização.
- **DCK-08** — IF atualização, exclusão ou criação de cartão referencia um baralho inexistente THEN o sistema SHALL rejeitar com `DECK_NOT_FOUND` e não gravar nada.
- **CRD-06** — IF `front` ou `back` (após remover espaços nas pontas) está vazio THEN o sistema SHALL rejeitar com `CARD_FRONT_EMPTY` ou `CARD_BACK_EMPTY` (front verificado primeiro) e não gravar nada.
- **CRD-07** — IF edição ou exclusão referencia um cartão inexistente THEN o sistema SHALL rejeitar com `CARD_NOT_FOUND`.
- **HK-04** — IF uma escrita via hook é rejeitada THEN o hook SHALL expor o erro com seu código (`error.code`).
- **HK-06** — Após uma escrita rejeitada, os hooks de leitura montados exibem os mesmos dados de antes.

Other dimensions: idempotency N/A because a submissão duplicada de baralho cai em DCK-07 e o bloqueio de duplo toque em cartão é da UI; auth N/A because perfil local sem login; concurrency N/A because usuário único e escritas Realm síncronas na thread JS; external-dependency failure N/A because não há rede e falha ao abrir o Realm já é tratada por `RealmErrorBoundary`; observability N/A because o app é offline sem telemetria; data lifecycle coberto por DCK-05 e CRD-05.

## Invariants

- **INV-01** — Nunca existem dois baralhos cujos nomes sejam iguais após remover espaços nas pontas e ignorar a caixa.
- **INV-02** — Após qualquer sequência de operações desta feature, todo `Card` pertence a exatamente um `Deck` (sem cartões órfãos).
- **INV-03** — Nenhuma operação desta feature cria, altera ou apaga `ReviewLog`.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| React Query sobre Realm | Leituras são snapshots em cache, atualizados por invalidação após mutações (não reatividade "live" do Realm) | Pedido explícito do usuário; escritas futuras (M3) também devem passar por mutações | yes |
| Comparação de nome duplicado | Ignora espaços nas pontas e caixa | "Inglês" e "inglês " seriam confusos na lista | yes |
| Ordem dos baralhos | `createdAt` crescente | Estável e previsível; a tela pode reordenar depois | yes |
| Limite de tamanho de nome/texto | Nenhum | PROJECT-SPEC não define para Deck/Card (1–30 é do Profile) | yes |
| Edição de `description` | Junto com o nome na atualização (DCK-04) | Evita um caso de uso só para descrição | yes |
| Nomes das features | `src/features/decks/` e `src/features/cards/` | Planejado em ARCHITECTURE.md | yes |

**Open questions**: none

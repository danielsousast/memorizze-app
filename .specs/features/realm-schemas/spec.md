# Realm Schemas — Spec

**Status**: Draft
**Date**: 2026-10-09

## Problem

O Realm abre com `schema: []`. O CRUD do M2 (RF2, RF3) e a sessão de estudo precisam dos modelos Profile, Deck, Card e ReviewLog de PROJECT-SPEC §4. Esta feature define só os schemas e os registra na configuração.

## Scope

### In scope

- Classes `Profile`, `Deck`, `Card`, `ReviewLog` (estendem `Realm.Object`, `static schema`), em `src/db/schemas/`.
- Tipos, opcionais, defaults e índices de PROJECT-SPEC §4.
- `realmConfig` com os quatro schemas e `schemaVersion: 2`.

### Out of scope

| Item | Reason |
| --- | --- |
| Repositórios e hooks (CRUD) | Próxima feature do M2 |
| Nome de baralho único, exclusão em cascata | Realm não tem unique além da PK nem cascade em listas; regra do repositório |
| Validações (nome 1–30, EF ≥ 1.3, grade 0–3) | Validação na borda: repositório/domínio |
| `dueDate` = `createdAt` na criação | Valor dinâmico atribuído pelo repositório de cartões |
| Decorators / `@realm/babel-plugin` | `static schema` basta e evita plugin Babel |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | §4 define campos; uniqueness/cascade ficam no repositório |
| criticality | medium | Modelo de dados de todo o app |
| blast_radius | low | `src/db/` apenas |
| novelty | low | Padrão documentado do realm-js; Jest com Realm já provado |
| irreversibility | none | Nenhum dado real existe |
| state | low | Altera o schema do arquivo `memorizze.realm` |
| integrations | none | Nenhuma |
| auth | none | Nenhuma |
| concurrency | none | Sem escritas concorrentes |
| migrations | low | Arquivos de dev com v1/`[]` precisam abrir em v2 |
| security | none | Nenhuma |
| data_integrity | low | Tipos e obrigatoriedade definidos aqui |

**Declared level**: MEDIUM

## Acceptance Criteria

### P1 — Modelos

- **SCH-01** — `realmConfig.schema` contém `Profile`, `Deck`, `Card` e `ReviewLog`, cada um com `_id: objectId` como chave primária e os campos e tipos de PROJECT-SPEC §4 (`int` para `dailyGoal`, `intervalDays`, `repetitions`, `lapses`, `grade`; `double` para `easeFactor`).
- **SCH-02** — WHEN um objeto é criado sem `_id` ou sem os campos com default THEN recebe um `ObjectId` novo, `Profile.dailyGoal = 20`, `Card.easeFactor = 2.5` e `intervalDays`, `repetitions`, `lapses = 0`.
- **SCH-03** — `Card.dueDate` e `ReviewLog.reviewedAt` são indexados.
- **SCH-04** — `Deck.description` é o único campo opcional. IF um campo obrigatório falta na criação THEN o Realm lança erro e nada é gravado.
- **SCH-05** — Um `Card` adicionado a `deck.cards` é lido de volta pela lista, como instância de `Card`, com os campos legíveis pelas propriedades da classe.
- **SCH-06** — `ReviewLog.cardId` e `deckId` são `objectId` simples (não links): o log continua íntegro após o cartão ser apagado.

### P1 — Configuração

- **SCH-07** — `realmConfig.schemaVersion` é 2. WHEN um arquivo criado com a config anterior (v1, `schema: []`) é aberto com `realmConfig` THEN abre sem erro.

Other dimensions: concurrency, security N/A — banco local de usuário único, sem escritas nesta feature.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| `_id` com default | `() => new BSON.ObjectId()` | Repositórios não precisam gerar id | no |
| `createdAt`/`dueDate` sem default | Obrigatórios, atribuídos pelo repositório | `dueDate` deve igualar `createdAt`; dois `new Date()` divergem | no |
| Arquivos | Um arquivo por modelo em `src/db/schemas/` | Arquitetura §9: `db/` guarda schemas | no |

**Open questions**: none

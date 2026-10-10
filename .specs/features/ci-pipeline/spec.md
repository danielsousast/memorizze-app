# CI Pipeline — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

O repositório não tem CI. PROJECT-SPEC §10 exige que o CI falhe em erro de lint, tipo ou teste, e o marco M0 só fecha com "CI verde". Hoje nada impede um push que quebre o gate ou derrube a cobertura de `domain/`.

## Scope

### In scope

- Workflow do GitHub Actions com lint, typecheck e testes.
- Gate de cobertura ≥ 90% em `src/domain/` (PROJECT-SPEC §10).
- Atualizar `README.md` e `.specs/PROJECT.md` (remover "No CI workflow exists yet").

### Out of scope

| Item | Reason |
| --- | --- |
| Build EAS, deploy, `eas update` | Efeito externo e segredos; o MVP é portfólio local |
| Testes E2E / device farm | Fora do PROJECT-SPEC §10 |
| Dependabot, release, badge de cobertura em serviço externo | Não pedido |
| Corrigir o script `reset-project` e o script `ios` com `yarn` | Drift já registrado, sem relação com CI |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | Comandos do gate já definidos em `.specs/PROJECT.md` |
| criticality | none | Não toca código do app |
| blast_radius | low | 1 arquivo novo + config do Jest; afeta só `npm test -- --coverage` |
| novelty | low | Workflow padrão Node + npm |
| irreversibility | none | Arquivos locais, reversíveis |
| integrations | low | GitHub Actions; só roda após push |
| state | none | Sem estado |
| auth | none | Sem segredos |
| concurrency | none | `concurrency` só cancela runs antigas |
| migrations | none | — |
| security | low | Workflow com `permissions: contents: read` |
| data_integrity | none | — |

**Declared level**: MEDIUM
**Override**: —

## Acceptance Criteria

### P1 — Gate no CI

- **CI-01** — WHEN há push na `main` ou pull request THEN o workflow SHALL rodar `npm ci`, `npx expo lint`, `npx tsc --noEmit` e `npm test`, nessa ordem, em job único no Node 22.
- **CI-02** — IF qualquer um dos três comandos sair com código ≠ 0 THEN o job SHALL falhar.
- **CI-03** — WHEN `src/domain/` tem cobertura de linhas, ramos, funções ou instruções < 90% THEN `npm test` com cobertura SHALL sair com código ≠ 0.
- **CI-04** — WHEN o gate roda localmente (`npm run ci`) THEN SHALL executar os mesmos quatro passos do CI-01 e sair 0 no estado atual do repositório.

### P2 — Higiene

- **CI-05** — WHEN dois runs disputam a mesma ref THEN o mais antigo SHALL ser cancelado (`concurrency`).
- **CI-06** — O workflow SHALL declarar `permissions: contents: read` e não usar segredos.
- **CI-07** — WHEN as dependências não mudaram THEN o cache do npm SHALL ser reutilizado (`setup-node` com `cache: npm`).

## Failure & Edge Behavior

- **CI-08** — IF `npm ci` falha porque `package-lock.json` está fora de sincronia THEN o job SHALL falhar nesse passo, sem rodar os seguintes.
- **CI-09** — Cobertura é medida só em `src/domain/**/*.ts`, excluindo `*.test.ts`; cobertura de telas não entra no gate.

Other dimensions: segurança de supply chain N/A porque só actions oficiais (`actions/*`) em tag major; performance N/A porque o job único roda em poucos minutos.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Plataforma | GitHub Actions | `origin` é `github.com/danielsousast/memorizze-app`; PROJECT-SPEC cita GitHub Actions | sim |
| Job único vs. 3 jobs | Job único | Um `npm ci` só; repo pequeno | não |
| Node | 22 (LTS, igual ao local v22.16) | Compatível com Expo 57 | não |
| Realm roda no Jest em Linux | Sim (binário nativo do Node) | Precisa ser provado no primeiro run remoto | não |

**Open questions**: none

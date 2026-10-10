# CI Pipeline — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Executed

## Approach

Um workflow `.github/workflows/ci.yml` com job único que chama o mesmo script `npm run ci` que o desenvolvedor roda local, para que CI e máquina local nunca divirjam (one fact, one home). O gate de cobertura vive na config do Jest (`coverageThreshold` sobre `src/domain/`), não no YAML. Segue AD-005 sem impacto: não toca `src/`.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| Scripts `lint`, `test` | `package.json` | Chamados pelo novo script `ci` |
| Config Jest | `package.json` (`jest`) | Estendida com `collectCoverageFrom` + `coverageThreshold` |

### Components and interfaces

- **Script `ci`** (`package.json`): `expo lint && tsc --noEmit && jest --coverage`.
- **Config de cobertura** (`package.json`, chave `jest`): `collectCoverageFrom: ["src/domain/**/*.ts", "!src/domain/**/*.test.ts"]`, `coverageThreshold: { "./src/domain/": { statements: 90, branches: 90, functions: 90, lines: 90 } }`. O threshold só vale com `--coverage`, então `npm test` simples segue rápido.
- **Workflow** (`.github/workflows/ci.yml`): gatilhos `push` (main) e `pull_request`; `concurrency` por ref com `cancel-in-progress`; `permissions: contents: read`; passos `actions/checkout@v4`, `actions/setup-node@v4` (`node-version: 22`, `cache: npm`), `npm ci`, `npm run ci`.

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| CI-02 | `&&` interrompe no primeiro erro | Job vermelho no passo que falhou |
| CI-03 | Jest sai ≠ 0 abaixo do threshold | Mensagem "coverage threshold ... not met" |
| CI-08 | `npm ci` aborta | Job vermelho no install |

### Architecture impact

**Architecture impact**: none

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Lint/tsc/jest num único script | `npm run ci` | Paridade local e remota |
| Threshold no Jest, não no YAML | `coverageThreshold` | Falha igual local e remota; sem ferramenta extra |
| Sem upload de cobertura | Só texto no log | Nada externo; fora de escopo |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Cobertura atual de `domain/` < 90% | `src/domain/` | `npm run ci` já nasce vermelho | T1 mede primeiro; se < 90%, abrir amendment ou tarefa de testes antes do threshold |
| Realm/Jest falha em Linux | `src/testing/realm.ts` | Job vermelho só no remoto | Reproduzir via Docker/`act` se disponível; senão validar no primeiro run (exige push, precisa de go-ahead) |
| Lint falha por `ios/` e `android/` ausentes no runner | `eslint.config.js` | Job vermelho | `ios/`/`android/` não são versionados; lint local já roda sem depender deles |

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Config/workflow | Execução do gate + verificação de mutação | SPEC | comandos, sem arquivo de teste novo |

Não há código de app. Os ACs são provados por execução do comando e por mutações do gate (ver T1/T2).

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npm run ci` | após cada tarefa |
| full | `npm run ci` + parse do YAML (`actionlint` se instalado, senão `python3 -c "import yaml…"`) | antes de verify |

## Tasks

### T1 — `npm run ci` roda o gate com cobertura de `domain/`

- **Covers**: CI-03, CI-04, CI-09
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `package.json`
- **Change**: medir a cobertura atual de `src/domain/`; adicionar script `ci`, `collectCoverageFrom` e `coverageThreshold` (90).
- **Tests**:
  - SPEC CI-04 — `npm run ci` sai 0 no repositório atual.
  - SPEC CI-03 — mutação: subir o threshold temporariamente para 100 (ou comentar um teste de `domain/`) → `npm run ci` sai ≠ 0; reverter.
  - SPEC CI-09 — o relatório lista só arquivos de `src/domain/` não-teste.
  - REGRESSION — `npm test` (sem cobertura) segue verde, 448 testes.
- **Done when**: acima passa; se a cobertura medida for < 90%, parar e pedir decisão (amendment).
- **Gate**: quick
- **Status**: [x] done

### T2 — Workflow do GitHub Actions

- **Covers**: CI-01, CI-02, CI-05, CI-06, CI-07, CI-08
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `.github/workflows/ci.yml`
- **Change**: criar o workflow descrito em Design.
- **Tests**:
  - SPEC CI-01 — YAML válido (`actionlint` ou parse), gatilhos `push` em main e `pull_request`, `node-version: 22`, passos `npm ci` e `npm run ci` nessa ordem.
  - SPEC CI-05 — a chave `concurrency` tem `cancel-in-progress: true`.
  - SPEC CI-06 — `permissions` é só `contents: read` e o arquivo não referencia `secrets.`.
  - SPEC CI-07 — `setup-node` tem `cache: npm`.
  - SPEC CI-02 — mutação: um erro de lint injetado faz `npm run ci` sair ≠ 0; reverter.
  - SPEC CI-08 — `npm ci` é um passo próprio anterior a `npm run ci` (falha ali interrompe o job).
- **Done when**: acima passa; full gate verde.
- **Gate**: full
- **Status**: [x] done

### T3 — Documentação

- **Covers**: CI-04
- **Depends on**: T2
- **Risk**: inherit
- **Touches**: `README.md`, `.specs/PROJECT.md`, `.specs/STATE.md`
- **Change**: README ganha seção "Qualidade" com `npm run ci`; PROJECT.md troca a linha "No CI workflow exists yet" por referência ao workflow e acrescenta `npm run ci` na tabela Quality; STATE.md ganha o handoff.
- **Tests**:
  - SPEC CI-04 — o README e o PROJECT.md citam `npm run ci`, e esse comando sai 0.
  - REGRESSION — `validate_state.py ci-pipeline` sai 0.
- **Done when**: acima passa.
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2
- **Wave 3**: T3

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Confirmar o primeiro run verde no GitHub | Exige `git push`, que precisa de go-ahead explícito | Passo final após aprovação |
| Badge de status no README | Só faz sentido depois do primeiro run | M5 (README) |

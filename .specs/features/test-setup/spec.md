# Test Setup — Spec

**Status**: Draft
**Date**: 2026-10-09

## Problem

O projeto não tem runner de testes. PROJECT-SPEC §10 exige testes de domínio, de repositórios com Realm em memória e de telas com Testing Library. Esta feature instala Jest, prova que Realm em memória roda dentro do Jest e deixa o typecheck limpo para o gate.

## Scope

### In scope

- Jest via `jest-expo` e React Native Testing Library.
- Configuração para o Realm usar o binário Node dentro do Jest.
- Helper que abre um Realm em memória isolado por teste.
- Script `npm test`.
- `tsc` sem erros: excluir `example/` (sobra local, já no `.gitignore`).
- `.specs/TESTING.md` com as convenções de teste.

### Out of scope

| Item | Reason |
| --- | --- |
| CI (GitHub Actions) | Item separado do M0 |
| Cobertura mínima de `domain/` | Entra com o M1 |
| Schemas e repositórios | Feature `realm-schemas` |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | none | PROJECT-SPEC §3 e §10 definem Jest + Testing Library + Realm em memória |
| criticality | low | Só ferramenta de desenvolvimento |
| blast_radius | low | `package.json`, `tsconfig.json`, arquivos novos |
| novelty | medium | Primeiro runner; `jest-expo` resolve `@realm/fetch` na variante RN (ESM) e quebra; exige mapeamento |
| irreversibility | none | Revert do commit basta |
| state | none | Realm em memória, arquivos em `os.tmpdir()` |
| integrations | none | Nenhuma |
| auth | none | Nenhuma |
| concurrency | none | Nenhuma |
| migrations | none | Nenhuma |
| security | none | Nenhuma |
| data_integrity | none | Nenhum dado do usuário |

**Declared level**: MEDIUM

## Acceptance Criteria

### P1 — Runner

- **TST-01** — `jest`, `jest-expo`, `@types/jest` e `@testing-library/react-native` estão em `devDependencies` nas versões do `npx expo install`; `npm test` roda `jest` uma vez (sem watch) e sai com código 0.
- **TST-02** — `npx tsc --noEmit` e `npx expo lint` saem com código 0, com tipos do Jest disponíveis nos arquivos de teste.

### P1 — Realm em memória

- **TST-03** — `openTestRealm(schema)` devolve um Realm `inMemory` com o schema pedido; dois Realms abertos pelo helper não compartilham dados.
- **TST-04** — WHEN a suíte com Realm termina THEN o processo do Jest encerra sozinho (sem `--forceExit`) e nenhum arquivo `.realm*` é criado na raiz do projeto.

### P2 — Componentes

- **TST-05** — Um teste com Testing Library renderiza `RealmErrorBoundary` com um filho que lança erro e encontra o texto "Não foi possível abrir o banco de dados." (cobre RLM-06 como regressão).

Other dimensions: N/A — ferramenta local sem dados nem usuários.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Versão do Jest | `~29.7.0` (a que `expo install` resolve para SDK 57) | Compatível com `jest-expo ~57.0.5` | no |
| Nome dos arquivos de teste | `*.test.ts(x)` ao lado do código | Padrão do Jest; `jest-expo` também aceita | no |
| `example/` | Excluído no `tsconfig.json`, não apagado | Está no `.gitignore`; apagar fica a critério do usuário | no |

**Open questions**: none

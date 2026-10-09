# Realm Setup — Spec

**Status**: Implemented (RLM-06 amended)
**Date**: 2026-10-09

## Problem

O app precisa de persistência local (Realm, PROJECT-SPEC §3) antes de qualquer CRUD (M2). Hoje não há dependência, provider nem configuração de banco. Esta feature instala e configura o Realm e prova que ele abre no app, sem criar schemas.

## Scope

### In scope

- Instalar `realm` e `@realm/react` e `expo-dev-client` (Realm tem código nativo; não roda no Expo Go).
- Configuração central do Realm em `src/db/` (nome do arquivo, `schemaVersion`, lista de schemas vazia).
- `RealmProvider` montado no layout raiz.
- Scripts/documentação para rodar em development build.

### Out of scope

| Item | Reason |
| --- | --- |
| Schemas Profile/Deck/Card/ReviewLog | M2; o usuário pediu só instalação e configuração |
| Repositórios e hooks de dados | Dependem dos schemas |
| Jest e testes com Realm em memória | Feature de setup de testes separada (M0) |
| Suporte web | App é mobile-only; Realm não roda na web |
| Migrações | Sem schemas ainda |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | none | Escopo definido pelo usuário |
| criticality | low | Base de todas as features, mas sem comportamento de usuário ainda |
| blast_radius | low | Um arquivo novo em `src/db/` e o `_layout.tsx` |
| novelty | medium | Primeira dependência nativa; exige development build; `realm@20.2.0` só suporta New Architecture e há issue aberta de link iOS no RN ≥ 0.86 (realm-js #7157, afeta `use_frameworks!`) |
| irreversibility | none | Revert do commit basta; nenhum dado existe |
| state | low | Cria o arquivo `.realm` vazio |
| integrations | none | Realm local, sem sync nem rede |
| auth | none | Sem login no app |
| concurrency | none | Sem escritas nesta feature |
| migrations | none | Sem schemas; `schemaVersion: 1` inicial |
| security | none | Nenhuma entrada não confiável; sem criptografia |
| data_integrity | none | Nenhum dado gravado |

**Declared level**: MEDIUM

## Acceptance Criteria

### P1 — Instalação

- **RLM-01** — `package.json` lista `realm`, `@realm/react` e `expo-dev-client` em versões que `npx expo install --check` aceita; `npx expo-doctor` não reporta falha nova.
- **RLM-02** — `npx tsc --noEmit` e `npx expo lint` saem com código 0.

### P1 — Configuração

- **RLM-03** — `src/db/` exporta uma única `realmConfig` com `path: "memorizze.realm"`, `schemaVersion: 1` e `schema: []`.
- **RLM-04** — O layout raiz envolve a árvore em `RealmProvider` usando `realmConfig`; nenhuma tela importa `realm` diretamente.

### P1 — Funcionamento

- **RLM-05** — WHEN o app inicia em development build (iOS), THEN o Realm abre sem erro, o arquivo `memorizze.realm` existe no sandbox do app e a tela inicial renderiza.

## Failure & Edge Behavior

- **RLM-06** — IF o Realm falha ao abrir THEN o app SHALL mostrar um texto simples de erro (via error boundary em volta do `RealmProvider`) e não crashar. O `fallback` do provider cobre apenas o estado "abrindo". *(Conteúdo visual final fica para M2.)*

> **Amendment 1 (2026-10-09)** — O `fallback` do `@realm/react` não captura erros de abertura: o Realm lança durante o render e o app crasharia. Verificado no simulador com `path` inválido. Correção: `RealmErrorBoundary` (`src/db/realm-error-boundary.tsx`).

Other dimensions: concurrency, migrations, security N/A porque não há schemas, dados nem usuários múltiplos.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Versões | `realm@^20.2.0`, `@realm/react@^0.20.0` | `latest` no npm; 20.x é a linha com New Architecture, exigida pelo RN 0.86 | no |
| Criptografia | Não usar | Dados locais não sensíveis (PROJECT-SPEC) | no |
| Plataformas verificadas | iOS simulador | Android verificado se ambiente local permitir; senão registrado como não verificado | no |
| `schema: []` abre um Realm novo | Verificar em RLM-05 | Comportamento a confirmar em runtime; se falhar, amendment | no |

**Open questions**: none

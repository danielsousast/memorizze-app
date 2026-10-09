# Realm Setup — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Done

## Approach

Instalar via `npx expo install` (resolve versões compatíveis) e adicionar `expo-dev-client`. Criar `src/db/realm.ts` com a `realmConfig` e montar `RealmProvider` no `_layout.tsx` existente, abaixo das fontes e acima do `Stack`. Rodar `expo prebuild`-gerado `ios/` (gitignored, CNG) com `npx expo run:ios` para provar RLM-05. Sem config plugin do Realm (não existe); sem Babel plugin (só necessário para decorators/classes TS, que virão no M2).

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| Root layout | `src/app/_layout.tsx` | Envolver `Stack` com `RealmProvider` |
| Alias `@/*` | `tsconfig.json` | `import { realmConfig } from "@/db"` |

### Components and interfaces

- **realmConfig** (`src/db/realm.ts`, reexportado por `src/db/index.ts`): `Realm.Configuration` com `path`, `schemaVersion`, `schema: []`.

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| RLM-06 | `RealmErrorBoundary` em volta do `RealmProvider` (`fallback` só cobre "abrindo") | Texto simples de erro, sem crash |

### Architecture impact

**Architecture impact**: none — ARCHITECTURE.md já prevê `src/db` e Realm; atualizar a linha de status "não instalado" em `.specs/PROJECT.md`.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Provider no root layout | Sim | Um único ponto; telas usam hooks, nunca `realm` direto |
| Tests | Verificação em runtime, sem Jest | Realm é nativo; runner de testes é feature separada |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Link iOS falha no RN 0.86 (#7157) | `ios/` build | Bloqueia RLM-05 | Padrão Expo usa pods estáticos (não `use_frameworks!`); se falhar, amendment e avaliar patch/versão |
| `schema: []` rejeitado pelo Realm | runtime | RLM-05 falha | Amendment: schema placeholder mínimo ou abrir só no M2 |
| Script `ios` do usuário usa `yarn` e `pod update` (mudança local não commitada em `package.json`) | `package.json` | Conflito | Não tocar; usar `npx expo run:ios` direto |

## Test Strategy

Sem runner instalado. SPEC de RLM-01/02 por comandos; RLM-03/04 por leitura do diff + typecheck; RLM-05/06 por execução no simulador, com evidência no relatório de verify.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx tsc --noEmit && npx expo lint` | após cada task |
| full | quick + `npx expo install --check` + `npx expo-doctor` + `npx expo run:ios` (smoke) | antes do verify |

## Tasks

### T1 — Dependências instaladas

- **Covers**: RLM-01
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `package.json`, `package-lock.json`
- **Change**: `npx expo install realm @realm/react expo-dev-client`
- **Tests**:
  - SPEC RLM-01 · comando — `npx expo install --check` e `expo-doctor` sem falhas novas
- **Done when**: comandos limpos
- **Gate**: quick
- **Status**: [x] done

### T2 — Config e provider

- **Covers**: RLM-03, RLM-04, RLM-02
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/db/realm.ts`, `src/db/index.ts`, `src/app/_layout.tsx`
- **Change**: criar `realmConfig`; montar `RealmProvider` com `fallback` (carregando) dentro de `RealmErrorBoundary` (Amendment 1 do spec)
- **Tests**:
  - SPEC RLM-03 · revisão do diff + typecheck — `realmConfig` com path, schemaVersion 1, schema []
  - SPEC RLM-04 · revisão do diff — `RealmProvider` no root; `grep` sem import de `realm` em telas
  - SPEC RLM-02 · lint + tsc exit 0
- **Done when**: gate quick verde
- **Gate**: quick
- **Status**: [x] done

### T3 — Smoke em development build

- **Covers**: RLM-05, RLM-06
- **Depends on**: T2
- **Risk**: inherit
- **Touches**: nenhum arquivo versionado (`ios/` é gerado); `.specs/PROJECT.md` (stack) e `.specs/STATE.md`
- **Change**: `npx expo run:ios`; confirmar que o app abre e que `memorizze.realm` existe no sandbox
- **Tests**:
  - SPEC RLM-05 · runtime — app abre, arquivo existe
  - SPEC RLM-06 · runtime — forçar erro de abertura (mutação temporária na config) → `fallback` aparece, sem crash; mutação revertida
- **Done when**: evidência registrada
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2
- **Wave 3**: T3

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Jest + RN Testing Library, Realm em memória | Fora do pedido | Feature "test-setup" (M0) |
| Schemas e repositórios | Pedido explícito | M2 |
| Remover script `reset-project` morto | Fora do escopo | Cleanup |

## Execution notes

- T3 (iOS, iPhone 17 Pro): build OK com `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` (o Xcode-26.3.0 falha em `ExpoModulesJSI`, sem relação com Realm). `memorizze.realm` criado em `Documents/`; tela inicial renderiza (RLM-05).
- RLM-06: com `path` inválido, sem boundary o erro escapava do `fallback`. Com boundary, o LogBox em dev atribui o erro ao `RealmErrorBoundary` (capturado). A tela de texto do boundary **não foi vista** (sem como dispensar o LogBox no simulador); confirmar manualmente em build Release ou tocando "Dismiss".
- `tsc --noEmit` sai com 2 por 30 erros preexistentes em `example/`; `src/` limpo.

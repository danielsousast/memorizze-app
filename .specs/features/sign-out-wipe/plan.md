# Sign Out and Wipe — Plan

**Spec**: [spec.md](spec.md)
**Risk**: HIGH (from spec)
**Status**: Done

## Approach

`ProfileRepository` ganha `dataCounts()` e `wipe()` (`realm.deleteAll()` numa transação). `useDataCounts` lê as contagens; `useSignOut` apaga e invalida todo o cache, e o perfil vazio leva à Boas-vindas pelo `Stack.Protected` (AD-004). `useProfileScreen` controla o diálogo e o toast; `ProfileScreen` só renderiza. Conforma AD-001, AD-002, AD-005, AD-006 e AD-007.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `ConfirmDialog`, `useToast`, `Icon` | `src/components/` | Diálogo, aviso de erro, ícone |
| `RootStack` | `src/navigation/root-stack.tsx` | Volta à Boas-vindas sem navegação manual |
| `plural` | `src/domain/text.ts` | Contagens na mensagem |

### Components and interfaces

- **Repository** (`features/profile/repository.ts`): `dataCounts(): { decks, cards }`, `wipe(): void`.
- **Hooks** (`usecases/`): `useDataCounts` (query `profileKeys.counts`), `useSignOut` (mutation, `invalidateQueries()` no sucesso).
- **Domain** (`labels.ts`): `signOutMessage(decks, cards)`.
- **Tela** (`use-profile-screen.ts`, `profile-screen.tsx`): `signOutOpen`, `requestSignOut`, `cancelSignOut`, `confirmSignOut` (fecha o diálogo antes de apagar, pois o `Modal` cobre o toast); botão e nota.
- **Testes**: `ToastProvider` entra em `renderRouterWithProviders`.

### Error handling

| Failure (AC) | Handling | User sees |
| --- | --- | --- |
| SOUT-04 | `onError` mostra toast; transação não aplica nada | Toast, dados intactos |

### Architecture impact

**Architecture impact**: none

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Limpar cache | `invalidateQueries()` geral | O perfil refaz a leitura e a guarda do AD-004 troca a pilha |

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Apagar cada modelo por `objects().delete` | Mais código e fácil esquecer um modelo novo; `deleteAll` cobre tudo |
| `queryClient.clear()` | Remove queries com observadores ativos; `invalidateQueries()` deixa o perfil refazer a leitura |
| Navegar à Boas-vindas à mão | Duplica a guarda do AD-004 |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Apagar sem confirmar | `profile-screen.tsx` | Perda de dados | SOUT-01/05 e mutação `onPress` trocado detectada |
| Wipe parcial | `repository.ts` | Dados inconsistentes | `deleteAll` numa `realm.write`; SOUT-04 |

## Test Strategy

Repositório (SOUT-02..04), domínio (SOUT-02), fluxo completo pelo `RootStack` (SOUT-01..05). Mutações: `deleteAll` trocado, cache não invalidado, `onError` removido, diálogo não fechado, botão ligado ao confirmar (todas detectadas).

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest src/features/profile src/navigation src/domain && npx tsc --noEmit` | after each task |
| full | `npm run ci` | after the last task |

## Tasks

### T1 — Repositório, hooks e rótulo

- **Covers**: SOUT-02, SOUT-03, SOUT-04
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/features/profile/{interfaces.ts,repository.ts,repository.test.ts,index.ts}`, `src/features/profile/usecases/{keys.ts,use-data-counts.ts,use-sign-out.ts}`, `src/domain/{labels.ts,labels.test.ts}`
- **Change**: `dataCounts`, `wipe`, dois hooks, `signOutMessage`.
- **Tests**:
  - SPEC SOUT-02 · repository, domain — contagens e plural
  - SPEC SOUT-03 · repository — `wipe` zera os quatro modelos
  - SPEC SOUT-04 · repository — falha deixa os dados
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Botão, diálogo e fluxo

- **Covers**: SOUT-01, SOUT-02, SOUT-03, SOUT-04, SOUT-05
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/{use-profile-screen.ts,profile-screen.tsx}`, `src/testing/router.tsx`, `src/navigation/root-stack.test.tsx`
- **Change**: estado do diálogo, botão, nota, toast.
- **Tests**:
  - SPEC SOUT-01, SOUT-02 · screen — diálogo com contagens reais
  - SPEC SOUT-05 · screen — cancelar mantém tudo
  - SPEC SOUT-03 · screen — confirmar apaga e mostra Boas-vindas
  - SPEC SOUT-04 · screen — falha: toast, diálogo fechado, dados intactos
- **Done when**: tests above pass; `npm run ci` green; lint limpo
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Atalho "Fazer backup antes" | Depende da F6 | F6 |
| Apagar preferências e tema | Feito: moram no `Profile`, o wipe as apaga e `useApplyTheme` devolve o tema ao sistema (settings-and-preferences, THM-05) | F5 (feito) |

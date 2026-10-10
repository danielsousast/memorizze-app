# Study Onboarding and Exit — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Done

## Approach

`Profile` ganha `studyTutorialSeen` (schema 3, default `false`), exposto por `Profile`/`ProfileInput` e gravado por `useUpdateProfile`. `useStudySession` lê `useProfile`, controla `tutorialOpen` e `exitOpen` e devolve os handlers. `SessionView` renderiza `HowToAnswerSheet` (novo, em `study/screens/`) e `ConfirmDialog`. Conforma AD-001, AD-002, AD-005, AD-006 e AD-007.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `ConfirmDialog` | `src/components/confirm-dialog.tsx` | Saída da sessão |
| `Button`, `Icon`, tokens | `src/components/`, `src/theme/` | Folha |
| `useProfile`, `useUpdateProfile` | `@/features/profile` | Ler e gravar a flag |
| `gradeLabel` | `src/domain/schedule.ts` | Rótulos dos graus |

### Components and interfaces

- **Profile** (`src/db/schemas/profile.ts`): `studyTutorialSeen: { type: "bool", default: false }`; `realmConfig.schemaVersion = 3`.
- **Profile / ProfileInput / toProfile** (`features/profile`): campo `studyTutorialSeen`; `repository.update` grava quando definido.
- **HowToAnswerSheet** (`study/screens/how-to-answer-sheet.tsx`): `{ visible, onDismiss }`; `Modal` slide no estilo de `BottomSheet`; só renderiza. Linhas vêm de `howToAnswerRows` (constante em `src/domain/` ou no arquivo, 4 itens `{ grade, text }`).
- **useStudySession**: adiciona `tutorialOpen` (`profile && !profile.studyTutorialSeen && !dismissed && card !== undefined`), `dismissTutorial` (marca `dismissed`, chama `update({ studyTutorialSeen: true })`, ignora erro), `exitOpen`, `requestExit`, `cancelExit`, `leave` (fecha e `router.back()`). O `BackHandler` chama `requestExit` e fica inativo com a folha aberta (a folha trata o voltar).
- **SessionView**: renderiza a folha e o `ConfirmDialog`; `Alert` e `confirmExit` saem.

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| ONB-05 | `mutate` sem `onError`; `dismissed` local já fecha a folha | Nada |

### Architecture impact

**Architecture impact**: none

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Estado "fechada" | `dismissed` local além da flag | Folha fecha na hora, sem esperar o Realm nem depender do sucesso (ONB-05) |
| Esperar o perfil | `profile === undefined` não mostra a folha | Evita piscar antes da leitura |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Dois `Modal` (folha e diálogo) | `SessionView` | Sobreposição | ONB-06: voltar com folha aberta só fecha a folha; o fechar da tela fica coberto pelo `Modal` |
| Testes `study-*` ganham a folha | `study-*.test.tsx` | Folha cobre o cartão e quebra testes | `seed` cria o `Profile` com `studyTutorialSeen: true`; só o teste novo usa `false` |
| Perfil ausente no Realm de teste | `study-*.test.tsx` | Sem perfil, sem folha | ONB-03 cobre; comportamento seguro |

## Test Strategy

Repositório: `update` grava a flag, perfil novo vem `false`. Telas: `renderRouterWithProviders` com Realm em memória; `study-onboarding.test.tsx` novo; `study-exit.test.tsx` migra de `Alert` para `ConfirmDialog`. Mutações a checar no fim: condição `!seen` invertida, `dismiss` sem gravar, `Sair` sem `router.back`, listener ativo com folha aberta, default do schema `true`.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest src/features/profile src/features/study src/db && npx tsc --noEmit` | after each task |
| full | `npm run ci` | after the last task |

## Tasks

### T1 — Flag `studyTutorialSeen` no Profile

- **Covers**: ONB-04
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/db/schemas/profile.ts`, `src/db/realm.ts`, `src/db/realm.test.ts`, `src/features/profile/{interfaces.ts,adapters.ts,repository.ts,repository.test.ts}`
- **Change**: propriedade, `schemaVersion` 3, campo no tipo, no adapter e no `update`.
- **Tests**:
  - SPEC ONB-04 · realm — `schemaVersion` é 3; perfil criado sem a flag lê `false`
  - SPEC ONB-04 · repository — `update({ studyTutorialSeen: true })` grava e devolve `true`; `update({ name })` não altera a flag
  - REGRESSION · repository — testes de perfil existentes verdes
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Sair da sessão com ConfirmDialog

- **Covers**: EXT-01, EXT-02, EXT-03, EXT-04
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/features/study/screens/{use-study-session.ts,session-view.tsx,study-exit.test.tsx}`
- **Change**: troca `Alert.alert` por estado `exitOpen` + `ConfirmDialog`; migra os testes EXT-01..03.
- **Tests**:
  - SPEC EXT-01 · screen — fechar → título, mensagem, `Sair`, `Continuar`
  - SPEC EXT-02 · screen — `Continuar` mantém cartão e `VERSO`; `Sair` volta ao Baralho com 1 `ReviewLog` e sem Resumo
  - SPEC EXT-03 · screen — handler do `BackHandler` devolve `true` e abre o diálogo; `remove` ao desmontar; sem listener no Resumo
  - SPEC EXT-04 · screen — com o diálogo aberto o `ReviewLog` não muda ao tocar fora
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Folha "Como responder" na primeira sessão

- **Covers**: ONB-01, ONB-02, ONB-08, ONB-03, ONB-05, ONB-06, ONB-07
- **Depends on**: T1, T2
- **Risk**: inherit
- **Touches**: `src/features/study/screens/{how-to-answer-sheet.tsx,use-study-session.ts,session-view.tsx,study-onboarding.test.tsx}` e `seed` dos `study-*.test.tsx` (perfil com flag `true`)
- **Change**: folha, estado e gravação da flag.
- **Tests**:
  - SPEC ONB-01 · screen — perfil `false` → todos os textos da folha sobre o cartão 1
  - SPEC ONB-02 · screen — `Entendi, vamos lá` fecha a folha e mantém o cartão
  - SPEC ONB-08 · screen — após fechar, o `Profile` tem `true` e reabrir a sessão não mostra a folha
  - SPEC ONB-08 · screen — voltar do Android (`onRequestClose`) e fundo também fecham e gravam
  - SPEC ONB-03 · screen — perfil `true` não mostra; sessão vazia não mostra; Resumo não mostra
  - SPEC ONB-05 · screen — `update` falha → folha fecha, flag segue `false`
  - SPEC ONB-06 · screen — folha aberta: handler de voltar não abre o diálogo
  - SPEC ONB-07 · screen — botão com role, label e `minHeight` ≥ 44; título com role `header`
  - REGRESSION · screen — suítes `study-*` verdes
- **Done when**: tests above pass; `npm run ci` green; lint limpo
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1 ∥ T2 (arquivos disjuntos)
- **Wave 2**: T3

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Rever a folha em Ajustes | Fora do design | F5 |
| Checar 5a/5b/6/8 contra o design | Visual, no dispositivo | UAT / F9 |

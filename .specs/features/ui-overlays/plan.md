# UI Overlays — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Done

## Approach

Três componentes em `src/components/`, um arquivo por componente, só com tokens do tema (como `Button` e `Fab`). `BottomSheet` e `ConfirmDialog` usam `Modal` do React Native com fundo escurecido; `ToastProvider` guarda o toast atual em estado, agenda o fechamento com `setTimeout` de 4000 ms e expõe `useToast`. Sem dependência nova. A lógica de tempo e de substituição fica no hook `useToastState` ao lado do provider, e os componentes só renderizam (AD-005). Conforma AD-003 (UI compartilhada em `src/components/`).

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `Button` | `src/components/button.tsx` | Ganha a variante `destructive`; Cancelar e Confirmar usam `Button` |
| `Icon` | `src/components/icon.tsx` | Ganha `trash` e `sign-out`; `check` já existe |
| Tokens | `src/theme/` | `radii`, `sizes`, `spacing`, `typography`, `useTheme` |
| `renderRouterWithProviders` / `render` | `src/testing/` | Testes de componente com Testing Library |

### Components and interfaces

- **ConfirmDialog** (`src/components/confirm-dialog.tsx`): `{ visible, title, message, confirmLabel, cancelLabel?="Cancelar", icon, tone?: "destructive" | "neutral", onConfirm, onCancel }`. Raio 28, ícone num quadrado de 56 pt com fundo `grade.again.background` no tom destrutivo.
- **BottomSheet** (`src/components/bottom-sheet.tsx`): `{ visible, title, subtitle?, actions: SheetAction[], onClose }` com `SheetAction = { label, subtitle?, icon?, destructive?, onPress }`. Raio 28 no topo, alça, grupo de ações em `surface2`, botão Cancelar.
- **Toast** (`src/components/toast.tsx`): visual do aviso `{ message, action? }`, mínimo 56 pt, raio 18, fundo `#17151F`.
- **ToastProvider / useToast** (`src/components/toast-provider.tsx`): `show({ message, action? })`, `hide()`. Lança `useToast must be used inside ToastProvider` fora do provider.
- **useToastState** (`src/components/use-toast-state.ts`): estado do toast atual e o `setTimeout` de 4000 ms; limpa no desmonte e ao fechar.
- **Button** (`src/components/button.tsx`): variante `destructive`.

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| OVL-14 | `useToast` lança no contexto ausente | Erro claro em desenvolvimento |
| OVL-16, OVL-17 | `clearTimeout` ao fechar e no desmonte | Nenhum fechamento duplo nem vazamento de timer |

### Architecture impact

**Architecture impact**: none

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Modal | `Modal` do RN (`transparent`, `animationType="fade"` no diálogo e `"slide"` na folha) | Cumpre o back do Android (`onRequestClose`) sem biblioteca; um gesto de arrastar fica fora do escopo |
| Toast | Provider global, um toast por vez | O app só mostra um aviso por ação (Componentes 2) |
| Testes com timer | `jest.useFakeTimers()` | OVL-11, OVL-13, OVL-16 e OVL-17 dependem de 4000 ms |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| `Modal` e Jest: o conteúdo só aparece se `visible` | `confirm-dialog.tsx`, `bottom-sheet.tsx` | Falso negativo no teste | OVL-05 cobre `visible=false`; os testes renderizam com `visible` |
| `Modal` do RN cobre o toast | `toast-provider.tsx` | Toast sob uma folha aberta | A ação da folha fecha a folha antes de chamar `show`; documentado no comentário do provider |
| Safe area do toast | `toast-provider.tsx` | Toast sob a barra de gestos | Usa `useSafeAreaInsets` se `react-native-safe-area-context` já estiver instalado (Expo Router o traz) |

## Test Strategy

Testes de componente com Testing Library (`await render`) ao lado de cada arquivo, como os de `Badge` e `Button`. Timers falsos para o toast. O `ToastProvider` é testado com um componente de teste que chama `useToast`.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest src/components && npx tsc --noEmit` | after each task |
| full | `npm run ci` | after each wave, before verify |

## Tasks

### T1 — Confirmar uma ação destrutiva num diálogo

- **Covers**: OVL-01, OVL-02, OVL-03, OVL-04, OVL-05, OVL-15
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/components/confirm-dialog.tsx`, `src/components/confirm-dialog.test.tsx`, `src/components/button.tsx`, `src/components/button.test.tsx`, `src/components/icon.tsx`
- **Change**: `ConfirmDialog` novo; `Button` ganha `destructive`; `Icon` ganha `trash` e `sign-out`.
- **Tests**:
  - SPEC OVL-01 · component — `visible` → título, mensagem, "Excluir baralho" e "Cancelar" na tela
  - SPEC OVL-02 · component — toque em confirmar → `onConfirm` chamado 1 vez, `onCancel` 0
  - SPEC OVL-03 · component — toque em "Cancelar" e `onRequestClose` do Modal → `onCancel` chamado, `onConfirm` 0
  - SPEC OVL-04 · component — `tone="destructive"` → botão com fundo `grade.again.text`; sem a prop → `accent`
  - SPEC OVL-05 · component — `visible={false}` → título ausente
  - SPEC OVL-15 · component — `Button variant="destructive"` → fundo `grade.again.text`, texto `onAccent`
  - REGRESSION · component — as quatro variantes antigas mantêm as cores (`button.test.tsx` existente)
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Escolher uma ação numa folha inferior

- **Covers**: OVL-06, OVL-07, OVL-08, OVL-09
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/components/bottom-sheet.tsx`, `src/components/bottom-sheet.test.tsx`
- **Change**: `BottomSheet` novo, com `Button` para Cancelar e linhas de ação com ícone e subtítulo.
- **Tests**:
  - SPEC OVL-06 · component — três ações → título, subtítulo, rótulos na ordem e "Cancelar"
  - SPEC OVL-07 · component — toque numa ação → seu `onPress` 1 vez e `onClose` 1 vez
  - SPEC OVL-08 · component — "Cancelar" e `onRequestClose` → `onClose` 1 vez, nenhum `onPress`
  - SPEC OVL-09 · component — ação `destructive` → texto `grade.again.text`; ação com `subtitle` → texto abaixo do rótulo
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Avisar com um toast que some sozinho e aceita ação

- **Covers**: OVL-10, OVL-11, OVL-12, OVL-13, OVL-14, OVL-16, OVL-17, OVL-19
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/components/toast.tsx`, `src/components/toast-provider.tsx`, `src/components/use-toast-state.ts`, `src/components/toast-provider.test.tsx`, `src/app/_layout.tsx`
- **Change**: `Toast`, `ToastProvider`, `useToast` e `useToastState`; o provider é montado no layout raiz dentro do `QueryClientProvider`.
- **Tests**:
  - SPEC OVL-10 · component — `show({ message: "Cartão salvo" })` → texto na tela e ícone de check
  - SPEC OVL-11 · component — após `show`, avançar 3999 ms → visível; 4000 ms → ausente
  - SPEC OVL-12 · component — `show` com ação "Desfazer", toque → `onPress` 1 vez e toast ausente
  - SPEC OVL-13 · component — dois `show` com 3000 ms entre eles → só a segunda mensagem; ainda visível 3999 ms depois do segundo
  - SPEC OVL-14 · component — `useToast` sem provider → erro `useToast must be used inside ToastProvider`
  - SPEC OVL-16 · component — fechar pela ação e avançar 4000 ms → nenhum timer pendente (`jest.getTimerCount() === 0`)
  - SPEC OVL-17 · component — desmontar com toast visível → `jest.getTimerCount() === 0`
  - SPEC OVL-19 · component — toast com `accessibilityRole="alert"` e `accessibilityLiveRegion="polite"`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T4 — Acessibilidade e toque mínimo nos três componentes

- **Covers**: OVL-18
- **Depends on**: T2, T3
- **Risk**: inherit
- **Touches**: `src/components/confirm-dialog.test.tsx`, `src/components/bottom-sheet.test.tsx`, `src/components/toast-provider.test.tsx`
- **Change**: ajustes de `accessibilityRole`, `accessibilityLabel` e `minHeight: sizes.minTouch` que os testes de acessibilidade exigirem.
- **Tests**:
  - SPEC OVL-18 · component — cada botão do diálogo, da folha e da ação do toast: `getByRole("button", { name })` encontra e o `minHeight` do estilo é ≥ 44
- **Done when**: tests above pass; `npm run ci` green
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2 ∥ T3
- **Wave 3**: T4

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Trocar `Alert.alert` por `BottomSheet` e `ConfirmDialog` | Cada tela pertence a uma feature | F2, F3, F4, F7 |
| Gesto de arrastar para fechar a folha | Fora do design e do escopo | Nunca, a menos que peçam |

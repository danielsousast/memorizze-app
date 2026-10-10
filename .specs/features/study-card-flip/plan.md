# Study card flip — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Draft

## Approach

Novo componente `FlipCard` em `src/components/flip-card.tsx`. Recebe `flipped`, `front`, `back` e `style`. Mantém um estado `shown` (face visível). Em `flipped` false→true, anima `rotateY` 0→90 (150 ms) com Reanimated, troca `shown` por `setTimeout` de 150 ms e anima 90→0. Em qualquer outra mudança de `flipped`, ou com `useReducedMotion()`, define `shown` direto e zera a rotação. `session-view.tsx` troca o `Pressable` do cartão pelo `FlipCard`; os textos e o layout de cada face não mudam. Conforme AD-003 (UI compartilhada em `src/components/`).

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| Estilos do cartão e faces | `src/features/study/screens/session-view.tsx` | Mantidos; só movem para dentro de `FlipCard` como `front`/`back` |
| `react-native-reanimated` 4.5.1 | `package.json` | `useSharedValue`, `useAnimatedStyle`, `withSequence`, `withTiming`, `useReducedMotion` |

### Components and interfaces

- **FlipCard** (`src/components/flip-card.tsx`): `{ flipped: boolean; front: ReactNode; back: ReactNode; onPress; disabled; testID; accessibilityLabel; style }`. Aplica `transform: [{ perspective: 1000 }, { rotateY }]`.

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| FLP-05 / FLP-07 | `flipped` volta a false: cancela o timer, zera a rotação, `shown = false` | Frente do próximo cartão, sem rotação |

### Architecture impact

**Architecture impact**: none

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Component | unit | SPEC | `src/components/flip-card.test.tsx` |
| Screen | integration | REGRESSION | `src/features/study/screens/*.test.tsx` |

Testes usam `jest.useFakeTimers()` para avançar os 150 ms; `useReducedMotion` é mockado para FLP-06.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest src/components/flip-card.test.tsx src/features/study && npx tsc --noEmit` | after each task |
| full | `npm test && npx expo lint && npx tsc --noEmit` | before verify |

## Tasks

### T1 — Cartão gira ao revelar o verso

- **Covers**: FLP-01, FLP-02, FLP-04, FLP-05, FLP-06, FLP-07
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/components/flip-card.tsx`, `src/components/flip-card.test.tsx`
- **Change**: componente `FlipCard` com a troca de face em duas fases
- **Tests**:
  - SPEC FLP-01 · unit — `flipped` false→true dispara a rotação 0→90→0 (estilo animado com `rotateY` em graus); duração total 300 ms
  - SPEC FLP-02 · unit — `flipped` false→true: antes de 150 ms ainda mostra a frente; depois mostra o verso
  - SPEC FLP-05 · unit — `flipped` true→false: mostra a frente na hora
  - SPEC FLP-06 · unit — movimento reduzido: verso na hora
  - SPEC FLP-07 · unit — true→false com o timer pendente: sem troca tardia para o verso
  - SPEC FLP-04 · unit — `disabled` bloqueia `onPress`
- **Done when**: testes passam; quick gate verde
- **Gate**: quick
- **Status**: [ ] pending

### T2 — Sessão usa o flip

- **Covers**: FLP-03, FLP-05
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/features/study/screens/session-view.tsx`, testes de `src/features/study/screens/`
- **Change**: `session-view.tsx` renderiza o cartão com `FlipCard`; os botões de nota continuam ligados a `revealed`
- **Tests**:
  - SPEC FLP-03 · screen — logo após o toque, os botões de nota existem; o verso aparece após 150 ms
  - SPEC FLP-05 · screen — próximo cartão (ANS-04) e falha de gravação (ANS-08) sem flip: frente / verso imediatos
  - REGRESSION · screen — suítes `study-*.test.tsx` atualizadas para aguardar a troca de face
- **Done when**: testes passam; full gate verde
- **Gate**: full
- **Status**: [ ] pending

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| UAT visual do flip em dispositivo | Animação só se avalia no aparelho | Junto do UAT pendente de study-session |

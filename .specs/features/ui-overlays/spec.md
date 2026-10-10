# UI Overlays — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

Os designs novos (`design/Componentes 2 — claro.png`, 3c, 3d, 7b, 5c) usam folha inferior, diálogo de confirmação e toast. Hoje o app só tem `Alert.alert` nativo, que não segue o visual nem permite ação no aviso ("Desfazer", "Compartilhar"). As features F2–F7 dependem desses três componentes, então eles vêm primeiro e sozinhos.

## Scope

### In scope

- `BottomSheet`: folha inferior com alça, título, subtítulo opcional, grupo de ações e botão Cancelar.
- `ConfirmDialog`: diálogo com ícone, título, texto, botão de confirmar e Cancelar; tom destrutivo ou neutro.
- `Toast` com `ToastProvider` e hook `useToast`: aviso com texto, ícone de check e ação opcional.
- Variante `destructive` (fundo vermelho sólido) no `Button`.
- Ícones `trash` e `sign-out` no `Icon`.
- `ToastProvider` montado em `src/app/_layout.tsx`.

### Out of scope

| Item | Reason |
| --- | --- |
| Trocar os `Alert.alert` existentes | Cada troca pertence à sua feature (F2, F3, F4, F7) |
| `Switch`, `SegmentedControl`, `SettingsRow` | Só a F5 usa; entram lá |
| Gestos de arrastar a folha | Fechar por Cancelar, toque no fundo e botão voltar do Android basta |
| Fila de vários toasts | Um toast por vez; o novo substitui o atual |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | Os designs definem medidas e textos; falta só o comportamento de fechar |
| criticality | none | Camada visual, sem dados |
| blast_radius | low | 0 call sites hoje; 6 features futuras vão consumir a API |
| novelty | low | Padrão novo no repo (provider global), sem dependência nova: usa `Modal` e `Animated` do React Native |
| irreversibility | none | Nada persiste |
| integrations | none | Sem rede nem módulo nativo novo |
| state | low | Estado do toast vive num provider em memória |
| auth | none | N/A |
| concurrency | none | Um único toast por vez |
| migrations | none | Sem schema |
| security | none | N/A |
| data_integrity | none | N/A |

**Declared level**: MEDIUM
**Override**: nenhum; declarado acima do nível calculado (LOW) porque a API é compartilhada por seis features.

## Acceptance Criteria

### P1 — Confirmação destrutiva

- **OVL-01** — O `ConfirmDialog` visível mostra o ícone, o título, a mensagem, o botão de confirmar e o botão "Cancelar".
- **OVL-02** — WHEN o usuário toca no botão de confirmar THEN o sistema SHALL chamar `onConfirm` uma vez.
- **OVL-03** — WHEN o usuário toca em "Cancelar", no fundo escurecido ou aciona o botão voltar do Android THEN o sistema SHALL chamar `onCancel` uma vez e não chamar `onConfirm`.
- **OVL-04** — WHERE `tone="destructive"` o botão de confirmar usa o fundo `colors.grade.again.text` com texto `colors.onAccent`; sem a prop usa o fundo `colors.accent`.
- **OVL-05** — Com `visible={false}` o `ConfirmDialog` não renderiza o conteúdo.

### P1 — Folha inferior

- **OVL-06** — O `BottomSheet` visível mostra o título, o subtítulo quando informado, cada ação na ordem recebida e o botão "Cancelar".
- **OVL-07** — WHEN o usuário toca numa ação THEN o sistema SHALL chamar o `onPress` dela uma vez e `onClose` uma vez.
- **OVL-08** — WHEN o usuário toca em "Cancelar", no fundo escurecido ou aciona o botão voltar do Android THEN o sistema SHALL chamar `onClose` uma vez e nenhum `onPress` de ação.
- **OVL-09** — Uma ação com `destructive: true` usa o texto `colors.grade.again.text`; uma ação com `subtitle` mostra esse texto abaixo do rótulo.

### P1 — Toast

- **OVL-10** — WHEN `show({ message })` é chamado THEN o sistema SHALL exibir a mensagem com o ícone de check.
- **OVL-11** — O toast some sozinho 4000 ms depois de aparecer.
- **OVL-12** — WHERE `show` recebe `action: { label, onPress }` o toast mostra o botão com `label`; ao tocá-lo o sistema chama `onPress` uma vez e fecha o toast.
- **OVL-13** — WHEN `show` é chamado com um toast já visível THEN o sistema SHALL substituir a mensagem e reiniciar a contagem de 4000 ms.
- **OVL-14** — IF `useToast` é usado fora de `ToastProvider` THEN o sistema SHALL lançar o erro `useToast must be used inside ToastProvider`.

### P2 — Variante e ícones

- **OVL-15** — `Button variant="destructive"` usa o fundo `colors.grade.again.text` e o texto `colors.onAccent`; as outras quatro variantes ficam iguais.

## Failure & Edge Behavior

- **OVL-16** — WHEN o toast é fechado pelo botão de ação THEN o sistema SHALL cancelar o temporizador de 4000 ms (nenhum `onPress` extra nem fechamento duplo).
- **OVL-17** — WHEN o `ToastProvider` é desmontado com um toast visível THEN o sistema SHALL cancelar o temporizador.

Other dimensions: validação de entrada N/A porque os componentes só recebem props tipadas; idempotência N/A porque toque duplo chama os callbacks e o consumidor decide; acessibilidade tratada nos ACs abaixo.

### Acessibilidade

- **OVL-18** — Todo botão dos três componentes tem `accessibilityRole="button"` e `accessibilityLabel` igual ao texto visível, com área de toque de pelo menos 44 pt (`sizes.minTouch`).
- **OVL-19** — O toast tem `accessibilityRole="alert"` e `accessibilityLiveRegion="polite"`.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Implementação | `Modal` do RN para folha e diálogo; toast como `View` absoluta no provider | Sem dependência nativa nova; funciona em Expo Go e dev client | no |
| Animação | Só a do `Modal` (`fade` no diálogo, `slide` na folha); o toast aparece sem animação; sem gesto de arrastar | Mantém o escopo pequeno; fácil de testar | no |
| Posição do toast | 16 pt das bordas laterais, acima da área segura inferior | Medida de `Componentes 2` | no |
| Cores do toast | Fundo `#17151F` e ação `darkColors.accentInk`, nos dois temas | O toast é escuro também no tema claro (Componentes 2); `accentInk` claro teria pouco contraste sobre ele | no |

**Open questions**: none

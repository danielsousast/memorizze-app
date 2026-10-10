# Study card flip — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

Na sessão de estudo, tocar o cartão troca a frente pelo verso de forma instantânea. Um flip animado dá a sensação de virar o cartão e marca a revelação da resposta. Amenda SES-04 (study-session) só na forma de transição; o conteúdo de cada face não muda.

## Scope

### In scope

- Animação de flip (rotação em Y) do cartão ao revelar o verso, na sessão de estudo.

### Out of scope

| Item | Reason |
| --- | --- |
| Animar a troca para o próximo cartão | Fora do pedido; ANS-04 segue instantâneo |
| Flip de volta (verso → frente) | O verso é terminal até a resposta |
| Gesto de deslizar para virar | Fora do pedido |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | Duração e estilo escolhidos como padrão (ver Assumptions) |
| criticality | none | Só apresentação |
| blast_radius | low | 1 arquivo de tela (`session-view.tsx`), 1 componente novo; 3 suítes de teste tocam o cartão |
| novelty | medium | Primeiro uso de `react-native-reanimated` em `src/` |
| irreversibility | none | Sem dados |
| integrations | none | — |
| state | low | Um estado local novo (face exibida) |
| auth | none | — |
| concurrency | low | Toque durante a animação (ver FLP-04) |
| migrations | none | — |
| security | none | — |
| data_integrity | none | A gravação da resposta não muda |

**Declared level**: MEDIUM

## Acceptance Criteria

### P1 — Flip ao revelar

- **FLP-01** — WHEN o usuário toca o cartão ou `Mostrar resposta` THEN o cartão SHALL girar em Y 0°→90°, trocar a face e girar 90°→0°, em 300 ms no total (150 ms por metade).
- **FLP-02** — A face de frente permanece até 90°; só então o conteúdo do verso (SES-04) é exibido.
- **FLP-03** — Os botões `Como foi lembrar?` e de nota (SES-06) aparecem junto com o início do flip e já aceitam toque; a animação não bloqueia a resposta.

### P1 — Casos de borda

- **FLP-04** — WHILE o flip está em andamento, toques extras no cartão SHALL ser ignorados (o cartão já está `disabled` quando revelado).
- **FLP-05** — WHEN o próximo cartão aparece (ANS-04) ou a gravação falha (ANS-08) THEN a face SHALL aparecer sem animação: frente no próximo cartão, verso mantido na falha.
- **FLP-06** — IF o sistema pede movimento reduzido THEN a troca SHALL ser instantânea, sem rotação.
- **FLP-07** — Se o usuário responder antes do fim do flip, o próximo cartão SHALL aparecer com a frente visível e sem rotação residual.

Other dimensions: acessibilidade coberta por FLP-06; rótulo `Virar cartão` e demais textos inalterados.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Estilo | Rotação em Y em duas fases, com perspectiva | Evita montar duas faces ao mesmo tempo (testes e leitores de tela veem uma face) | no |
| Duração | 300 ms | Padrão de flip de flashcard | no |

**Open questions**: none

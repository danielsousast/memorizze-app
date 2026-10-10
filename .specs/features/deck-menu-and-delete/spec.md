# Deck Menu and Delete — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

O menu "..." do Baralho e a exclusão ainda usam `Alert.alert`, que AD-007 aposenta. Os designs 3c e 3d pedem folha e diálogo próprios, a ação "Redefinir progresso" e um toast após excluir.

## Scope

### In scope

- Menu 3c em `BottomSheet`: Adicionar cartão, Redefinir progresso, Excluir baralho.
- Exclusão 3d em `ConfirmDialog`; toast "Baralho excluído" ao voltar ao Início.
- Redefinir progresso: método de repositório e hook `useResetDeckProgress`.
- Botão "Editar baralho" no cabeçalho, ao lado do "...".

### Out of scope

| Item | Reason |
| --- | --- |
| Desfazer a exclusão | Decisão 2: sem "Desfazer"; o diálogo 3d já avisa |
| Apagar `ReviewLog` ao redefinir | Decisão 5: histórico e estatísticas ficam |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | Designs 3c/3d e decisões 2, 3, 5 fechadas |
| criticality | low | App local, sem dinheiro nem auth |
| blast_radius | low | Só `decks` e a tela do Baralho |
| novelty | low | Mesmos `BottomSheet`, `ConfirmDialog`, toast (AD-007) |
| irreversibility | low | Redefinir perde só o agendamento (conteúdo e `ReviewLog` ficam); exclusão já existia com confirmação |
| integrations | none | N/A |
| state | low | Estado local de dois overlays |
| auth | none | N/A |
| concurrency | none | Usuário único |
| migrations | none | Sem mudança de schema |
| security | none | N/A |
| data_integrity | low | Escrita numa transação; `ReviewLog` intacto |

**Declared level**: MEDIUM
**Override**: none

## Acceptance Criteria

### P1 — Menu do baralho

- **MENU-01** — WHEN o usuário toca em `Opções do baralho` THEN o app SHALL abrir o `BottomSheet` com título igual ao nome do baralho, subtítulo `N cartões · M para hoje` (só `N cartões` se `M` é 0) e as ações `Adicionar cartão` (ícone `plus`), `Redefinir progresso` (subtítulo `Todos os cartões voltam a ser novos`) e `Excluir baralho` (destrutivo, ícone `trash`).
- **MENU-02** — `Adicionar cartão` fecha a folha e abre `decks/[deckId]/cards/new`.
- **MENU-03** — WHEN o usuário toca em `Editar baralho` no cabeçalho (label de acessibilidade igual) THEN o app SHALL abrir `decks/[deckId]/edit`. O alerta antigo de opções deixa de existir.

### P1 — Redefinir progresso

- **RST-01** — WHEN o usuário toca em `Redefinir progresso` THEN o app SHALL fechar a folha e redefinir todos os cartões do baralho: `easeFactor` 2.5, `intervalDays` 0, `repetitions` 0, `lapses` 0 e `dueDate` agora. Os `ReviewLog` não mudam. `front`, `back` e `createdAt` não mudam.
- **RST-02** — WHEN a redefinição conclui THEN o app SHALL atualizar o cache de cartões e baralhos (contagem "para hoje" e estágios refletem o novo estado) e mostrar o toast `Progresso redefinido`.
- **RST-03** — Um baralho sem cartões redefine sem erro.

### P1 — Excluir baralho

- **DEL-01** — WHEN o usuário toca em `Excluir baralho` no menu THEN a folha SHALL fechar e o `ConfirmDialog` destrutivo abrir com ícone `trash`, título `Excluir baralho?`, mensagem `“<nome>” e seus N cartões serão apagados deste aparelho. Não dá para desfazer.` (`e seu único cartão` com 1; `“<nome>” será apagado deste aparelho. Não dá para desfazer.` com 0), botões `Excluir baralho` e `Cancelar`.
- **DEL-02** — `Cancelar` fecha o diálogo sem alterar dados.
- **DEL-03** — WHEN o usuário confirma THEN o baralho e seus cartões SHALL ser excluídos, o app volta ao Início e mostra o toast `Baralho excluído`.

## Failure & Edge Behavior

- **MENU-04** — IF redefinir falha THEN o app SHALL mostrar o toast `Não foi possível redefinir o progresso` e manter os dados.
- **DEL-04** — IF excluir falha THEN o diálogo fecha, a tela segue no Baralho e o toast `Não foi possível excluir o baralho` aparece.
- **MENU-05** — O botão `Editar baralho` e as linhas da folha têm role `button` e altura ≥ 44 pt.

Other dimensions: input bounds N/A; idempotency: redefinir duas vezes dá o mesmo estado; auth N/A porque perfil local; concurrency N/A porque usuário único; observability N/A porque app offline; data lifecycle: exclusão já em cascata (`deck-card-crud`).

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Sem "Desfazer" no toast | Sim | Decisão 2 | yes |
| Editar no cabeçalho | Ícone ao lado do "..." | Decisão 3 | yes |
| `ReviewLog` ficam | Sim | Decisão 5 | yes |
| Ícone de editar | Novo `pencil` em `Icon` | Não há ícone de edição hoje | no |
| Redefinir pede confirmação | Não; só o menu e o subtítulo avisam | Design 3c não mostra diálogo | no |

**Open questions**: none

## Amendments

None.

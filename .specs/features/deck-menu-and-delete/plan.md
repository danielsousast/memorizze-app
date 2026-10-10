# Deck Menu and Delete — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Done

## Approach

`DeckRepository` ganha `resetProgress(id)` (uma transação que zera o agendamento dos cartões); `useResetDeckProgress` a chama e invalida decks e cards. `useDeckScreen` troca os dois `Alert` por estado `menuOpen`/`deleteOpen`, usa `useToast` e devolve handlers; `DeckDetail` renderiza `BottomSheet` e `ConfirmDialog`. Conforma AD-001, AD-002, AD-005, AD-006 e AD-007 (a ação da folha fecha a folha antes do toast ou do diálogo).

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `BottomSheet`, `ConfirmDialog`, `useToast` | `src/components/` | Menu, exclusão, avisos |
| `useDeleteDeck`, `deleteDeckMessage` | `features/decks` | Exclusão; mensagem do diálogo muda de texto |
| `Card` schema defaults | `src/db/schemas/card.ts` | Valores da redefinição (2.5, 0, 0, 0) |

### Components and interfaces

- **DeckRepository.resetProgress(id)**: `existing(id)`, depois uma `realm.write` que percorre `deck.cards` e define `easeFactor 2.5`, `intervalDays 0`, `repetitions 0`, `lapses 0`, `dueDate now()`. Lança `DECK_NOT_FOUND` se ausente.
- **useResetDeckProgress** (`usecases/use-reset-deck-progress.ts`): mutação; `onSuccess` invalida `deckKeys.all` e `["cards"]`.
- **deckMessages**: `deleteDeckMessage(name, count)` devolve o texto completo de DEL-01; `deckSheetSubtitle(cardCount, dueCount)`.
- **Icon**: novo `pencil` (`pencil` / `edit`) e `reset` (`arrow.counterclockwise` / `restart_alt`).
- **useDeckScreen**: `menuOpen`, `openMenu`, `closeMenu`, `deleteOpen`, `cancelDelete`, `confirmDelete`, `sheetActions` (memo), `editDeck` (ação da folha), `reset`. Falhas mostram toast (MENU-04, DEL-04); sucesso de exclusão chama `goHome` e depois o toast.
- **DeckDetail**: `BottomSheet` (com `Editar baralho`), `ConfirmDialog` (`tone="destructive"`, ícone `trash`).

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| MENU-04 | `onError` → toast | `Não foi possível redefinir o progresso` |
| DEL-04 | `onError` → fecha diálogo, toast | `Não foi possível excluir o baralho` |

### Architecture impact

**Architecture impact**: none

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Reset em um método de repositório | Transação única em `resetProgress` | AD-001; atomicidade |
| Toast da exclusão | Mostrado após `goHome` no `onSuccess` | O toast vive acima do app (AD-007), sobrevive à navegação |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Testes do `Alert` em `deck-screen.test.tsx` | linhas ~235–330 | Quebram | T3 e T4 os migram |
| Toast coberto por `Modal` | folha/diálogo | Aviso invisível | Fechar overlay antes do `show` |
| Testes sem `ToastProvider` | helper de teste | `useToast` lança | Conferir se `renderRouterWithProviders` o inclui (profile já usa) |

## Test Strategy

Repositório com Realm em memória: reset zera só agendamento e preserva `ReviewLog`. Telas com `renderRouterWithProviders`. Mutações finais: `dueDate` não atualizada, `ReviewLog` apagado, `Cancelar` excluindo, toast de erro ausente, mensagem de contagem 1/0 trocada.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest src/features/decks src/components && npx tsc --noEmit` | after each task |
| full | `npm run ci` | after the last task |

## Tasks

### T1 — Repositório e hook de redefinição

- **Covers**: RST-01, RST-02, RST-03
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/features/decks/{interfaces.ts,repository.ts,repository.test.ts,index.ts,usecases/use-reset-deck-progress.ts,usecases/decks.test.tsx}`
- **Change**: `resetProgress` e `useResetDeckProgress` (exportado no barrel).
- **Tests**:
  - SPEC RST-01 · repository — cartão estudado volta a 2.5/0/0/0 e `dueDate` ≈ agora; `front`, `back`, `createdAt` e `ReviewLog` intactos; cartões de outro baralho intactos
  - SPEC RST-02 · hook — após a mutação, `useDecks` mostra `dueCount` novo
  - SPEC RST-03 · repository — baralho vazio não lança; id ausente lança `DECK_NOT_FOUND`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Ícones e mensagens

- **Covers**: MENU-01, DEL-01
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/components/{icon.tsx,icon.test.tsx}`, `src/features/decks/screens/{deck-messages.ts,deck-messages.test.ts}`
- **Change**: ícones `pencil` e `reset`; `deleteDeckMessage(name, count)` e `deckSheetSubtitle`.
- **Tests**:
  - SPEC DEL-01 · unit — mensagem para 0, 1 e N cartões, com o nome entre aspas curvas
  - SPEC MENU-01 · unit — subtítulo com e sem "para hoje"
  - REGRESSION · icon — todos os ícones têm mapeamento ios/android/web
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Menu do baralho e redefinição na tela

- **Covers**: MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, RST-01, RST-02
- **Depends on**: T1, T2
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/{use-deck-screen.ts,deck-screen.tsx,deck-screen.test.tsx}`
- **Change**: `BottomSheet` no lugar do `Alert` de opções; redefinição com toast; migra os testes do menu.
- **Tests**:
  - SPEC MENU-01 · screen — "..." abre a folha com título, subtítulo, três ações e Cancelar
  - SPEC MENU-02 · screen — `Adicionar cartão` navega para `cards/new`
  - SPEC MENU-03 · screen — `Editar baralho` na folha navega para `edit`; sem botão de editar no cabeçalho; `Alert.alert` nunca é chamado
  - SPEC RST-01 · screen — `Redefinir progresso` zera os cartões e mantém `ReviewLog`
  - SPEC RST-02 · screen — após redefinir, o toast `Progresso redefinido` aparece e a contagem "para hoje" atualiza
  - SPEC MENU-04 · screen — falha injetada mostra o toast de erro e mantém os dados
  - SPEC MENU-05 · screen — roles e `minHeight` ≥ 44
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T4 — Exclusão com ConfirmDialog e toast

- **Covers**: DEL-01, DEL-02, DEL-03, DEL-04
- **Depends on**: T3
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/{use-deck-screen.ts,deck-screen.tsx,deck-screen.test.tsx}`
- **Change**: `ConfirmDialog` destrutivo no lugar do `Alert`; toast `Baralho excluído`; migra os testes de exclusão.
- **Tests**:
  - SPEC DEL-01 · screen — `Excluir baralho` no menu fecha a folha e abre o diálogo com ícone, título, mensagem e botões
  - SPEC DEL-02 · screen — `Cancelar` fecha e mantém baralho e cartões
  - SPEC DEL-03 · screen — confirmar exclui, volta ao Início e mostra `Baralho excluído`
  - SPEC DEL-04 · screen — falha injetada fecha o diálogo, mantém a tela e mostra o toast de erro
  - REGRESSION · screen — suítes de `decks` verdes
- **Done when**: tests above pass; `npm run ci` green; lint limpo
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1 ∥ T2 (arquivos disjuntos)
- **Wave 2**: T3
- **Wave 3**: T4

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Confirmar antes de redefinir | Design 3c não mostra diálogo | Reavaliar no UAT |

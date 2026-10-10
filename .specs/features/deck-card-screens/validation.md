# Deck & Card Screens — Validation

**Verdict**: PASS
**Risk**: HIGH (from spec)
**Verifier**: independent sub-agent (round 2, fresh full verification)
**Diff range**: `7d3038a..eac5c01`
**Date**: 2026-10-10

## Gate

- **Command**: full gate (plan.md → Verification Commands): `npm test && npx tsc --noEmit && npx expo lint`
- **Result**: 179 passed, 0 failed, 0 skipped @ `eac5c01` (27 suites; tsc exit 0; expo lint exit 0)
- **Test count**: 60 → 179 (11 → 27 suites)
- **Skips**: none
- Completion: plan.md has 13 task Status lines (T1-T10, F1-F3), all `[x] done`; A-01 is `approved`, no amendment `proposed`.

## Acceptance Criteria Evidence

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| DAT-01 | endOfLocalDay = 23:59:59.999 local | `src/domain/dates.test.ts:8` — `toEqual(end)` for 00:00; `:9` same instant; `:13` 31/12 | SPEC | ✅ |
| DAT-02 | due iff dueDate <= end of day | `src/domain/dates.test.ts:29` — `isDue(23:59:59.999, now)` true; `:33` next 00:00 false; `:37` overdue true | SPEC | ✅ |
| STG-01 | (0,30) Novo; (1,20) Aprendendo; (3,21) Maduro | `src/domain/stage.test.ts:5,9,13` — `toBe("new"/"learning"/"mature")`; `:19` labels | SPEC | ✅ |
| DUE-01 | list and by-id dueCount = due cards at read time | `src/features/decks/repository.test.ts:73-75` — `list().map(dueCount)` `[2,0]`, `getById(id).dueCount` 2, empty 0 | SPEC | ✅ |
| DUE-02 | dueCount reflects create/delete without remount | `src/features/cards/usecases/cards.test.tsx:103` — `dueCount` `toBe(2)` after create; `:110` `toBe(1)` after delete | SPEC | ✅ |
| HOME-01 | `Sexta-feira, 9 de outubro` + `Olá` | `src/domain/dates.test.ts:57` — `toBe("Sexta-feira, 9 de outubro")`; `src/features/decks/screens/home-screen.test.tsx:56-61` | SPEC | ✅ |
| HOME-02 | `N baralhos` and one item per deck in DCK-02 order | `home-screen.test.tsx:70` — `toEqual(["Inglês","Física"])`; `:63-77` plural/singular section count | SPEC | ✅ |
| HOME-03 | initials, 1-line name, `N cartões` | `home-screen.test.tsx:81-89` (initials, `numberOfLines` 1, `1 cartão`) | SPEC | ✅ |
| HOME-04 | `N hoje` / `Em dia` / none | `home-screen.test.tsx:105` — `queryAllByText(/hoje$\|^Em dia$/)` `toHaveLength(2)`; `:91-107` texts | SPEC | ✅ |
| HOME-05 | tap opens the deck | `home-screen.test.tsx:113` — `toHavePathname(/decks/${deck.id})` | SPEC | ✅ |
| HOME-06 | empty state, text, button, no FAB | `home-screen.test.tsx:119` title, `:120-124` design body text (closed since round 1), `:125` no `Criar baralho`, `:127` `/decks/new` | SPEC | ✅ |
| HOME-07 | FAB `Criar baralho` opens create form | `home-screen.test.tsx:135` — `toHavePathname("/decks/new")`; `:136` empty state gone | SPEC | ✅ |
| INI-01 | 5 listed examples | `src/domain/text.test.ts:4-11` — `it.each` IN/JA/É/RE/#, `initials(name)` `toBe(expected)` | SPEC | ✅ |
| DECK-01 | back, `Opções do baralho`, name, description | `src/features/decks/screens/deck-screen.test.tsx:77-85`; `:92` back goes to `/`; `:100` no description element | SPEC | ✅ |
| DECK-02 | `N cartões`, `N para hoje`, `N maduros` | `deck-screen.test.tsx:104-114`; `:122-123` badges absent | SPEC | ✅ |
| DECK-03 | newest first, joined lines, stage badge | `deck-screen.test.tsx:135` — `toEqual(["c3","c2","c1"])`; `:140` `["Novo","Aprendendo","Maduro"]` | SPEC | ✅ |
| DECK-04 | search by front/back, case/accent-insensitive, trim | `deck-screen.test.tsx:153,155,157,159`; `src/domain/text.test.ts:36,40,44` | SPEC | ✅ |
| DECK-05 | `Nenhum cartão encontrado` | `deck-screen.test.tsx:163-169` | SPEC | ✅ |
| DECK-06 | `Nenhum cartão ainda`, no search | `deck-screen.test.tsx:286` — `queryByLabelText("Buscar cartões")` `toBeNull()` | SPEC | ✅ |
| DECK-07 | FAB `Adicionar cartão` opens create | `deck-screen.test.tsx:177` — `toHavePathname(/decks/${deck.id}/cards/new)` | SPEC | ✅ |
| DECK-08 | tap card opens edit | `deck-screen.test.tsx:186` — `toHavePathname(/cards/${card.id}/edit)` | SPEC | ✅ |
| DECK-09 | menu: Editar/Excluir/Cancelar; edit opens form | `deck-screen.test.tsx:225-228` — button texts, cancel style, `/decks/${id}/edit` | SPEC | ✅ |
| DECK-10 | confirmation title/message/buttons; confirm deletes and goes home; cancel no change (A-01) | `deck-screen.test.tsx:243-248` (2/1/0 messages, buttons, destructive), `:261-264` deleted+home+no not-found, `:276-278` cancel | SPEC | ✅ |
| DECK-11 | invalid or unknown id: not found + `Voltar ao início` | `deck-screen.test.tsx:290-295` — `it.each(["xyz","64b7..."])`, `:293-295` | SPEC | ✅ |
| DFM-01 | create title, fields, Cancelar, Salvar; description trim | `src/features/decks/screens/deck-form-screen.test.tsx:48-54`; `:88-103` whitespace-only description absent, `" texto "` stored `"texto"` (`:102`) | SPEC | ✅ |
| DFM-02 | save closes form, opens new deck | `deck-form-screen.test.tsx:62` name trimmed, `:64` `/decks/${id}`, `:67` back goes to `/` | SPEC | ✅ |
| DFM-03 | edit prefilled; save; empty description removes; return to deck | `deck-form-screen.test.tsx:81,83`; `:106-122` whitespace-only removes and trim on edit (`:121`) | SPEC | ✅ |
| DFM-04 | Cancelar closes without saving | `deck-form-screen.test.tsx:129-130` — `toHavePathname("/")`, `realm.objects(Deck)` `toHaveLength(0)` (back gesture = UAT) | SPEC | ✅ |
| DFM-05 | EMPTY/DUPLICATE messages, values kept, no close | `deck-form-screen.test.tsx:139,143,146-147` | SPEC | ✅ |
| DFM-06 | Salvar disabled while pending; double tap saves one | `src/features/decks/screens/deck-form-screen.test.tsx:181` `toBeDisabled`; `:162` `write` `toHaveBeenCalledTimes(1)`, `:165` mutation cache `toHaveLength(1)`, `:166` no duplicate error. Round-1 gap closed: mutation M1 (busy-ref guard removed) now FAILS the test (see Discrimination) | SPEC | ✅ |
| DFM-07 | `Baralho não encontrado` + `Voltar` | `deck-form-screen.test.tsx:190-191` | SPEC | ✅ |
| EDT-01 | create editor contents | `src/features/cards/screens/card-editor-screen.test.tsx:67-78` (title, multiline `:71`, tip `:75`, buttons `:77`, no delete `:78`) | SPEC | ✅ |
| EDT-02 | save returns to deck, card on top, `Novo` | `card-editor-screen.test.tsx:87,89` | SPEC | ✅ |
| EDT-03 | stays open, empty, focus on Frente | `card-editor-screen.test.tsx:101-103` — path kept, `Frente`/`Verso` values `""` (focus is UAT-only) | SPEC | ✅ |
| EDT-04 | edit title, prefilled, no `Salvar e criar outro`, delete; text saved; schedule unchanged | `card-editor-screen.test.tsx:281-284,289-290`; `:425` scheduling `toEqual(expected)` | SPEC | ✅ |
| EDT-05 | `Excluir cartão?` + Cancelar/Excluir; confirm removes and closes | `card-editor-screen.test.tsx:300-301,309-312`; `:324-325` cancel | SPEC | ✅ |
| EDT-06 | Cancelar no write; line breaks stored | `card-editor-screen.test.tsx:112,121` — `back` `toBe("a\nb")` (gesture = UAT) | SPEC | ✅ |
| EDT-07 | messages under fields; text kept; no close | `card-editor-screen.test.tsx:130-139` | SPEC | ✅ |
| EDT-08 | Salvar, Salvar e criar outro, Excluir disabled while pending | `card-editor-screen.test.tsx:154-155` (create), `:355-356` (edit/delete), `:172` two presses same act = one card | SPEC | ✅ |
| EDT-09 | `Cartão`/`Baralho não encontrado` + `Voltar` | `card-editor-screen.test.tsx:183-184`, `:398-399` | SPEC | ✅ |
| A11Y-01 | every tappable: role, label, >= 44pt | Screen-level: `deck-screen.test.tsx:347-357` over card row, `Início`, `Opções do baralho`, `Adicionar cartão` — `accessibilityRole` `toBe("button")`, `accessibilityLabel` `toBeTruthy()`, height `toBeGreaterThanOrEqual(44)`; `:359` row label `"to forget, esquecer verbo"`. Component level: `button.test.tsx:10-11`, `fab.test.tsx:11-13`, `text-field.test.tsx:10-11`, `not-found.test.tsx:11`. Round-1 gap closed: mutants M3 (row label removed), M6 (back minHeight removed), M7 (more minHeight 20) all killed. Home deck item role/label via A11Y-02 `home-screen.test.tsx:147`; its 44pt size is not asserted at screen level (minor, G1); real-layout 44pt is UAT-only | SPEC | ✅ |
| A11Y-02 | `<nome>, N cartões, N para hoje` / `, em dia` | `home-screen.test.tsx:147` — `findByLabelText("Inglês, 1 cartão, em dia")`; `:140-150` | SPEC | ✅ |
| THM-01 | dark background = `darkColors.background` | `home-screen.test.tsx:156`, `deck-screen.test.tsx:369`, `src/components/screen.test.tsx:27` | SPEC | ✅ |
| PERF-01 | 1000 cards render < 100 rows | `deck-screen.test.tsx:313` — `expect(rows).toBeLessThan(100)` | SPEC | ✅ |
| ERR-01 | generic error message; does not close | `deck-form-screen.test.tsx:203`; `card-editor-screen.test.tsx:196-198` (create); `:369-371` (edit-mode save, closes round-1 gap) | SPEC | ✅ |
| LOAD-01 | no empty state while loading | `home-screen.test.tsx:166`; `deck-screen.test.tsx:321-322,331` | SPEC | ✅ |
| INV-01 | scheduling fields untouched | `card-editor-screen.test.tsx:425,435` — 20 random edits, `scheduling()` `toEqual(expected)` on the 5 fields | INVARIANT | ✅ |
| INV-02 | isDue/endOfLocalDay agree with DAT-02 | `src/domain/dates.test.ts:50` — `isDue(due, n)` `toBe(key(due) <= key(n))` over 1000 random pairs | INVARIANT | ✅ |

**Count**: 52 ACs/invariants in spec (50 ACs + INV-01, INV-02) all with evidence ✅; 0 without evidence (the "busy" row above is a note, not an AC).

**UAT-only portions** (⚠️ UAT, orchestrator runs these): EDT-03 focus on `Frente`; DFM-04 and EDT-06 back gesture; DFM-01 autofocus; modal presentation (`_layout.tsx`); native Alert and action sheet look (DECK-09/DECK-10/EDT-05); keyboard avoidance; visual match with `design/`; A11Y-01 real-layout 44pt on rows, links and the home deck item.

## Invariants

| Invariant | Evidence (`file:line`) | Breaking mutation attempted | Result |
| --- | --- | --- | --- |
| INV-01 | `src/features/cards/screens/card-editor-screen.test.tsx:425,435` | Round 1 M9 (extra `dueDate` in update) was inert because the repository drops unknown fields; not repeated | ✅ held (test strong; no screen path writes scheduling) |
| INV-02 | `src/domain/dates.test.ts:50` | `<=` to `<` in `isDue` (M4) | ✅ killed |

## Discrimination

Scratch worktree `verify-scratch-2` at HEAD, `node_modules` symlinked, each mutant reverted with `git checkout` before the next.

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| M1 | `src/features/decks/screens/deck-form-screen.tsx:63` | removed `if (busy.current) return;` | ✅ DFM-06 double press (1 failed) |
| M2 | `deck-form-screen.tsx:67` | `description.trim()` to `description` | ✅ DFM-01/DFM-03 trim (2 failed) |
| M3 | `src/features/decks/screens/deck-screen.tsx:152` | removed `accessibilityLabel` on the card row | ✅ A11Y-01 (1 failed) |
| M4 | `src/domain/dates.ts:31` | `<=` to `<` in `isDue` | ✅ DAT-02/INV-02 (1 failed) |
| M5 | `deck-screen.tsx:65` | removed `.reverse()` on the card list | ✅ DECK-03/DECK-04 (2 failed) |
| M6 | `deck-screen.tsx:181` | removed `minHeight: sizes.minTouch` from `back` (Início link) | ✅ A11Y-01 |
| M7 | `deck-screen.tsx:183` | `more` button `minHeight: sizes.minTouch` to `20` | ✅ A11Y-01 |
| M8 | `src/features/cards/screens/card-editor-screen.tsx:306` | `Excluir cartão` `disabled={props.pending}` to `false` | ✅ EDT-08 (1 failed) |
| M9 | `src/domain/text.ts` | removed `.trim()` from `searchKey` | ✅ text.test/DECK-04 (3 failed) |
| M10 | `src/features/decks/screens/home-screen.tsx:44` | `dueCount > 0` to `>= 0` for the badge | ✅ HOME-04 (1 failed) |
| M11 | `home-screen.tsx:21` | a11y label `dueCount > 0` to `>= 0` | ✅ A11Y-02 (1 failed) |

**Result**: 11 injected · 11 killed · 0 survived (round-1 survivors M5 busy guard and M7 trim now killed; round-1 inert/equivalent M4/M9 not repeated)
**Isolation**: scratch worktree `verify-scratch-2` removed and branch deleted; real-tree `git status --porcelain` showed only the untracked `validation.md` (as at start); `git worktree list` shows only the main tree.

## Amendments Reconciled

| Amendment | AC text | Code | Test |
| --- | --- | --- | --- |
| A-01 | ✅ (DECK-10 tagged *(A-01)*) | ✅ `src/features/decks/screens/deck-screen.tsx:42-46` | `src/features/decks/screens/deck-screen.test.tsx:243-248` (it.each at `:232` covers 2/1/0 messages) |

## Adversarial Review

Not required at HIGH.

## UAT

Run by the user on a development build (2026-10-10), after the close: "testei e está ok". Result: PASS, no issues reported. The user did not itemize the checks, so the list below records what was in scope, not per-item results: focus on `Frente` (EDT-03), `Nome` autofocus (DFM-01), back gesture on the modals, modal presentation, native `Alert` look, keyboard avoidance, 44pt in real layout, visual match with `design/`.

## Change Review

- Scope matches spec In scope: ✅ (routes, screens, `dates`/`stage`/`text` domain, `dueCount`, `src/components/`, test helper `src/testing/router.tsx`, matcher type shim).
- Round-2 delta (`56f3d00..eac5c01`): one source line (`deck-screen.tsx:152` card-row `accessibilityLabel`, serves A11Y-01); everything else is tests (+150 lines, 1 deleted line = the import extended with `StyleSheet`) and `plan.md` fix tasks. No tests removed or weakened; the only deleted test line is the import edit.
- Earlier weakening check: `repository.test.ts` DCK-02 now calls `createDeckRepository(realm, () => t0).list()` (mandated by the `now` parameter, assertions unchanged).
- No debug leftovers, TODOs, secrets or disabled tests (`.skip`/`.only`/`xit` not present in diff).
- Extras not in the spec: `Não foi possível excluir. Tente de novo.` (`card-editor-screen.tsx`; KNOWN accepted, now tested at `card-editor-screen.test.tsx:386`); deck-menu `Alert` title is the deck name (`deck-screen.tsx`); the card row label `<frente>, <verso>` is an unspecified wording of the A11Y-01 label (accepted); `testID`s used by tests; `src/testing/expo-router-matchers.d.ts` (type shim); hand-written `formatLongDate`; `.specs/PROJECT.md` and `TESTING.md` doc edits.
- Tests anchored and necessary: ✅.

## Gaps & Fix Tasks

No blocking gaps. Residual, non-blocking:

1. G1 (minor) — A11Y-01 — the home deck item's 44pt size is not asserted at screen level (role/label are, via A11Y-02). Real-layout 44pt is UAT anyway. No fix required.
2. G2 (cosmetic) — DECK-02 — `1 maduros` is literal per spec; spec-precision note (the `N maduros` pattern has no singular).
3. G3 (info) — the A11Y-01 height check relies on style `minHeight` plus `hitSlop` (no layout engine); the real rendered size is UAT-only.

## Sign-off

**Human sign-off**: n/a (HIGH)

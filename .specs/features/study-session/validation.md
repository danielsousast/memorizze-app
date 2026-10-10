# Sessão de estudo — Validation

**Verdict**: PASS
**Risk**: HIGH (from spec)
**Verifier**: independent sub-agent
**Diff range**: `6aa22ea..577dfc1`
**Date**: 2026-10-10

## Gate

- **Command**: full gate (`npm test && npx tsc --noEmit && npx expo lint`)
- **Result**: 283 passed, 0 failed, 0 skipped @ `577dfc1` (37 suites); tsc exit 0; expo lint exit 0. Three consecutive serial `npm test` runs green.
- **Domain coverage**: `src/domain/**` 95.52% stmts, 100% branch, 95.83% funcs (≥ 90%). Only uncovered file is `errors.ts` (class constructor, lines 5-7); schedule, session, streak, dates, stage and text are 100%.
- **Test count**: baseline not recorded → 283
- **Skips**: none
- **Observation (non-blocking)**: under CPU contention (several concurrent jest processes) 1 to 9 UI tests failed, including ANS-06 and SUM-05 timeouts, and one lone `jest src/features/study` run showed 1 failure that did not reproduce in five reruns. Serial runs are stable. The `overlapping act() calls` console.error noise appears in the full run. Watch for flakiness (see Gaps, G2).

## Acceptance Criteria Evidence

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| SRS-01 | Errei: rep 0, int 0, EF −0.20, lapses +1 | `src/domain/schedule.test.ts:35` — `toMatchObject({repetitions:0,intervalDays:0,easeFactor:1.3,lapses:3})` | SPEC | ✅ |
| SRS-02 | Difícil: rep+1, int max(1, round(int×1.2)), EF −0.15 | `src/domain/schedule.test.ts:30` (SRS-08 row `3,10,2.00 → 4,12,1.85`; row `0,0 → 1,1,2.35`) | SPEC | ✅ |
| SRS-03 | Bom: int 1 / 3 / round(int×EF), EF unchanged | `src/domain/schedule.test.ts:30` — rows `0,0→1,1,2.5`, `1,1→2,3,2.5`, `2,3→3,8,2.5` | SPEC | ✅ |
| SRS-04 | Fácil: round(Bom×1.3), EF +0.15 | `src/domain/schedule.test.ts:30` — rows `0,0→1,1,2.65`, `1,1→2,4,2.65`, `2,3→3,10,2.65` | SPEC | ✅ |
| SRS-05 | EF floor 1.3, 2 decimals | `src/domain/schedule.test.ts:43` (floor, exact `toBe`) and row `4,20,1.30 → 0,0,1.30` | SPEC | ✅ |
| SRS-06 | Difícil/Bom/Fácil keep lapses | `src/domain/schedule.test.ts:50` — `expect(...lapses).toBe(5)` | SPEC | ✅ |
| SRS-07 | dueDate = local midnight + days | `src/domain/schedule.test.ts:55` — `toEqual(new Date(2026, 9, 11))`; also 31/12 → 1/1 at :57 | SPEC | ✅ |
| SRS-08 | 10-row table | `src/domain/schedule.test.ts:30` — `expect(run(...)).toEqual([r,i,e])` (10 rows) | SPEC | ✅ |
| LBL-01 | agora / 1 dia / n dias | `src/domain/schedule.test.ts:63` — `toEqual(["agora","1 dia","2 dias","142 dias"])` | SPEC | ✅ |
| STK-01 | A day counts with ≥ 1 review (local date) | `src/domain/streak.test.ts:16` — `currentStreak([day(9,0,0)], now)).toBe(1)` | SPEC | ✅ |
| STK-02 | Streak ends today or yesterday, else 0 | `src/domain/streak.test.ts:8-12` — 3 / 2 / 0 / 1 / 0 | SPEC | ✅ |
| STK-03 | Same day counts once; 23:59 + 00:01 count two | `src/domain/streak.test.ts:22-23` — `toBe(1)`, `toBe(2)` | SPEC | ✅ |
| ENT-01 | `Estudar · N cartões` / `Estudar` | `src/features/decks/screens/deck-screen.test.tsx:421` and `:428` — `findByRole("button",{name: label})` | SPEC | ✅ |
| ENT-02 | `Estudar tudo` with badge; no badge at 0; none without decks | `src/features/decks/screens/home-screen.test.tsx:183-218` — `getByText("5 cartões")`, `"1 cartão"`, `queryByText(...)` null, `queryByRole` null | SPEC | ✅ |
| ENT-03 | Buttons open deck session / `/study` | `src/features/decks/screens/home-screen.test.tsx:218` — `toHavePathname("/study")`; deck-screen.test.tsx:432 (deck session path) | SPEC | ✅ |
| QUE-01 | Due ≤ end of day, dueDate then createdAt | `src/features/study/repository.test.ts:57` — `toEqual(["tie-early","tie-late","today"])` | SPEC | ✅ |
| QUE-02 | Queue is a snapshot | `src/features/study/screens/study-answer.test.tsx:125-126` — card created mid-session absent, `1 cartão revisto` | SPEC | ✅ |
| QUE-03 | Empty queue → Nada para revisar | `src/features/study/screens/study-empty.test.tsx:51` — `findByText("Nada para revisar hoje")` | SPEC | ✅ |
| SES-01 | Close button, progress bar, `k de N` | `src/features/study/screens/study-session.test.tsx:70-72` — `"1 de 3"`, `accessibilityValue {now:0,max:3}`, `Sair da sessão` | SPEC | ✅ |
| SES-02 | Deck name of the current card | `src/features/study/screens/study-session.test.tsx:82` — `findByText("Deck A")` | SPEC | ✅ |
| SES-03 | Front: FRENTE, text, hint, button | `src/features/study/screens/study-session.test.tsx:90-94` | SPEC | ✅ |
| SES-04 | Tap card or button reveals back | `src/features/study/screens/study-session.test.tsx:103-111` — `VERSO`, `Como foi lembrar?` | SPEC | ✅ |
| SES-05 | Buttons carry interval labels | `src/features/study/screens/study-session.test.tsx:120` — `toEqual(["Errei, agora","Difícil, 1 dia","Bom, 1 dia","Fácil, 1 dia"])`; :128 for an existing card | SPEC | ✅ |
| SES-06 | No answer buttons with front visible | `src/features/study/screens/study-session.test.tsx:138` — `queryByRole(...)` null | SPEC | ✅ |
| ANS-01 | Card + ReviewLog in one transaction with cardId, deckId, grade, reviewedAt | `src/features/study/repository.test.ts:127-135` — rep/int/EF, dueDate, 1 log with cardId/deckId/grade/reviewedAt; `study-answer.test.tsx:50-53` | SPEC | ✅ |
| ANS-02 | Errei → end of queue, completed unchanged | `src/domain/session.test.ts:15-17` — `queue [b, a']`, `completed 0`; `study-answer.test.tsx:63` — `"1 de 2"` | SPEC | ✅ |
| ANS-03 | Other grades remove card, completed +1 | `src/domain/session.test.ts:22-27` — `completed 1`, queue `[b]` | SPEC | ✅ |
| ANS-04 | Next card shows front | `src/features/study/screens/study-answer.test.tsx:78-79` — `FRENTE`, no `VERSO` | SPEC | ✅ |
| ANS-05 | Summary replaces session; back does not reopen | `src/features/study/screens/study-summary.test.tsx:108-112` — back handler removed, pathname deck, no summary | SPEC | ✅ |
| ANS-06 | Double tap writes one log | `src/features/study/screens/study-answer.test.tsx:93` — `expect(logs().length).toBe(1)` | SPEC | ✅ |
| ANS-07 | dueCount refreshes after answering | `src/features/study/usecases/study.test.tsx:61` — `dueCount` `toBe(0)`; `study-summary.test.tsx:209-210` | SPEC | ✅ |
| EXT-01 | Alert `Sair da sessão?` / `Seu progresso já foi salvo.` | `src/features/study/screens/study-exit.test.tsx:52` — `alert toHaveBeenCalledWith("Sair da sessão?","Seu progresso já foi salvo.",[...])` | SPEC | ✅ |
| EXT-02 | Sair → origin, logs kept; Continuar keeps card | `src/features/study/screens/study-exit.test.tsx:71-77` — `VERSO` and `b` kept; pathname deck; `ReviewLog` length 1 | SPEC | ✅ |
| EXT-03 | Swipe back disabled; Android back opens the alert | Android back: `src/features/study/screens/study-exit.test.tsx:88-93` — handler returns `true`, alert called, listener removed. Swipe: `src/features/study/screens/session-view.tsx:112` `gestureEnabled:false` has no test | SPEC | ✅ (Android back automated; swipe-back accepted as UAT per implementer note, see G1) |
| EMP-01 | Close, title, text, `Amanhã: N cartões`, `Voltar ao início` | `src/features/study/screens/study-empty.test.tsx:63-67` and tomorrow badge `:65` | SPEC | ✅ |
| EMP-02 | Add-cards link only in the deck session | `src/features/study/screens/study-empty.test.tsx:75` — path `/decks/<id>/cards/new`; `:80` — `queryByRole` null in `/study` | SPEC | ✅ |
| EMP-03 | Close back without alert; `Voltar ao início` home | `src/features/study/screens/study-empty.test.tsx:90-95` — `alert not called`, pathname `/` | SPEC | ✅ |
| SUM-01 | Title and encouragement | `src/features/study/screens/study-summary.test.tsx:120` — `getByText("Bom trabalho! Você revisou tudo o que vencia hoje.")` (title via `findByText("Sessão concluída")` in :49). Profile name omitted by design (out of scope) | SPEC | ✅ |
| SUM-02 | `N cartões revistos` / singular | `src/features/study/screens/study-summary.test.tsx:128` and `:137` | SPEC | ✅ |
| SUM-03 | `P% de acerto` (amended example 89%) | `src/domain/session.test.ts:32` — `accuracy([3,4,15,5])).toBe(89)`; UI `study-summary.test.tsx:129` — `"67% de acerto"` | SPEC | ✅ |
| SUM-04 | `N dias seguidos` / `1 dia seguido` | `src/features/study/screens/study-summary.test.tsx:139-147` — `"2 dias seguidos"`, `"1 dia seguido"` | SPEC | ✅ |
| SUM-05 | Counts, proportional segmented bar, study time | `src/features/study/screens/study-summary.test.tsx:167-170` — counts `["1","0","1","1"]`, 3 segments, no segment 1; `:162` `"3 min de estudo"` / `"< 1 min de estudo"`; `src/domain/session.test.ts:45-47` rounding. Segment proportion widths not asserted (only presence and color) | SPEC | ✅ |
| SUM-06 | `Amanhã: N cartões para revisar` / 1 / nenhum | `src/features/study/screens/study-summary.test.tsx:178-182` (3, 1, none); repo count `repository.test.ts:100` | SPEC | ✅ |
| SUM-07 | `Concluir` returns to origin | `src/features/study/screens/study-summary.test.tsx:194` — `toHavePathname(/decks/<id>)` (home variant in same test) | SPEC | ✅ |
| A11Y-01 | Label `<nota>, <rótulo>`, `Cartão k de N`, role/label/≥ 44pt | `src/features/study/screens/study-session.test.tsx:148-163` — `"Cartão 1 de 3"`, `"Bom, 1 dia"`, role `button`, height ≥ 44 | SPEC | ✅ |
| THM-01 | Tokens, light and dark | `study-session.test.tsx:193`, `study-empty.test.tsx:104`, `study-summary.test.tsx:220` — dark `backgroundColor`. Pixel match to PNGs not machine-verifiable (UAT) | SPEC | ✅ |
| PERF-01 | 1000 due cards by indexed dueDate query, no loading of non-due | `src/features/study/repository.test.ts:96-97` — 2000 seeded, `toStudyCard` called exactly 1000 times; index at `src/db/schemas/card.ts:25` (`dueDate` `indexed:true`); query `repository.ts` uses `filtered("dueDate <= $0")` | SPEC | ✅ |
| ANS-08 | Error text, same card with back, queue unchanged, no half-written data | `src/features/study/screens/study-answer.test.tsx:106-110` — message, `VERSO`, `"1 de 2"`, `logs().length` 0; atomicity `repository.test.ts:148-150` | SPEC | ✅ |
| QUE-04 | Invalid deck → `Baralho não encontrado` + `Voltar ao início` | `src/features/study/screens/study-session.test.tsx:171-173`; `repository.test.ts:76` | SPEC | ✅ |
| QUE-05 | Deleted card skipped and counted, no log | `src/features/study/screens/study-answer.test.tsx:140-141` — `"2 cartões revistos"`, `logs().length` 1 | SPEC | ✅ |
| LOAD-01 | No empty state while the queue is loading | `src/features/study/screens/study-session.test.tsx:182-183` — `queryByText(...)` null for both | SPEC | ✅ |
| INV-01 | logs = accepted answers, one-to-one with card update | `src/features/study/repository.test.ts:196-205` — 100 random answers with injected failures; log count = accepted | INVARIANT | ✅ |
| INV-02 | EF ≥ 1.3, int ≥ 0, rep ≥ 0, lapses never decrease, dueDate ≥ start of day | `src/domain/schedule.test.ts:70-76` — 100 runs × 50 steps | INVARIANT | ✅ |
| INV-03 | 0 ≤ completed ≤ N; completed + queue = N | `src/domain/session.test.ts:76-80` — 100 random runs | INVARIANT | ✅ |

## Invariants

| Invariant | Evidence (`file:line`) | Breaking mutation attempted | Result |
| --- | --- | --- | --- |
| INV-01 | `src/features/study/repository.test.ts:196` | M7: ReviewLog written in a second `realm.write` | killed (ANS-08 and INV-01 fail) |
| INV-02 | `src/domain/schedule.test.ts:70` | M2: EF floor removed | killed (4 tests) |
| INV-03 | `src/domain/session.test.ts:76` | M4: Errei increments `completed` | killed (2 tests) |

## Discrimination

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| 1 | `src/domain/schedule.ts` (Errei branch) | `lapses: lapses + 1` → `lapses` | ✅ (1 failed) |
| 2 | `src/domain/schedule.ts` (`ease`) | removed `Math.max(MIN_EASE, …)` floor | ✅ (4 failed) |
| 3 | `src/domain/schedule.ts` (Fácil) | `Math.round(goodInterval × 1.3)` → no round | ✅ (3 failed) |
| 4 | `src/domain/session.ts` (`answerSession`) | Errei also increments `completed` | ✅ (2 failed) |
| 5 | `src/domain/streak.ts` | anchor fixed at today (no "yesterday" fallback) | ✅ (2 failed) |
| 6 | `src/features/study/screens/session-view.tsx:76` | removed `busy.current` guard | ✅ (ANS-06 failed) |
| 7 | `src/features/study/repository.ts` (`answer`) | ReviewLog created in a separate `realm.write` from the card update | ✅ (ANS-08, INV-01 failed) |

**Result**: 7 injected · 7 killed · 0 survived
**Isolation**: mutations applied in the real tree one at a time and reverted with `git checkout -- <file>`; `git status --short` and `git diff --stat` empty after each, final tree clean. The generated `coverage/` directory was removed. No scratch worktree used.

## Amendments Reconciled

| Amendment | AC text | Code | Test |
| --- | --- | --- | --- |
| SUM-03 example 27/30 → 24/27 = 89% (commit `0b75d49`) | ✅ | ✅ `src/domain/session.ts` `accuracy` | `src/domain/session.test.ts:32` |

## Adversarial Review

Not required at HIGH.

## UAT

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| 1 | iOS swipe-back disabled during session (EXT-03) | not run | needs a device; `gestureEnabled:false` at `session-view.tsx:112`, no automated test |
| 2 | Visual match with PNGs 5a/5b/6/8, light and dark (THM-01) | not run | needs a device |

Orchestrator should walk these two checks with the user.

## Change Review

- Scope matches spec In scope: ✅ (domain, study feature, entry buttons on Início and Baralho, routes `/study` and `/decks/[deckId]/study`, Icon additions).
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅
- Tests anchored and necessary: ✅
- Accepted deviations: SUM-01 omits the profile name (out of scope, M4); Resumo blocks are inline text rather than the PNG layout; SUM-03 example amended.

## Gaps & Fix Tasks

None blocking. Minor, not fix tasks:

1. G1 — EXT-03 swipe: `gestureEnabled:false` has no automated test → UAT check 1.
2. G2 — Possible load-sensitive flakiness (act overlap warnings; failures when jest ran concurrently). Not reproducible serially in 3 full runs and 5 study-only runs.
3. G3 — SUM-05 test checks segment presence and color, not proportional width.
4. G4 — `plan.md` and `spec.md` header Status still read `Draft`; update on closure. `validate_state.py` reported only the missing `validation.md` before this file was written.

## Sign-off

<!-- CRITICAL only; not applicable at HIGH. -->

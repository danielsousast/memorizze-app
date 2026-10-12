# i18n Strings — Validation

**Verdict**: PASS (G1 closed by `src/navigation/root-layout.test.tsx`; mutation 3 re-run and killed; device UAT pending)
**Risk**: HIGH (from spec)
**Verifier**: independent sub-agent
**Diff range**: `9dd48a5..8ac8431`
**Date**: 2026-10-12

## Gate

- **Command**: `npm run ci` (plan.md full gate)
- **Result**: 837 passed, 0 failed, 0 skipped (86 suites) @ `8ac8431`; domain coverage 100% lines
- **Test count**: baseline not recorded by authors → 837
- **Skips**: none

## Acceptance Criteria Evidence

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| I18NS-01 | `resolveLocale` maps es/es-ES/es-MX/es_AR to `es`; others unchanged; app.json lists es | `src/domain/locale.test.ts:12` — `it.each(["es","es-ES","es-MX","es_AR"])("maps %s to es")`; `:16` fr/""/undefined -> pt-BR; `src/lib/i18n/config.test.ts:4` — `supportedLocales` toEqual `{ios:["pt-BR","en","es"], android:[...]}`; `src/lib/i18n/i18n.test.ts:39` es-MX -> `es` | SPEC | ✅ |
| I18NS-02 | three catalogs same keys, no empty en/es | `src/lib/i18n/i18n.test.ts:50` — `keys(en)`/`keys(es)` toEqual `keys(ptBR)`, no `:""`; independently verified 272/272/272 keys, 0 missing/extra, 0 empty, placeholders identical | SPEC | ✅ |
| I18NS-03 | guard fails on visible hardcoded text | `src/i18n-guard.test.ts:106` (full-tree scan `offenders` toEqual `[]`) and `:117-:130` scanSource fixtures (`<Text>Olá</Text>`, `title="Salvar"`, const message, `label:` key); mutations 7 and 8 killed. Own grep for accents/Portuguese/English prose in production src found 0 hits | SPEC | ✅ |
| I18NS-04 | en/es screens render in that language, each area covered | components `src/components/shared-i18n.test.tsx:28` (en/es); decks `src/features/decks/screens/decks-i18n.test.tsx:43,56`; cards `src/features/cards/screens/card-editor-i18n.test.tsx:37`; study `src/features/study/screens/study-i18n.test.tsx:47,65,83`; profile/settings/welcome/backup `src/features/profile/screens/profile-i18n.test.tsx:53,69,85,99,113` | SPEC | ✅ |
| I18NS-05 | values interpolated untranslated | `src/features/decks/screens/decks-i18n.test.tsx:57` — `"Study · 3 cards"` / `"Estudiar · 3 tarjetas"` / `"Estudar · 3 cartões"`; `src/domain/domain-i18n.test.ts:113` deleteDeckMessage keeps deck name; `profile-i18n.test.tsx:113` backup counts + date in en | SPEC | ✅ |
| I18NS-06 | 1 singular; 0 and >=2 plural | `src/domain/domain-i18n.test.ts:62-110` — `"0 cards","1 card","2 cards"`, `"0 tarjetas","1 tarjeta","2 tarjetas"`, `"1 cartão","2 cartões"`; `deckSheetSubtitle` at `:96`; study summary `study-i18n.test.tsx:65`; backup summary `profile-i18n.test.tsx:151,163`; mutation 4 killed | SPEC | ✅ |
| I18NS-07 | date table for 12/10/2026 in 3 locales | `src/domain/domain-i18n.test.ts:29-60` — `it.each(Object.keys(table))("formats %s")` over the four functions + short weekdays Sun..Sat; catalog values checked by hand against spec table (match); mutation 1 killed | SPEC | ✅ |
| I18NS-08 | reminder title/body + Android channel in active locale at schedule time | `src/lib/notifications.test.ts:130` (title/body "Time to review"...), `:142` (channel "Daily reminder"), `:155` (locale switch between schedules); `src/domain/reminder.ts:5-15` functions call `t` at use; mutation 5 killed | CONTRACT/SPEC | ✅ |
| I18NS-09 | mounted screens switch language on foreground, no restart | `src/lib/i18n/use-locale-sync.test.tsx:51` — "Cancelar" -> background keeps -> active shows "Cancel"; mutation 6 killed. Production wiring `src/app/_layout.tsx:34,57` (`key={locale}`) is NOT covered by any test (mutation 3 survived) | SPEC | ✅ G1 closed: `src/navigation/root-layout.test.tsx` renders `RootLayout` and asserts the stack remounts in English |
| I18NS-10 | missing key in en/es falls back to pt-BR | `src/lib/i18n/i18n.test.ts:30` (en) and `:44` (es) — `i18n.t("x")` toBe `"texto"` | SPEC | ✅ |
| I18NS-11 | resolved at use time, not module load | `src/domain/domain-i18n.test.ts:148` — same function differs after `i18n.locale="en"`, `gradeLabel[0]` "Again"/"Fallé"; `decks-i18n.test.tsx:71` deck form validation follows a switch; `profile-i18n.test.tsx:139` invalid-file error; `notifications.test.ts:155`. Static grep: no module-level text consts remain (guard `const-message` check too) | SPEC | ✅ |


## Discrimination

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| 1 | `src/lib/i18n/locales/en.json` date.months | swapped October/November | ✅ `dates per locale (I18NS-07) › formats en` |
| 2 | `src/domain/locale.ts:7` | removed the `es` branch | ✅ 4 locale tests + `uses es when the device is es-MX` |
| 3 | `src/app/_layout.tsx:57` | `<RootStack key={locale} />` -> `<RootStack />` | ✅ killed after fix: `src/navigation/root-layout.test.tsx` fails without `key={locale}` (re-run by the author) |
| 4 | `src/lib/i18n/locales/es.json` plurals.card.one | `"{{count}} tarjeta"` -> `"{{count}} tarjetas"` | ✅ `deckSheetSubtitle in the three languages` |
| 5 | `src/lib/notifications.ts:41` | title forced to `pt-BR` | ✅ 2 tests (I18NS-08, I18NS-11) |
| 6 | `src/lib/i18n/use-locale-sync.ts` | removed `setLocale(i18n.locale)` | ✅ `re-renders a mounted screen ... (I18NS-09)` |
| 7 | `src/features/decks/screens/use-deck-screen.ts:49` | `t("deck.detail.resetDone")` -> literal | ✅ guard |
| 8 | `src/app/_layout.tsx:30` | loading text -> JSX literal | ✅ guard |

**Result**: 8 injected · 8 killed (mutation 3 killed after the G1 fix)
**Isolation**: mutations applied on the real tree and reverted with `git checkout`; `git status --short` clean afterward (only the untracked `validation.md` written after).

## Amendments Reconciled

| Amendment | AC text | Code | Test |
| --- | --- | --- | --- |
| A-01 (AD-009 / i18n-setup I18N-02 add `es`) | ✅ spec scope | ✅ `locale.ts`, `app.json` | `locale.test.ts:12`, `config.test.ts:4` |

Note: the ARCHITECTURE_UPDATE_REQUIRED marker (es, area catalogs, `key={locale}`; AD-009) remains to be done on PASS (verify step 10); not checked here.

## Adversarial Review

Not required (HIGH). Observations from catalog and static review:
- All 214 statically extracted `t("...")` keys exist in all three catalogs; 9 dynamic-key call sites (`date.weekdays.N`, `date.months.N`, `date.weekdaysShort.N`, `study.hint.N`, `profile.stages.{new,learning,mature}.{label,a11y}`, and variable keys in `backup.ts`, `use-deck-form.ts`, `name-errors.ts`) resolve to existing keys; the 48 "unused" keys are all those dynamic/zero/plural families.
- en/es quality plausible and consistent ("tarjeta"/"mazo"/"repasar", "Fallé", neutral tú). The 25 es values identical to pt-BR are legitimate (e.g. "abril", "agosto", "Cancelar", "Perfil", templates), as are 5 in en (brand/format strings).
- Guard limits (not defects today, no hits found by manual grep): it does not detect literals inside ternaries/call arguments (e.g. `cond ? "Sim" : "Não"`, `fail("Erro")`) or template-literal text; the allowlist (`welcome-screen.tsx:M`, `:remember`) is justified. Thousands separator is catalog-driven (`number.thousandsSeparator`).
- `toLocaleUpperCase(i18n.locale)` in `profile-screen.tsx:126` and `toLocaleLowerCase()` in `decks/repository.ts` are data handling, not UI text.

## UAT

Not run (independent agent, no device). Pending person check: change device language to en and es and return to the app; confirm the reminder text and Android channel name after rescheduling.

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| 1 | Device switch pt-BR -> en/es with app backgrounded, then foreground | not run | Covered only at the hook level (G1) |

## Change Review

- Scope matches spec In scope: ✅ (72 files; only text, catalogs, `locale.ts`, `app.json`, `use-locale-sync`, root layout, tests, spec/plan)
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅ (`plural` removed from `text.ts` as planned)
- Tests anchored and necessary: ✅ (existing pt-BR suites pass unedited except locale/reminder/text tests adapted to new API)

## Gaps & Fix Tasks

1. G1 (blocks PASS per surviving-mutant rule) — I18NS-09 — `RootStack key={locale}` in `src/app/_layout.tsx:57` has no test; mutation 3 survived. The only I18NS-09 test uses its own `Screen` component with `key={locale}`, so removing the production key would not be noticed. Suggested F1: extract a tiny `LocalizedRoot`/test of the layout (or a static assertion that `_layout.tsx` passes the `useLocaleSync()` value as `key`) → F1 in plan.md (not added by verifier).

## Sign-off

Not applicable (HIGH).

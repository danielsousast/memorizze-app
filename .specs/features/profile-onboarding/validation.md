# Perfil e entrada (profile-onboarding) — Validation

**Verdict**: PASS-WITH-GAPS (F1 fixed after verification: test added, mutant `<=` now killed; F2–F4 open, minor; UAT pending)
**Risk**: HIGH (from spec)
**Verifier**: independent sub-agent
**Diff range**: `c2fd69b..1298f43`
**Date**: 2026-10-10

## Gate

- **Command**: `npm test && npx tsc --noEmit && npx expo lint`
- **Result**: 362 passed, 0 failed, 0 skipped (47 suites); tsc exit 0; lint exit 0 @ `1298f43`
- **Test count**: baseline not recorded → 362
- **Skips**: none

## Acceptance Criteria Evidence

Line numbers are within each test file (see `it(` titles; files listed in Origin column).

| AC | Spec-defined outcome | Evidence | Origin | Result |
| --- | --- | --- | --- | --- |
| ENT-01 | sem perfil → Boas-vindas | `src/navigation/root-stack.test.tsx` "ENT-01" — `findByText("Começar")`, `toHavePathname("/welcome")` | SPEC | ✅ |
| ENT-02 | com perfil → Início | `root-stack.test.tsx` "ENT-02" — `findByTestId("home-screen")`, pathname `/` | SPEC | ✅ |
| ENT-03 | pendente: nem uma nem outra | `root-stack.test.tsx` "ENT-03" — both queries null with never-resolving query | SPEC | ✅ |
| WEL-01 | textos, selos, campo, botão; ilustração oculta | `welcome-screen.test.tsx` "WEL-01" — each text, `accessibilityElementsHidden` true | SPEC | ✅ |
| WEL-02 | cria Profile trim, goal 20, createdAt; substitui; back não reabre | `welcome-screen.test.tsx` "WEL-02" (trim) ; `repository.test.ts` "WEL-03…defaults" (`dailyGoal: 20`, `createdAt: now`); `root-stack.test.tsx` "WEL-02" — `router.canGoBack()` false | SPEC | ✅ |
| WEL-03 | `Digite seu nome.`, sem criar | `welcome-screen.test.tsx` "WEL-03" — text + `profiles()` length 0 | SPEC | ✅ |
| WEL-04 | maxLength 30; repo recusa >30 | `welcome-screen.test.tsx` "WEL-04" maxLength 30; `repository.test.ts` "WEL-04" code `PROFILE_NAME_TOO_LONG`, 0 gravado. Mensagem `Use no máximo 30 caracteres.` não é afirmada em UI (só o código) | SPEC | ⚠️ weak (message text only via name-errors.ts mapping, untested) |
| WEL-05 | /welcome inalcançável com perfil | `root-stack.test.tsx` "WEL-05" — push /welcome, `Começar` null | SPEC | ✅ |
| WEL-06 | toque duplo → um Profile | `welcome-screen.test.tsx` "WEL-06" — `getMutationCache().getAll()` length 1 (mutante removendo guard morto) | SPEC | ✅ |
| TAB-01 | duas abas, selected | `src/navigation/tabs.test.tsx` "TAB-01" — `accessibilityState.selected` true/false | SPEC | ✅ |
| TAB-02 | sem tab bar em baralho/estudo | `tabs.test.tsx` "TAB-02" (deck, study). Resumo e modais não testados | SPEC | ⚠️ partial |
| HOM-01 | data + `Olá, {nome}` | `home-screen.test.tsx` "HOM-01" | SPEC | ✅ |
| HOM-02 | `N dias seguidos` / singular, com/sem baralhos | `home-screen.test.tsx` "HOM-02" x2 | SPEC | ✅ |
| HOM-03 | 3 subtítulos; ícone neutro/destaque | `home-screen.test.tsx` "HOM-03" x3 (texto). Ícone (neutro vs destaque) sem asserção | SPEC | ⚠️ icon untested |
| HOM-04 | `M de G revisões`, barra min(M,G)/G | `home-screen.test.tsx` "HOM-04" — `"18 de 30 revisões"`, width `"60%"`; `goal-progress.test.tsx` | SPEC | ✅ |
| HOM-05 | M≥G barra cheia, texto M de G | `goal-progress.test.tsx` "HOM-05" — `"34 de 30 revisões"`, width `"100%"` | SPEC | ✅ |
| HOM-06 | Estudar tudo dentro do cartão, só com baralhos | `home-screen.test.tsx` "HOM-06" x2 | SPEC | ✅ |
| HOM-07 | refresh ao refocar | `home-screen.test.tsx` "HOM-07" (volta do estudo); `profile-screen.test.tsx` "HOM-07" (troca de aba). Virada de dia local não testada | SPEC | ✅ |
| REV-01 | conta qualquer nota | `repository.test.ts` "REV-01" — 4 | SPEC | ✅ |
| REV-02 | exemplos 23:59/00:00/23:59; 0; 3 do mesmo cartão | `repository.test.ts` "REV-02" x2 — 0 then 2; 3. Limite superior exclusivo (amanhã 00:00) não exercido | SPEC | ⚠️ mutant survived (F1) |
| PRF-01 | título, inicial, nome, desde | `profile-screen.test.tsx` "PRF-01"; `dates.test.ts` "PRF-01" | SPEC | ✅ |
| PRF-02 | cartão meta, valor, Revisões hoje, `M de G` | `profile-screen.test.tsx` "PRF-02". Barra preenchida do Perfil sem asserção própria (GoalProgress compartilhado, testado) | SPEC | ✅ |
| PRF-03 | botão `Editar nome, {nome}` | `profile-screen.test.tsx` "PRF-03" | SPEC | ✅ |
| PRF-04 | modal com campo preenchido e `Salvar` | `edit-name-screen.test.tsx` "PRF-04" | SPEC | ✅ |
| PRF-05 | grava trim, fecha, reflete no Perfil e Início | `edit-name-screen.test.tsx` "PRF-05" x2; `repository.test.ts` "PRF-05" | SPEC | ✅ |
| PRF-06 | usa o mais antigo | `repository.test.ts` "PRF-06" — `"Antiga"` (mutante sem sort morto) | SPEC | ✅ |
| GOL-01 | ±5 gravado na hora | `profile-screen.test.tsx` "GOL-01" — `goal()` 25 then 20 | SPEC | ✅ |
| GOL-02 | desativa em 200/5 | `profile-screen.test.tsx` "GOL-02"; `goal.test.ts` "canStep" | SPEC | ✅ |
| GOL-03 | labels | `profile-screen.test.tsx` "GOL-03" | SPEC | ✅ |
| GOL-04 | Início mostra novo G | `profile-screen.test.tsx` "GOL-04" — `"0 de 25 revisões"` | SPEC | ✅ |
| GOL-05 | valor fora do padrão mostrado | `profile-screen.test.tsx` "GOL-05" — `"23"` | SPEC | ✅ |
| GOL-06 | 23→25/20, 3→5, 250→200 | `goal.test.ts` "stepGoal" x2 | SPEC | ✅ |
| ERR-01 | mensagem, mantém tela e valor | `welcome-screen.test.tsx`, `edit-name-screen.test.tsx`, `profile-screen.test.tsx` "ERR-01" (3 caminhos) | SPEC | ✅ |
| THM-01 | tokens e PNGs | `home-screen.test.tsx` "THM-01" (cor escura do cartão). Fidelidade aos PNGs: só UAT | SPEC | ⚠️ UAT |
| A11Y-01 | todo tocável com role, label, alvo ≥ 44 | Só `welcome-screen.test.tsx` "A11Y-01" (Começar, minHeight). Steppers usam `sizes.minTouch`=44 (`profile-screen.tsx` styles.step) e cabeçalho/Salvar/abas sem asserção de tamanho | SPEC | ⚠️ partial (F3) |

## Invariants

| Invariant | Evidence | Breaking mutation attempted | Result |
| --- | --- | --- | --- |
| INV-01 | `repository.test.ts` "INV-01" (random create/update ≤ 1; create devolve existente) | `create` sem checagem de existente | ✅ killed (2 testes) |
| INV-02 | `goal.test.ts` "goal invariant" (100x50 passos, 5..200, %5) | `stepGoal` sem limite de 200 | ✅ killed (por "clamps", não pelo teste de propriedade: o teste de propriedade começa em 20 e só percorre passos válidos, mas o teto de 200 é alcançado) |

## Discrimination

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| 1 | `src/domain/goal.ts` (stepGoal) | removed `Math.min(GOAL_MAX, …)` | ✅ |
| 2 | `src/features/profile/repository.ts` countReviewsToday | `reviewedAt < $1` → `<= $1` | ❌ survived → F1 |
| 3 | `repository.ts` create | removed `if (current) return …` | ✅ |
| 4 | `repository.ts` oldest() | removed `.sorted("createdAt")` | ✅ |
| 5 | `src/features/decks/screens/streak-card.tsx` subtitle | removed "Você já estudou hoje" branch | ✅ |
| 6 | `src/navigation/root-stack.tsx` | welcome `guard={!profile}` → `true` | ✅ |
| 7 | `welcome-screen.tsx` start() | removed `busy.current` guard | ✅ |
| 8 | `repository.ts` create | stored untrimmed `name` | ✅ |
| 9 | `repository.ts` countReviewsToday | `>= $0` → `> $0` | ✅ |

**Result**: 9 injected · 8 killed · 1 survived
**Isolation**: scratch git worktree (node_modules symlinked), removed afterwards; real-tree `git status --porcelain` empty before and after (apart from this file).

## Amendments Reconciled

None.

## Adversarial Review

1. **Deep link / push to unguarded routes without a profile** (severity: minor, observation; not required by any AC). In `src/navigation/root-stack.tsx` only `welcome` and the screens listed under `Stack.Protected guard={!!profile}` are guarded. `src/app/study.tsx`, `src/app/decks/[deckId]/index.tsx` and `src/app/decks/[deckId]/study.tsx` are not declared, so Expo Router auto-registers them outside any guard. Probe in the scratch tree (profile absent, `RootStack`): `router.push("/decks/abc")` rendered the deck screen (`DECK=true`). `app.json` has `"scheme": "memorizzeapp"`, so such links are real. Spec: ENT-01 only says "app abre sem Profile → Boas-vindas" (cold start on default route); no AC forbids reaching other routes, and the app has no decks/cards without a profile (empty DB), so the impact is an empty or not-found screen, not data exposure. Gap against intent ("um erro tranca o usuário fora" is the opposite risk). Recommendation: move all non-welcome routes inside the protected group or add an AC. A spec amendment decides; no code change by verifier.
2. WEL-06: guard is a `useRef` plus `disabled={create.isPending}`, and the repository is idempotent; the test asserts mutation count, so the guard is genuinely checked.
3. `PRF-06`: `update()` also targets the oldest profile, consistent with `get()`.
4. No debug leftovers, TODOs, or skipped tests found in the diff.

## UAT

Remaining for a development build (cannot be done by code reading or jest):

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| 1 | Boas-vindas vs PNG 1, light and dark | pending | spacing, illustration card, badges |
| 2 | Início (streak card) vs PNGs 2 and 2b, light and dark, with and without decks | pending | icon neutro vs destaque (HOM-03) |
| 3 | Perfil top vs PNG 7, light and dark | pending | avatar, stepper, bar |
| 4 | Real JS tab bar look, selected state, safe-area on notched devices | pending | `expo-router/js-tabs` |
| 5 | iOS swipe-back from Início does not return to Boas-vindas after Começar; Android hardware back | pending | WEL-02 |
| 6 | Keyboard behavior on Boas-vindas (`keyboardAvoiding`, return key submits) | pending | |
| 7 | Edit-name modal presentation on iOS and Android | pending | |
| 8 | Tab bar hidden on Baralho, Estudo, Resumo and modals (Resumo not unit-tested) | pending | TAB-02 |
| 9 | Day rollover with app backgrounded: Início refreshes streak/M | pending | HOM-07 |
| 10 | VoiceOver/TalkBack reads stepper and tabs; touch targets measured | pending | A11Y-01, GOL-03 |

## Change Review

- Scope matches spec In scope: ✅ (`src/features/profile`, navigation, home card, domain helpers)
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅ (`.gitignore` coverage entry is minor housekeeping; `use-answer-card.ts` invalidates `profile` after answering, covered by a REGRESSION test)
- Tests anchored and necessary: ✅ (CONTRACT tests in `usecases/profile.test.tsx` are not spec-anchored but protect the Realm-object/invalidations contract)

## Gaps & Fix Tasks

1. **F1 (major, test) — FIXED in repository.test.ts (mutant re-run killed it)** — REV-01/REV-02 upper bound: mutant `<` → `<=` on the tomorrow bound survives. Add a case with a log at tomorrow 00:00 (10/10 → 11/10 00:00) expecting it uncounted in `src/features/profile/repository.test.ts` (next to line ~88).
2. **F2 (minor, spec/design) — FIXED: the three routes are declared inside `Stack.Protected`; root-stack.test.tsx covers deep links with and without a profile** — Unguarded auto-registered routes (`study`, `decks/[deckId]`, `decks/[deckId]/study`) reachable without a profile via push/deep link (`src/navigation/root-stack.tsx:24-34`). Decide by amendment: protect them or accept.
3. **F3 (minor, test)** — A11Y-01 only asserted for `Começar`; no size/role assertion for steppers, profile header, `Salvar`, tab items.
4. **F4 (minor, test)** — WEL-04 message `Use no máximo 30 caracteres.` and ERR path via UI not asserted for the too-long case (`src/features/profile/screens/name-errors.ts`); HOM-03 icon variants and TAB-02 on Resumo/modals unasserted.

## Sign-off

N/A at HIGH.

# Architecture

## Current Architecture

Expo app with the data layer for decks, cards and the profile, and the screens that use it: Welcome, Home (streak and daily-goal card), Profile (name, goal stepper), Edit name, Deck, Deck form, Card editor and the study session (session, empty state, summary). Entry is gated by the profile ([AD-004](.specs/STATE.md#ad-004)); Home and Profile are tabs.

| Part | Path | Contents |
| --- | --- | --- |
| Root layout | `src/app/_layout.tsx` | `RealmErrorBoundary` → `RealmProvider` → `QueryClientProvider` → `RootStack` (`src/navigation/root-stack.tsx`) |
| Routes | `src/app/` | Thin files that read params and render a screen: `welcome`, `edit-name` (modal), `settings` (Ajustes, opened by the Profile gear), `(tabs)/index` and `(tabs)/profile` (tab group, `Tabs` from `expo-router/js-tabs`), `decks/[deckId]/index`, `study` and `decks/[deckId]/study` (study session), and four more modals (`decks/new`, `decks/[deckId]/edit`, `decks/[deckId]/cards/new`, `cards/[cardId]/edit`), declared with `presentation: "modal"` in `RootStack`. `RootStack` uses `Stack.Protected`: `welcome` exists only without a profile, everything else only with one. Routes not declared there (`study`, `decks/[deckId]`, `decks/[deckId]/study`) are auto-registered and not guarded |
| Screens | `src/features/<feature>/screens/` | One `<name>-screen.tsx` per screen ([AD-003](.specs/STATE.md#ad-003)); they use only the public hooks of `@/features/*` |
| Shared UI | `src/components/` | `Button`, `Fab`, `Badge`, `TextField`, `DeckIcon`, `Icon` (`expo-symbols`), `Screen`, `NotFound`, `SegmentedControl`, `SettingsRow`; one file each, theme tokens, accessibility role and label, touch target ≥ 44 |
| Database | `src/db/` | Realm schemas (Profile, Deck, Card, ReviewLog), `realmConfig` (`schemaVersion` 6; `onMigration` fills `Profile.themePreference = "system"` and `newCardsPerDay = 10` on files older than v4, and `reminderEnabled = false` and `reminderHour = 19` on files older than v6), `RealmErrorBoundary` |
| Query client | `src/lib/query-client.ts` | `createQueryClient()`: `networkMode: "always"`, `retry: false`, `staleTime: Infinity` |
| Domain | `src/domain/` | Pure, no Realm or React: `errors.ts` (`AppError<C>` with a typed `code`), `dates.ts` (end of local day, `isDue`, long pt-BR date), `stage.ts` (`new` / `learning` / `mature`), `text.ts` (initials, plural, accent-insensitive search); `schedule.ts` (SM-2, interval label), `streak.ts` (current streak), `session.ts` (in-memory session progress); `dates.ts` also has `startOfLocalDay` and `addLocalDays`; `preferences.ts` (theme and new-cards-limit options, `colorSchemeFor`), `new-cards.ts` (`selectQueue`, the daily new-card budget) |
| Features | `src/features/decks/`, `src/features/cards/`, `src/features/study/` | Repositories and React Query hooks (see [Feature modules](#feature-modules)) |
| Path alias | `tsconfig.json` | `@/*` → `./src/*`, `@/assets/*` → `./assets/*` |
| Compiler | `app.json` | `typedRoutes` and `reactCompiler` experiments on |

Navigation is file-based (Expo Router). `Deck.dueCount` is derived at read time by the deck adapter (cards due by the end of the local day, using the repository's `now`); it is never stored. Screen tests use `renderRouterWithProviders` (`src/testing/router.tsx`) with an in-memory Realm and a real `QueryClient`.

## Feature modules

Decisions: [AD-001](.specs/STATE.md#ad-001) (layout) and [AD-002](.specs/STATE.md#ad-002) (React Query over Realm).

```
src/features/<feature>/
  interfaces.ts   plain types, inputs, error codes, repository contract
  adapters.ts     Realm.Object → plain object (only when there is a conversion)
  repository.ts   createXRepository(realm, now) + useXRepository(); the only Realm access
  usecases/       one hook per file (use-*.ts) + keys.ts (query keys)
  index.ts        public API: hooks and types
```

A feature with a single use case keeps that `use-*.ts` at its root, without `usecases/`.

Screen hooks (`screens/use-<screen>.ts`, [AD-006](.specs/STATE.md#ad-006)) hold a screen's state, effects, navigation and alerts and compose `usecases/` hooks and `src/domain/` functions; screens only render and wire named handlers ([AD-005](.specs/STATE.md#ad-005)). `src/features/screen-logic.test.ts` guards the screens.

**Rules**

- Only `repository.ts`, `adapters.ts` and tests import `realm`, `@realm/react` or `src/db`, by any path (alias or relative). ESLint `no-restricted-imports` (`eslint.config.js`) and `src/features/architecture.test.ts` enforce it.
- Each hook makes exactly one `useQuery` or `useMutation` call, and its function calls exactly one repository method. `src/features/architecture.test.ts` enforces it.
- The repository validates, writes, and returns plain objects through the adapters. It throws `AppError` with the feature's code before any `realm.write`.
- Hooks return plain objects, never live `Realm.Object`s, so data stays readable after the record is deleted.
- Every write goes through a mutation hook. A write outside the hooks leaves the cache stale (AD-002).
- Ids cross the feature API as 24-char hex strings. An invalid id reads as "not found".

**Hook shape**

```ts
export function useCreateDeck() {
  const repository = useDeckRepository();
  const queryClient = useQueryClient();
  return useMutation<Deck, AppError<DeckErrorCode>, DeckInput>({
    mutationFn: async (input) => repository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deckKeys.all }),
  });
}
```

**Invalidation matrix** (whole prefixes; local reads are cheap)

| Write | Invalidates |
| --- | --- |
| Create or update deck | `["decks"]` |
| Delete deck (cascades to its cards) | `["decks"]`, `["cards"]` |
| Create or delete card (changes `cardCount`) | `["cards"]`, `["decks"]` |
| Edit card | `["cards"]` |
| Answer a card (updates the card, creates a `ReviewLog`) | `["cards"]`, `["decks"]`, `["study"]`, `["profile"]` |
| Create or update profile (name, daily goal, theme, new-cards limit) | `["profile"]` |

`ReviewLog` is never touched by deck or card operations. It survives the deletion of its card or deck.

## Study session

`study` ([study-session spec](.specs/features/study-session/spec.md)) reads the due queue and writes answers. `repository.answer` applies `schedule()` and creates the `ReviewLog` in one `realm.write`; the deck of a card comes from the backlink (`linkingObjects(Deck, "cards")`), so the schema has no `deck` field on `Card`.

The queue is a snapshot: `study` queries use `gcTime: 0` so each session opens with a fresh read, and `StudyScreen` keeps the first read in state so later invalidations do not change the queue mid-session (QUE-02). One route per scope (`/study`, `/decks/<id>/study`) switches phase: loading, not found, empty, studying, summary. The summary replaces the session in the same route, so going back leaves it.

## Preferences

`Profile` holds two preferences ([settings spec](.specs/features/settings-and-preferences/spec.md)): `themePreference` (`"system" | "light" | "dark"`) and `newCardsPerDay` (int; `0` = no limit, mapped to `null` in the domain). `ProfileRepository.update` rejects values outside the option lists with `PROFILE_PREFERENCE_INVALID`, writing nothing.

- **Theme.** `useApplyTheme` (`src/navigation/use-apply-theme.ts`), mounted in `RootStack`, calls `Appearance.setColorScheme` in a layout effect: `"light"`/`"dark"` force the scheme, `"unspecified"` hands it back to the system (also with no profile, so Sair restores the system theme). `useTheme` and every `useColorScheme` caller are unchanged.
- **Daily new-card budget.** `StudyRepository.queue` (all decks or one) reads the oldest profile and applies `selectQueue` after the usual order (`dueDate`, `createdAt`). A card is "introduced today" when its first `ReviewLog` ever falls on the current local day; one budget covers all decks. Non-new cards are never cut, a new card introduced today (and failed) stays free, and no profile or limit `0` keeps every due card. The "due today" counts on Home and Deck are unchanged.

## Backup and restore

`backup` ([spec](.specs/features/backup-restore/spec.md)) exports and imports the whole database as one JSON file. `src/domain/backup.ts` is pure: `buildBackup`, `parseBackup` (validates the whole file, ids, dates, grades and references, and reports `invalid` or `newer`), file name, date labels and counts. `src/features/backup/files.ts` is the only code that touches `expo-file-system`, `expo-sharing` and `expo-document-picker`; tests replace it with `jest.mock`.

- **Export.** `use-export-backup` writes `cache/backups/memorizze-AAAA-MM-DD.json` (clearing the previous export) and opens the system share sheet; the screen hook then calls `use-mark-backed-up`, which moves `Profile.lastBackupAt` to `previousBackupAt` (`shareAsync` does not report a cancelled sheet, so the date is stamped when it resolves, A-01). A failed write or share deletes the temp file and leaves the dates alone.
- **Import.** `use-import-flow` (shared by the Backup and welcome screens) picks the file, refuses more than 20 MB by its reported size, parses and validates it, and only then opens the destructive `ConfirmDialog`. `repository.restore` deletes the four models and recreates them from the file in one `realm.write`; any exception rolls back everything. The restore hook invalidates every query, so the profile read re-applies the theme and releases the welcome guard ([AD-004](.specs/STATE.md#ad-004)).
- **Schema.** `Profile.lastBackupAt` and `previousBackupAt` (optional dates), Realm `schemaVersion` 5. Realm cannot downgrade: reverting the code keeps version 5.
- **Routes.** `/backup` is protected like the rest of the app; Ajustes links to it.

## Daily reminder

`reminder` ([spec](.specs/features/daily-reminder/spec.md)) schedules one local notification per day at a whole hour (06:00 to 22:00, default 19:00, off by default). `Profile.reminderEnabled` and `reminderHour` hold the choice; Realm `schemaVersion` 6. `src/domain/reminder.ts` is pure (hours, labels, notification text). `src/lib/notifications.ts` is the only code that touches `expo-notifications`: permission, the Android channel `Lembrete diário`, the daily trigger with the fixed id `daily-reminder` (cancel before schedule, so at most one exists) and the foreground handler (banner, no sound, no badge). Tests replace it with `notificationsModuleMock` (`src/testing/notifications.ts`).

- **Apply.** `src/features/reminder/repository.ts` joins permission, the OS schedule and the Realm write behind one serial queue per realm (REM-19). On failure it reconciles the OS schedule back to the saved value (REM-18).
- **Sync.** `useReminderSync` (`src/navigation/use-reminder-sync.ts`), mounted in `RootStack`, reschedules on open when the OS lost the notification, saves the reminder as off when the permission was revoked, and cancels on sign out. Restoring a backup leaves the reminder off and cancelled.
- **Settings.** The switch and the hour sheet live in Ajustes; a denied permission turns the switch back off and shows a toast with `Abrir ajustes`.
- **Build.** The `expo-notifications` config plugin is in `app.json`; it needs a development build.

## Planned Architecture

Source: [PROJECT-SPEC.md](PROJECT-SPEC.md) (draft v0.1). Partly implemented (Realm, decks, cards).

- 100% offline, local profile; no backend, login or network calls (spec §2, §8)
- Realm (`realm` + `@realm/react`) for persistence: Profile, Deck, Card, ReviewLog (spec §4)
- `src/domain/` pure logic (schedule, streak, stats, dates), importing neither Realm nor React (spec §9)
- `src/db/` schemas and repositories; screens reach the database only through hooks/repositories
- `src/features/` (decks, cards, study, profile), `src/components/`, `src/theme/`
- Streak and stats derived from `ReviewLog`, never stored
- Light/dark theme following the system, with an Automático/Claro/Escuro override (implemented, see [Preferences](#preferences))

## Documentation Drift

- PROJECT-SPEC §3/§9 plans React Navigation and a `src/navigation/` folder; the repo uses Expo Router with routes in `src/app/` (`AGENTS.md`, `package.json`). Code wins until the user decides otherwise.
- PROJECT-SPEC §13 leaves "Expo or RN CLI" open; the repo is Expo SDK 57 (`package.json`).

## Open Architectural Questions

- UI language: pt-BR only or pt-BR + en (spec §13)

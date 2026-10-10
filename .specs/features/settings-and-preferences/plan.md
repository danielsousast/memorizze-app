# Settings and Preferences — Plan

**Spec**: [spec.md](spec.md)
**Risk**: HIGH (from spec)
**Status**: Done (author verification; independent verifier and UAT pending)

## Approach

O `Profile` ganha `themePreference` e `newCardsPerDay` (Realm 3→4, com `onMigration` explícito). Uma função de domínio pura escolhe quais cartões novos entram na fila; `StudyRepository.queue` lê o limite do perfil e os "introduzidos hoje" dos `ReviewLog` e a chama. O tema é aplicado por `Appearance.setColorScheme` num hook montado no `RootStack`: `useTheme` e todos os `useColorScheme` seguem sem mudança. A tela Ajustes usa `useProfile`/`useUpdateProfile` existentes. Conforma AD-001, AD-002, AD-003, AD-005, AD-006 e AD-007.

## Design

### Research (Expo SDK 57)

- `userInterfaceStyle: "automatic"` e `expo-system-ui` já estão no projeto: pré-requisitos do tema no Android/iOS cumpridos (docs Color themes).
- `Appearance.setColorScheme('light' | 'dark' | 'unspecified')` existe no RN 0.86 (`node_modules/react-native/Libraries/Utilities/Appearance.js`, `Appearance.d.ts`); `'unspecified'` devolve o controle ao sistema (o tipo não aceita `null`). Sem módulo nativo novo, funciona em dev build e Expo Go.
- O `Realm` não aplica o `default` do schema a objetos antigos ao adicionar propriedade; a migração preenche os valores à mão.

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `useProfile`, `useUpdateProfile` | `features/profile/usecases/` | Ler e gravar as preferências |
| `BottomSheet`, `useToast` | `src/components/` | Opções de novos por dia, erro de gravação (AD-007) |
| `Screen`, `Icon`, `Button` | `src/components/` | Estrutura e ícones |
| `cardStage`/`repetitions` | `src/domain/stage.ts` | Definição de "novo" |
| `startOfLocalDay`, `addLocalDays` | `src/domain/dates.ts` | Dia local do orçamento |

### Components and interfaces

- **Schema** (`db/schemas/profile.ts`, `db/realm.ts`): `themePreference: string` (`"system"|"light"|"dark"`), `newCardsPerDay: int` (`0` = sem limite); `schemaVersion: 4`; `onMigration` grava `"system"` e `10` em todo `Profile` existente.
- **Domain** `domain/preferences.ts`: tipos `ThemePreference`, `NewCardsLimit` (`5|10|20|30|50|null`), listas de opções, rótulos, `colorSchemeFor(pref)` (`"light"|"dark"|"unspecified"`), `parseTheme`, `parseNewLimit` (valida e mapeia 0↔null).
- **Domain** `domain/new-cards.ts`: `selectQueue(cards: {id, repetitions}[], limit: number | null, introducedToday: ReadonlySet<string>, introducedCount?)`: mantém não novos; novos já introduzidos hoje entram sem custo; demais novos até `limite − introducedToday.size`; preserva a ordem recebida.
- **Profile** (`interfaces.ts`, `adapters.ts`, `repository.ts`): `Profile` e `ProfileInput` ganham `themePreference`, `newCardsPerDay: NewCardsLimit`; `update` rejeita valor fora da lista (`PROFILE_PREFERENCE_INVALID`).
- **Study repository** (`queue`): obtém o perfil, calcula `introducedToday` (ids de logs de hoje sem log anterior, uma consulta por id) e aplica `selectQueue`. Sem perfil, sem limite.
- **Tema** (`navigation/use-apply-theme.ts`): `useLayoutEffect` chama `Appearance.setColorScheme(colorSchemeFor(profile?.themePreference))`; no `RootStack`, antes do primeiro desenho com perfil, o que cumpre THM-04; sem perfil devolve `"unspecified"` (THM-05).
- **Componentes** `segmented-control.tsx` (`role="radiogroup"`, itens com ícone opcional, alvo ≥ 44pt) e `settings-row.tsx` (título, subtítulo, valor e chevron, `Pressable` com rótulo). `SheetAction` ganha `selected?: boolean` (ícone de check).
- **Tela** `features/profile/screens/settings-screen.tsx` + `use-settings-screen.ts` (escolha de tema, folha, toast de erro; sem lógica na tela). Rota `src/app/settings.tsx` e `Stack.Screen name="settings"` dentro do guard; `openSettings` passa a `router.push("/settings")`. Versão via `expo-constants` (`expoConfig.version`).

### Data model

`Profile`: `+themePreference: string (default "system")`, `+newCardsPerDay: int (default 10)`. Migração só adiciona campos; nenhum dado existente é lido ou alterado fora do `Profile`.

### Error handling

| Failure (AC) | Handling | User sees |
| --- | --- | --- |
| SET-04 | `onError` do `mutate` mostra toast; a seleção volta pois vem do perfil em cache | Toast `Não foi possível salvar.` |
| Valor inválido no repositório | `AppError` `PROFILE_PREFERENCE_INVALID`, nada gravado | Toast (via SET-04) |
| MIG-01 | `onMigration` roda numa transação do Realm; erro aborta a abertura | `RealmErrorBoundary` existente |

### Architecture impact

**Architecture impact**: `ARCHITECTURE_UPDATE_REQUIRED` — novos campos do `Profile`, regra de fila com orçamento diário e aplicação do tema por `Appearance`.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Aplicar tema | `Appearance.setColorScheme` | Zero mudança em `useTheme` e nos testes que simulam `useColorScheme`; também tinge teclado e diálogos nativos |
| 0 = sem limite no Realm | `int` com `0`, `null` no domínio | Evita campo opcional; adapter converte |
| Cálculo de "introduzido hoje" | Consulta por id dos logs de hoje | Poucos ids por dia (≤ limite + erros); sem varrer todos os logs |
| Orçamento | Único, em `queue` | Estudar tudo e por baralho dão o mesmo resultado (NEW-03) |

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Contexto de tema e `useTheme` lê dele | Quebra o `useColorScheme` dos testes e dos componentes nativos; mais código |
| `AsyncStorage` para preferências | Segundo armazenamento; Sair teria de limpar os dois |
| Contador de novos no `Profile` | Estado derivado que pode divergir dos logs |
| Cap aplicado em `countDue` | Fora do escopo (spec) |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Migração deixa limite 0 (= sem limite) | `db/realm.ts` | Limite não vale | MIG-01 abre arquivo v3 real e checa `10` |
| Cartão some da fila por erro de orçamento | `new-cards.ts` | Estudo incompleto | Testes de borda NEW-02..05 e INVARIANT: fila ⊆ vencidos, não novos nunca cortados |
| Tema pisca ao abrir | `use-apply-theme.ts` | Flash de cor | `useLayoutEffect` antes do desenho; `RootStack` já espera o perfil |
| Resíduo de tema após Sair | `use-apply-theme.ts` | Tema errado na Boas-vindas | THM-05 testado pelo fluxo Sair |

## Test Strategy

Domínio puro (`new-cards`, `preferences`) com tabelas e INVARIANT de 100 operações aleatórias (`createRandom`); repositório com Realm em memória e relógio fixo para NEW-02..09; migração: abrir arquivo em `schemaVersion 3` e reabrir em 4 (MIG-01); telas pelo `renderRouterWithProviders` (SET-01..04, THM-01..05, NEW-01, NEW-06); `Appearance.setColorScheme` com `jest.spyOn`. Mutações-alvo do verificador: `limite − introduzidos` trocado por `limite`, `<`/`≤` do orçamento, 0↔null invertido, `onMigration` sem `newCardsPerDay`, `setColorScheme("unspecified")` removido no Sair, `useLayoutEffect` por `useEffect`.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest src/domain src/features/profile src/features/study src/db src/components src/navigation && npx tsc --noEmit` | after each task |
| full | `npm run ci` (inclui `expo lint`) | after the last task |

## Tasks

### T1 — Domínio de preferências e fila

- **Covers**: NEW-02, NEW-03, NEW-04, NEW-05, NEW-07
- **Depends on**: none
- **Risk**: HIGH
- **Touches**: `src/domain/{preferences.ts,new-cards.ts}` e testes
- **Change**: tipos, opções, `colorSchemeFor`, parsers, `selectQueue`.
- **Tests**:
  - SPEC NEW-02, NEW-03, NEW-04, NEW-05 · domain — tabelas de fila com e sem orçamento, erro em andamento, sem limite
  - SPEC NEW-07 · domain — o padrão é 10 e as opções são 5, 10, 20, 30, 50, sem limite
  - SPEC NEW-02 · domain (propriedades) — 100 operações: saída ⊆ entrada, ordem preservada, não novos intactos, novos novos ≤ orçamento
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Schema, migração e repositórios

- **Covers**: MIG-01, NEW-02, NEW-03, NEW-04, NEW-05, NEW-06, NEW-07, NEW-08, NEW-09, THM-02, SET-04
- **Depends on**: T1
- **Risk**: HIGH
- **Touches**: `src/db/{realm.ts,schemas/profile.ts,schemas/schemas.test.ts,realm.test.ts}`, `src/features/profile/{interfaces.ts,adapters.ts,repository.ts,repository.test.ts}`, `src/features/study/{repository.ts,repository.test.ts}`
- **Change**: campos, `schemaVersion 4`, `onMigration`, `update` com validação, `queue` com orçamento.
- **Tests**:
  - SPEC MIG-01 · db — arquivo v3 migra para v4 preservando dados, tema `system`, limite 10
  - SPEC NEW-02, NEW-03, NEW-04, NEW-05, NEW-06, NEW-08, NEW-09 · study repository — relógio fixo, vários baralhos, deck único, redefinido, esgotado
  - CONTRACT NEW-02 · study repository — o formato de `StudyCard` e a ordem da fila não mudam com `Sem limite`
  - SPEC NEW-07, THM-02 · profile repository — padrões e persistência
  - SPEC SET-04 · profile repository — valor inválido rejeitado sem gravar
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Componentes e aplicação do tema

- **Covers**: THM-01, THM-03, THM-04, THM-05
- **Depends on**: T1
- **Risk**: HIGH
- **Touches**: `src/components/{segmented-control.tsx,settings-row.tsx,bottom-sheet.tsx}` e testes, `src/navigation/{use-apply-theme.ts,root-stack.tsx}` e testes
- **Change**: dois componentes, `selected` na folha, hook de tema no `RootStack`.
- **Tests**:
  - SPEC THM-01 · component — seleção, rótulos, alvo, claro e escuro
  - SPEC THM-03, THM-04 · navigation — `Automático` passa `"unspecified"`; preferência salva aplicada na primeira renderização com perfil
  - SPEC THM-05 · navigation — perfil ausente volta a `"unspecified"`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T4 — Tela Ajustes e rota

- **Covers**: SET-01, SET-02, SET-03, SET-04, THM-02, THM-03, THM-05, NEW-01, NEW-06
- **Depends on**: T2, T3
- **Risk**: HIGH
- **Touches**: `src/app/settings.tsx`, `src/navigation/root-stack.tsx`, `src/features/profile/screens/{settings-screen.tsx,use-settings-screen.ts,use-profile-screen.ts}` e testes, `src/features/screen-logic.test.ts` se exigir
- **Change**: tela, hook, rota, engrenagem navega, versão do app.
- **Tests**:
  - SPEC SET-01 · screen — engrenagem abre `/settings` e voltar retorna ao Perfil
  - SPEC SET-02 · screen — versão do app exibida
  - SPEC SET-03 · screen — sem perfil `/settings` não existe
  - SPEC THM-03 · screen — nota do modo Automático visível
  - SPEC THM-02, NEW-01 · screen — trocar tema e limite persiste e atualiza
  - SPEC SET-04 · screen — falha: toast e valor anterior
  - SPEC NEW-06 · screen — nova fila reflete o limite
  - SPEC THM-05 · screen — Sair devolve o tema ao sistema
- **Done when**: tests above pass; `npm run ci` green; lint limpo
- **Gate**: full
- **Status**: [x] done

### T5 — Documentação

- **Covers**: enabler for T4
- **Depends on**: T4
- **Risk**: LOW — documentation only, no behavior
- **Touches**: `ARCHITECTURE.md`, `.specs/PROJECT.md`, `.specs/STATE.md`, `sign-out-wipe` plan (Deferred)
- **Change**: modelo de dados, fila, tema; handoff.
- **Tests**: none — documentation change only
- **Done when**: `validate_state.py` sai 0
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2, T3 (arquivos disjuntos)
- **Wave 3**: T4
- **Wave 4**: T5

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Lembrete, horário, `Switch`, `SettingsRow` com `Switch` | Permissão e agendamento nativo | `daily-reminder` |
| Cartão Backup e nota "Tudo fica só neste aparelho" | Depende da F6 | F6 |
| Cap em "vencem hoje" | Fora do escopo | Sem destino |

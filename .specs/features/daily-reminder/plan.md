# Daily Reminder — Plan

**Spec**: [spec.md](spec.md)
**Risk**: HIGH (from spec, with override)
**Status**: Approved

## Approach

Duas peças. A preferência (`reminderEnabled`, `reminderHour`) vive no `Profile` (migração 5→6). O agendamento no SO fica atrás de um adaptador fino sobre `expo-notifications` (`src/lib/notifications.ts`). Uma feature nova `reminder` orquestra os dois num repositório com uma fila serial, de modo que o agendado sempre acompanha o salvo. Um hook no `RootStack` reconcilia os dois ao abrir o app, ao sair e ao restaurar, sem acoplar Sair e Backup à feature. A UI segue AD-001, AD-002, AD-005 e AD-007.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `BottomSheet` + `SheetAction` | `src/components/bottom-sheet.tsx` | Folha de horas, igual à de Novos por dia |
| `SettingsRow` | `src/components/settings-row.tsx` | Estender com `disabled`; linha Horário |
| `useToast` com `action` | `src/components/toast-provider.tsx` | Toast `Abrir ajustes` |
| `useApplyTheme` | `src/navigation/use-apply-theme.ts` | Modelo do hook de reconciliação no `RootStack` |
| `profileKeys`, `useProfile` | `src/features/profile` | Leitura e invalidação |
| `openTestRealm`, `renderRouterWithProviders` | `src/testing/` | Testes de repositório e de tela |

### Components and interfaces

- **Domínio** (`src/domain/reminder.ts`): `REMINDER_HOURS = [6..22]`, `DEFAULT_REMINDER_HOUR = 19`, `isReminderHour(n)`, `hourLabel(h) → "19:00"`, `REMINDER_TITLE`, `REMINDER_BODY`. Funções puras.
- **Adaptador** (`src/lib/notifications.ts`): implementa `ReminderScheduler`. `ensurePermission(): Promise<boolean>` (cria o canal Android antes; `getPermissionsAsync`; se não concedida e `canAskAgain`, `requestPermissionsAsync`; iOS lê `ios.status`), `hasPermission()` (sem pedir), `schedule(hour)` (cancela o identificador fixo `daily-reminder` e agenda `DAILY` com ele), `cancel()`, `openSystemSettings()` (`Linking.openSettings`), `configureNotificationHandler()` (banner, sem som nem selo). Único arquivo que importa `expo-notifications`.
- **Feature `reminder`** (`src/features/reminder/`):
  - `interfaces.ts`: `ReminderScheduler`, `ReminderInput {enabled?, hour?}`, `ReminderOutcome = "saved" | "denied"`, `ReminderRepository { apply(input); sync() }`.
  - `repository.ts`: `createReminderRepository(realm, scheduler = notificationsScheduler)`. `apply` e `sync` rodam numa fila serial (cada chamada espera a anterior). `apply`: lê o perfil; ao ligar chama `ensurePermission` e, se negada, devolve `"denied"` sem agendar nem salvar; senão agenda (ou cancela), grava no `Profile` e devolve `"saved"`. Em qualquer erro, chama `reconcile()` (cancela ou agenda conforme o salvo, engolindo erro) e relança. `sync`: sem perfil, cancela; desligado, cancela; ligado sem permissão, grava `desligado` e cancela; ligado com permissão, agenda no horário salvo.
  - `usecases/use-update-reminder.ts`: um `useMutation` → `repository.apply`; invalida `profileKeys.all`.
  - `usecases/use-sync-reminder.ts`: um `useMutation` → `repository.sync`; invalida `profileKeys.all` só quando o `sync` mudou o salvo.
  - `index.ts` exporta os dois hooks e `ReminderOutcome`.
- **Navegação** (`src/navigation/use-reminder-sync.ts`): lê `useProfile()` e dispara `useSyncReminder` num `useEffect` com deps `[id, reminderEnabled, reminderHour]` do perfil (ou `undefined`). Chamado em `RootStack`. Cobre REM-11 a REM-14.
- **Tela**: `use-settings-screen.ts` ganha `reminderEnabled`, `reminderHourLabel`, `toggleReminder`, `hourOpen/openHour/closeHour`, `hourActions`, `busy`. `settings-screen.tsx` ganha `SettingsSwitchRow` (novo, `src/components/settings-switch-row.tsx`, `Switch` do RN) e a linha Horário (`SettingsRow` com `disabled`). O toast de negação usa `openSystemSettings`.
- **Layout** (`src/app/_layout.tsx`): chama `configureNotificationHandler()` no módulo.

### Data

`Profile.reminderEnabled: bool (default false)`, `Profile.reminderHour: int (default 19)`; `schemaVersion` 6. A migração separa o bloco `<4` (já existente) de um bloco novo `<6` que preenche `false` e `19` (Realm não aplica defaults a objetos antigos). `Profile` (interface) ganha os dois campos; `toProfile` mapeia com `isReminderHour` (valor inválido vira 19). `ProfileInput`, o backup e `restore` não mudam: restaurar cria um `Profile` com defaults (REM-14).

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| REM-15, REM-16 | `apply` devolve `"denied"` | Toast `Ative as notificações…` com `Abrir ajustes`; Switch desligado |
| REM-17, REM-18 | `reconcile()` + relança | `onError` mostra `Não foi possível salvar.`; Switch volta ao salvo (vem do perfil) |
| REM-12 | `sync` grava `desligado` | Nada |
| REM-19 | `busy = isPending` dos hooks da tela; fila serial no repositório | Toques ignorados |
| `sync` falha | Engolido no hook (`onError` vazio), sem toast | Próxima abertura tenta de novo |

### Architecture impact

**Architecture impact**: ARCHITECTURE_UPDATE_REQUIRED — nova feature `reminder`, `src/lib/notifications.ts`, `expo-notifications` e o hook de reconciliação em `RootStack`.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Onde fica a orquestração | Feature `reminder` com repositório próprio e `scheduler` injetável | AD-001 exige uma chamada de repositório por hook; `apply` junta permissão, SO e Realm |
| Estado do Switch | Vem do `Profile` (React Query), sem estado local | Falha volta sozinha ao valor salvo (REM-17) |
| Reconciliar em `RootStack` | Hook por deps do perfil | Sair e restaurar mudam o perfil e cancelam sem tocar nas features profile e backup |
| Fila serial | Promessa encadeada no repositório | `sync` e `apply` nunca se intercalam (REM-10, REM-19) |
| Identificador fixo `daily-reminder` | Cancela e agenda com ele | No máximo uma notificação (REM-10) |
| Adaptador em `src/lib` | Fora de `features/` | `architecture.test.ts` restringe arquivos na raiz da feature |

## Alternatives Considered

| Option | Trade-offs | Verdict |
| --- | --- | --- |
| Repositório `reminder` + `sync` no `RootStack` | Mais uma feature; Sair e Backup intactos | Chosen |
| Estender o repositório `profile` com agendamento | Mistura Realm com API do SO; Sair e restaurar precisam chamar o SO | Rejected: quebra a separação de AD-001 |
| Lembrete só em estado local e `Notifications` como fonte da verdade | Sem migração; perde o estado ao limpar permissão e não faz backup do horário | Rejected: duas fontes sem reconciliação |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Assinatura de `scheduleNotificationAsync` (identificador, `DAILY`) não confirmada na doc lida | `src/lib/notifications.ts` | Agendamento duplicado ou erro de tipo | T3 lê os tipos em `node_modules/expo-notifications` após instalar e `tsc` valida |
| Config plugin exige novo binário | `app.json` | Funciona no Expo Go para local, mas o ícone/cor do Android só em build | UAT em development build; nota no handoff |
| Falsos verdes: Jest não exercita o SO | testes | Defeito só aparece no aparelho | UAT obrigatório (spec) em iOS e Android |
| `sync` e mutação do usuário competindo | repositório | Agendado diverge do salvo | Fila serial; teste de concorrência (REM-19) |

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Domain | unit | SPEC | `src/domain/reminder.test.ts` |
| Adaptador | unit com `jest.mock("expo-notifications")` | SPEC, CONTRACT | `src/lib/notifications.test.ts` |
| Repositório | integração com Realm em memória e `scheduler` fake com falha injetável | SPEC, INVARIANT | `src/features/reminder/repository.test.ts` |
| Hooks | wiring (dados simples, invalidação, offline) | SPEC | `src/features/reminder/usecases/*.test.tsx` |
| Tela | `renderRouterWithProviders` com `scheduler` fake | SPEC | `src/features/profile/screens/settings-screen.test.tsx` |
| Navegação | `root-stack.test.tsx` com Sair e restauração | SPEC | `src/navigation/*.test.tsx` |
| Migração | `realm.test.ts` abre arquivo v5 | SPEC | `src/db/realm.test.ts` |

INVARIANT (teste com `createRandom`): após qualquer sequência aleatória de `apply`/`sync` com falhas injetadas, o agendado do fake concorda com o salvo, e existe no máximo uma notificação.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest <arquivos afetados> && npx tsc --noEmit` | após cada tarefa |
| full | `npm run ci` | após cada onda, antes do Verify |

## Tasks

### T1 — Domínio do lembrete

- **Covers**: REM-02, REM-07 (texto), REM-09 (horas)
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/reminder.ts`, `src/domain/reminder.test.ts`
- **Change**: horas 6 a 22, padrão 19, rótulo `HH:00`, validação, título e corpo.
- **Tests**:
  - SPEC REM-09 · unit — `REMINDER_HOURS` é `6..22` em ordem; `hourLabel(6)` → `"06:00"`, `hourLabel(19)` → `"19:00"`
  - SPEC REM-02 · unit — `DEFAULT_REMINDER_HOUR` é 19; `isReminderHour(5)`, `(23)`, `(7.5)`, `("7")` → `false`
  - SPEC REM-07 · unit — título `Hora de revisar`, corpo `Seus cartões estão esperando. Leva só alguns minutos.`
- **Done when**: testes passam; quick verde
- **Gate**: quick
- **Status**: [x] done

### T2 — Campos e migração 5→6

- **Covers**: REM-02, MIG-01
- **Depends on**: T1
- **Risk**: HIGH
- **Touches**: `src/db/schemas/profile.ts`, `src/db/realm.ts`, `src/db/realm.test.ts`, `src/features/profile/{interfaces,adapters}.ts`, testes de perfil e backup que comparam `Profile` inteiro
- **Change**: dois campos no schema; `schemaVersion` 6; bloco de migração `<6`; `Profile` e `toProfile` expõem os campos.
- **Tests**:
  - SPEC MIG-01 · integração — arquivo v5 com perfil, baralho, cartão, log, tema `dark` e limite 20 abre em v6: tudo mantido, `reminderEnabled false`, `reminderHour 19`
  - SPEC REM-02 · integração — perfil novo tem `false` e `19`
  - SPEC REM-02 · unit — `toProfile` com `reminderHour` 4 → 19
  - REGRESSION — migração 3→4 continua preenchendo tema e limite; `SCH-07` passa a esperar 6
- **Done when**: testes passam; quick verde
- **Gate**: quick
- **Status**: [x] done

### T3 — Adaptador de notificações

- **Covers**: REM-07, REM-08, REM-10, REM-15, REM-16, REM-20
- **Depends on**: T1
- **Risk**: HIGH
- **Touches**: `package.json` (via `npx expo install expo-notifications`), `app.json` (plugin), `src/lib/notifications.ts`, `src/lib/notifications.test.ts`, `src/features/reminder/interfaces.ts` (tipo `ReminderScheduler`), `src/testing/notifications.ts` (fake), `src/app/_layout.tsx` (chama `configureNotificationHandler()`)
- **Change**: adaptador sobre `expo-notifications`, tipos conferidos em `node_modules`; fake em memória para os demais testes.
- **Tests**:
  - SPEC REM-20 · unit — `ensurePermission` no Android cria o canal `Lembrete diário` antes de pedir (ordem das chamadas)
  - SPEC REM-16 · unit — permissão negada e `canAskAgain false` → `false` sem chamar `requestPermissionsAsync`
  - SPEC REM-15 · unit — não decidida e usuário concede → `true`; usuário nega → `false`
  - SPEC REM-07 · unit — `schedule(19)` agenda `DAILY` `hour 19 minute 0` com título e corpo de T1
  - SPEC REM-10 · unit — `schedule` cancela antes o identificador fixo `daily-reminder` e agenda com ele
  - SPEC REM-08 · unit — o handler devolve banner e lista, sem som nem selo
  - CONTRACT · unit — iOS `PROVISIONAL` conta como concedida; `DENIED` e `NOT_DETERMINED` sem `canAskAgain` não
- **Done when**: testes passam; `tsc` limpo contra os tipos reais; quick verde
- **Gate**: quick
- **Status**: [x] done

### T4 — Ligar, desligar e mudar o horário (repositório e hook)

- **Covers**: REM-04, REM-05, REM-06, REM-09, REM-10, REM-15, REM-16, REM-17, REM-18
- **Depends on**: T2, T3
- **Risk**: inherit
- **Touches**: `src/features/reminder/{interfaces,repository,index}.ts`, `usecases/use-update-reminder.ts`, testes
- **Change**: `apply` com fila serial, permissão, compensação em falha e `ReminderOutcome`.
- **Tests**:
  - SPEC REM-04 · integração — ligar sem permissão decidida pede uma vez
  - SPEC REM-05 · integração — permissão concedida: agenda 19 e salva `true`
  - SPEC REM-06 · integração — desligar cancela e salva `false`
  - SPEC REM-15 · integração — negada: `"denied"`, nada agendado, salvo continua `false`
  - SPEC REM-16 · integração — negação definitiva devolve `"denied"` sem novo pedido
  - SPEC REM-09 · integração — mudar a hora de 19 para 8 salva 8 e reagenda às 8
  - SPEC REM-10 · integração — ligar duas vezes e mudar a hora deixam um só agendado
  - SPEC REM-17 · falha injetada — `schedule` lança: salvo inalterado, nada agendado, erro propagado
  - SPEC REM-18 · falha injetada — gravar falha após agendar cancela o agendado; `cancel` lança ao desligar: salvo continua `true` e o agendado volta a existir
  - SPEC REM-10 · propriedade — 100 operações aleatórias (`createRandom`) de `apply` com falhas injetadas: agendado concorda com salvo e há no máximo um
  - SPEC REM-17 · hook — devolve dados simples, invalida `profileKeys.all`, funciona offline e propaga o erro
- **Done when**: testes passam; `architecture.test.ts` passa para `reminder`; quick verde
- **Gate**: quick
- **Status**: [x] done

### T5 — Reconciliar agendado e salvo (`sync`)

- **Covers**: REM-11, REM-12, REM-13, REM-14, REM-19
- **Depends on**: T4
- **Risk**: inherit
- **Touches**: `src/features/reminder/{interfaces,repository}.ts`, `usecases/use-sync-reminder.ts`, testes
- **Change**: `sync` na mesma fila serial do `apply`.
- **Tests**:
  - SPEC REM-11 · integração — ligado e permitido: reagenda se o SO perdeu
  - SPEC REM-12 · integração — ligado sem permissão: grava `false` e cancela
  - SPEC REM-13 · integração — sem perfil: cancela
  - SPEC REM-14 · integração — desligado: cancela
  - SPEC REM-19 · concorrência — `apply` e `sync` disparados juntos terminam em ordem e o agendado concorda com o salvo
  - SPEC REM-11 · hook — dados simples, invalida só quando o `sync` mudou o salvo, offline
- **Done when**: testes passam; quick verde
- **Gate**: quick
- **Status**: [x] done

### T6 — Reconciliar ao abrir, sair e restaurar

- **Covers**: REM-11, REM-12, REM-13, REM-14
- **Depends on**: T5
- **Risk**: inherit
- **Touches**: `src/navigation/use-reminder-sync.ts`, `src/navigation/root-stack.tsx`, `src/navigation/root-stack.test.tsx`
- **Change**: `RootStack` chama `useReminderSync`; o efeito roda quando `id`, `reminderEnabled` ou `reminderHour` mudam.
- **Tests**:
  - SPEC REM-11 · integração — app abre com lembrete ligado e agendamento perdido → reagendado
  - SPEC REM-12 · integração — app abre com ligado e permissão revogada → salvo `false`, nada agendado, sem toast
  - SPEC REM-13 · integração — Sair com lembrete ligado → nada agendado
  - SPEC REM-14 · integração — restaurar backup com lembrete ligado → `reminderEnabled false` e nada agendado
  - REGRESSION — guarda do `RootStack` (AD-004) continua igual
- **Done when**: testes passam; quick verde
- **Gate**: quick
- **Status**: [x] done

### T7 — Linhas em Ajustes

- **Covers**: REM-01, REM-03, REM-04, REM-06, REM-09, REM-15, REM-17, REM-19
- **Depends on**: T4
- **Risk**: HIGH
- **Touches**: `src/components/{settings-switch-row,settings-row}.tsx` e testes, `src/features/profile/screens/{use-settings-screen.ts,settings-screen.tsx,settings-screen.test.tsx}`
- **Change**: `SettingsSwitchRow`; `SettingsRow` aceita `disabled`; hook de tela liga tudo (AD-005, sem lógica na tela, handlers nomeados).
- **Tests**:
  - SPEC REM-01 · tela — ordem `Lembrete diário`, `Horário 19:00`, `Cartões novos por dia`; subtítulo `Notificação local, funciona offline`; claro e escuro
  - SPEC REM-03 · tela — desligado: `Horário` com `accessibilityState.disabled` e toque não abre a folha
  - SPEC REM-04, REM-06 · tela — ligar agenda e o Switch fica ligado; desligar cancela
  - SPEC REM-09 · tela — com ligado, toque abre folha `06:00..22:00` com a atual marcada; escolher `08:00` salva, reagenda e fecha
  - SPEC REM-15 · tela — permissão negada: Switch desligado e toast `Ative as notificações nas configurações do aparelho.` com `Abrir ajustes` que chama `openSystemSettings`
  - SPEC REM-17 · tela — falha ao salvar: Switch volta e toast `Não foi possível salvar.`
  - SPEC REM-19 · tela — durante a mutação, novo toque no Switch e em `Horário` é ignorado
  - REGRESSION — Tema e Novos por dia continuam funcionando
  - CONTRACT · componente — `SettingsSwitchRow` expõe `role switch`, rótulo e estado
- **Done when**: testes passam; lint sem erro de AD-005; quick verde
- **Gate**: quick
- **Status**: [ ] pending

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2, T3 (arquivos disjuntos)
- **Wave 3**: T4
- **Wave 4**: T5, T7
- **Wave 5**: T6
- **Gate de onda**: `npm run ci` ao fim de cada onda

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Suprimir lembrete se já estudou hoje | Exige reagendar a cada sessão | Feature futura, se pedida |
| Minutos livres no horário | Decisão do usuário: horas cheias | Nunca, salvo pedido |
| Rota ao tocar na notificação | Fora do pedido | Feature futura |

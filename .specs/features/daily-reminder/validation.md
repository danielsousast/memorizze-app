# Daily Reminder — Validation

**Verdict**: PENDING (autor passou; falta verificador independente e UAT em aparelho)
**Risk**: HIGH (from spec, with override)
**Verifier**: author, context-reset (no independent agent run)
**Diff range**: `44c9393..2ef4253`
**Date**: 2026-10-12

## Gate

- **Command**: full gate (`npm run ci`)
- **Result**: 758 passed, 0 failed, 0 skipped @ `2ef4253`; lint e `tsc` limpos; cobertura de `src/domain/` acima de 90%
- **Test count**: 696 (baseline, 1 vermelho pré-existente em SOUT-02, corrigido em `1041b4c`) → 758
- **Skips**: none

## Acceptance Criteria Evidence

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| REM-01 | `Lembrete diário` (subtítulo, Switch), `Horário HH:00`, `Cartões novos por dia`, nesta ordem | `src/features/profile/screens/settings-screen.test.tsx:183` — ordem dos três títulos, subtítulo, `switch` e `Horário, 19:00` | SPEC | ✅ (claro; escuro usa só tokens do tema, conferir no UAT 6) |
| REM-02 | Padrão desligado e 19, perfis novos e migrados | `src/features/profile/repository.test.ts:114` — `reminderEnabled: false, reminderHour: 19`; `src/db/realm.test.ts:141`; `src/features/profile/adapters.test.ts:26` | SPEC | ✅ |
| REM-03 | `Horário` visível, desativada, `disabled`, não abre a folha | `src/features/profile/screens/settings-screen.test.tsx:197` — `disabled: true`, folha ausente; `src/components/settings-row.test.tsx:19` | SPEC | ✅ |
| REM-04 | Pede permissão se não decidida | `src/features/reminder/repository.test.ts:41` — `prompts` igual a 1 | SPEC | ✅ |
| REM-05 | Agenda no horário atual e salva ligado | `src/features/reminder/repository.test.ts:52` — `scheduledHour` 19, salvo `true` | SPEC | ✅ |
| REM-06 | Cancela e salva desligado | `src/features/reminder/repository.test.ts:62`; `settings-screen.test.tsx:218` | SPEC | ✅ |
| REM-07 | Título, corpo, diário, hora local | `src/lib/notifications.test.ts:125` — gatilho `daily`, `hour 19`, `minute 0`, título e corpo; `src/domain/reminder.test.ts:35` | SPEC | ✅ (disparo real: UAT) |
| REM-08 | Banner sem som nem selo com o app aberto | `src/lib/notifications.test.ts:160` — `shouldShowBanner true`, som e selo `false` | SPEC | ✅ (exibição real: UAT) |
| REM-09 | Folha 06:00 a 22:00, atual marcada, salva, reagenda, fecha | `settings-screen.test.tsx:230` — 17 horas, `19:00` marcada, `08:00` salva e agenda 8; `repository.test.ts:94` | SPEC | ✅ |
| REM-10 | No máximo um agendado; substitui | `src/lib/notifications.test.ts:135` — cancela `daily-reminder` antes de agendar; `repository.test.ts:105` | SPEC | ✅ |
| REM-11 | Ao abrir, reagenda se o SO perdeu | `src/navigation/root-stack.test.tsx:328`; `repository.test.ts:193` | SPEC | ✅ |
| REM-12 | Permissão revogada: salva desligado, sem aviso | `src/navigation/root-stack.test.tsx:336` — salvo `false`, nada agendado, sem toast | SPEC | ✅ |
| REM-13 | Sair cancela | `src/navigation/root-stack.test.tsx:348` — `scheduledHour` nulo | SPEC | ✅ |
| REM-14 | Restaurar deixa desligado e cancelado | `src/navigation/root-stack.test.tsx:359` — `reminderEnabled false`, `scheduledHour` nulo | SPEC | ✅ |
| REM-15 | Negada: Switch desligado, nada agendado, toast com `Abrir ajustes` | `settings-screen.test.tsx:252` — toast, Switch `checked: false`, `openSystemSettings` chamado; `repository.test.ts:73` | SPEC | ✅ |
| REM-16 | Negação definitiva cai em REM-15 sem pedido | `src/lib/notifications.test.ts:77` — sem `requestPermissionsAsync`; `repository.test.ts:84` — `prompts` 0 | SPEC | ✅ |
| REM-17 | Falha: valor volta, toast `Não foi possível salvar.` | `settings-screen.test.tsx:268` e `:280`; `repository.test.ts:116`, `:127` | SPEC | ✅ |
| REM-18 | Após falha, agendado concorda com o salvo | `repository.test.ts:139`, `:152`, `:164` — invariante em 100 operações aleatórias | SPEC, INVARIANT | ✅ |
| REM-19 | Toques ignorados durante a alteração | `settings-screen.test.tsx:294` — segundo toque e `Horário` ignorados; `repository.test.ts:248`, `:282` — fila serial | SPEC | ✅ |
| REM-20 | Canal Android `Lembrete diário` antes do pedido | `src/lib/notifications.test.ts:44` — ordem `channel`, `get`, `request` | SPEC | ✅ |
| MIG-01 | 5→6 mantém dados e preenche desligado e 19 | `src/db/realm.test.ts:141` — perfil, baralho, cartão, log, tema `dark`, limite 20, `false`, 19 | SPEC | ✅ |

## Discrimination

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| 1 | `src/features/reminder/repository.ts:75` | removeu `await reconcile()` do catch | ✅ (3 testes; após tornar o fake não atômico) |
| 2 | `src/features/reminder/repository.ts:44` | removeu `ensurePermission` ao ligar | ✅ (3 testes) |
| 3 | `src/features/reminder/repository.ts:19` | fila serial trocada por `Promise.resolve()` | ✅ (2 testes) |
| 4 | `src/features/reminder/repository.ts:66` | `sync` sem gravar `desligado` | ✅ (2 testes) |
| 5 | `src/features/profile/screens/use-settings-screen.ts:73,80` | removeu as guardas `busy` do Switch e de `Horário` | ✅ (REM-19) |

**Result**: 5 injected · 5 killed · 0 survived
**Isolation**: mutações aplicadas no próprio arquivo e revertidas na hora; `git diff` dos arquivos voltou vazio. Sem worktree.

## Amendments Reconciled

none (a correção de SOUT-02 em `1041b4c` alinhou a spec e o teste do `sign-out-wipe` ao texto já commitado em `44c9393`)

## UAT

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| 1 | iOS: ligar pede permissão, notificação chega no horário, banner com o app aberto | pendente | Exige development build |
| 2 | Android 13+: canal `Lembrete diário` existe, permissão pedida, notificação chega | pendente | Exige development build |
| 3 | Negar permissão: toast e `Abrir ajustes` abre os Ajustes do app | pendente | |
| 4 | Revogar nos Ajustes do sistema e reabrir: Switch desliga em silêncio | pendente | |
| 5 | Trocar o horário reagenda; Sair e restaurar cancelam | pendente | |
| 6 | Ajustes em modo escuro confere com o design 9 | pendente | |

## Change Review

- Scope matches spec In scope: ✅
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅ (`console.log` de depuração removido)
- Tests anchored and necessary: ✅

Desvios do plano, todos locais e sem mudar comportamento:

- `ReminderScheduler` tem 4 métodos; `openSystemSettings` e `configureNotificationHandler` são funções exportadas do adaptador, fora da interface.
- A fila serial é por `Realm` (`WeakMap`), não por instância, porque cada hook cria o seu repositório.
- `useReminderSync` espera a leitura do perfil antes de reconciliar, para um início lento não cancelar um agendamento válido.
- `jest.setup.ts` mocka `expo-notifications` (o módulo real avisa no import sob Jest).
- T3, T4 e T5 saíram num commit só (`c8f0d56`): o teste de arquitetura exige repositório e hooks na feature.

## Gaps & Fix Tasks

none. Pendentes fora do código: verificador independente (HIGH) e UAT.

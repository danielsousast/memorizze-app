# Daily Reminder — Validation

**Verdict**: PASS (verificador independente PASS; UAT F2, F4, F5, F7, F8 e F10 aprovado pelo usuário; plataforma de F2/F4/F5/F7 não informada, usuário confirmou "tá tudo ok")
**Risk**: HIGH (from spec)
**Verifier**: independent agent
**Diff range**: `44c9393..2ef4253` (HEAD `5cbb20f`, que só acrescenta docs)
**Date**: 2026-10-12

## Gate

- **Command**: `npm run ci` (expo lint && tsc --noEmit && jest --coverage), exit 0
- **Result**: 758 passed, 0 failed, 0 skipped (75 suites) @ `5cbb20f`
- **Test count**: baseline não fornecido ao verificador → 758
- **Skips**: none
- Cobertura de `src/domain`: 100% linhas, `reminder.ts` 100% em tudo.

## Acceptance Criteria Evidence

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| REM-01 | Ordem Lembrete diário / Horário / Cartões novos; subtítulo; Switch | `src/features/profile/screens/settings-screen.test.tsx:183` — `expect(order).toEqual(titles)`, subtítulo e `switch checked:false` | SPEC | ✅ (claro/escuro e fidelidade visual: UAT F2) |
| REM-02 | Padrão desligado, 19:00 (novos e migrados) | `src/domain/reminder.test.ts:18`; `src/features/profile/adapters.test.ts:26`; `src/db/realm.test.ts:141` (`reminderEnabled:false, reminderHour:19`); `settings-screen.test.tsx:197` (`Horário, 19:00`) | SPEC | ✅ |
| REM-03 | Horário visível, desativado, `disabled` a11y, não abre folha | `settings-screen.test.tsx:197` e `src/components/settings-row.test.tsx:19` — `disabled: true`, `onPress` não chamado | SPEC | ✅ |
| REM-04 | Pede permissão se indecisa | `settings-screen.test.tsx:205` — `expect(fake.state.prompts).toBe(1)`; `repository.test.ts:41` | SPEC | ✅ |
| REM-05 | Agenda no horário atual e salva ligado | `settings-screen.test.tsx:205` — `scheduledHour 19`, `reminderEnabled true`; `repository.test.ts:52` | SPEC | ✅ |
| REM-06 | Desligar cancela e salva desligado | `settings-screen.test.tsx:218` — `scheduledHour null`, `reminderEnabled false`; `repository.test.ts:62` | SPEC | ✅ |
| REM-07 | Título/corpo fixos, gatilho DAILY no horário, hora local | `src/lib/notifications.test.ts:125` — `toHaveBeenCalledWith({... trigger:{type:"daily",hour:19,minute:0,channelId}})`; `src/domain/reminder.test.ts:35` | SPEC | ✅ (disparo real: UAT F4/F7) |
| REM-08 | Banner sem som nem selo com app aberto | `src/lib/notifications.test.ts:160` — handler resolve `{shouldShowBanner:true, shouldPlaySound:false, shouldSetBadge:false}` | SPEC | ✅ (o handler; efeito real: UAT F5) |
| REM-09 | Folha 06:00–22:00, atual marcada, escolher salva/reagenda/fecha | `settings-screen.test.tsx:230` — 17 horas, `selected:true`, `reminderHour 8`, `scheduledHour 8`, folha fechada | SPEC | ✅ |
| REM-10 | No máximo uma agendada; substitui | `repository.test.ts:105`; invariante `repository.test.ts:164` (100 passos aleatórios com falhas); `notifications.test.ts:135` (cancel antes de schedule, id fixo) | SPEC | ✅ |
| REM-11 | Ao abrir, reagenda no horário salvo | `src/navigation/root-stack.test.tsx:328` — `scheduledHour toBe(8)`; `repository.test.ts:193`; `usecases/reminder.test.tsx:66` | SPEC | ✅ |
| REM-12 | Permissão revogada → salva desligado, sem aviso | `root-stack.test.tsx:336` — `reminderEnabled false`, `scheduledHour null`, sem toast; `repository.test.ts:203` | SPEC | ✅ |
| REM-13 | Sair cancela a notificação | `root-stack.test.tsx:348` — `scheduledHour null` após "Apagar e sair" | SPEC | ✅ |
| REM-14 | Restaurar backup: desligado e cancelada | `root-stack.test.tsx:359` — `reminderEnabled false`, `scheduledHour null` após restaurar | SPEC | ✅ |
| REM-15 | Negada: Switch off, nada agendado/salvo, toast + `Abrir ajustes` abre Ajustes | `settings-screen.test.tsx:252` — texto do toast, `checked:false`, `openSystemSettings` chamado 1x; `repository.test.ts:73` | SPEC | ✅ (abrir Ajustes real: UAT F8) |
| REM-16 | Recusa definitiva: cai em REM-15 sem pedido | `notifications.test.ts:77` — `requestPermissionsAsync not.toHaveBeenCalled`; `repository.test.ts:84` | SPEC | ✅ |
| REM-17 | Falha de agendar/cancelar/gravar: volta valor anterior + toast `Não foi possível salvar.` | `settings-screen.test.tsx:268` (switch) e `:280` (hora); `repository.test.ts:116,127` | SPEC | ✅ (falha de `cancel` ao desligar: `repository.test.ts:152`; falha de gravação só no repo `:139`) |
| REM-18 | Após falha, agendada concorda com salva | `repository.test.ts:139,152`; invariante `:164` | SPEC | ✅ |
| REM-19 | Em andamento, Switch e Horário ignoram toques | `settings-screen.test.tsx:294` (segura `cancel`, 2º toque e Horário ignorados); fila `repository.test.ts:248,282` | SPEC | ✅ |
| REM-20 | Canal Android `Lembrete diário` criado antes do pedido | `notifications.test.ts:44` — ordem `["channel","get","request"]` | SPEC | ✅ (Android 13+: UAT F10) |
| MIG-01 | 5→6 mantém nome, meta, baralhos, cartões, logs, prefs; preenche off/19 | `src/db/realm.test.ts:141` — arquivo v5 real migrado, `objectContaining({name, dailyGoal, themePreference, newCardsPerDay, reminderEnabled:false, reminderHour:19})` e contagens de Deck/Card/ReviewLog | SPEC | ✅ |

Busca de ACs sem teste: `grep -rnE "REM-[0-9]+|MIG-01" src` mostra todos os 20 REM e MIG-01 com pelo menos um teste; nenhum ❌.

## Discrimination

Scratch: cópia de `git archive 2ef4253` em `.../scratchpad/wt` (node_modules por symlink). Suítes: reminder, notifications, root-stack, profile, realm.

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| 1 | `src/db/realm.ts:18` | removeu `profile.reminderHour = 19` | ✅ (MIG-01 falhou) |
| 2 | `src/features/reminder/repository.ts` (catch de `apply`) | removeu `await reconcile()` | ✅ (3 falhas) |
| 3 | `src/features/reminder/repository.ts` (`syncNow`) | removeu gravação `reminderEnabled=false` | ✅ (4 falhas) |
| 4 | `src/features/profile/screens/use-settings-screen.ts` | removeu guardas `busy` do Switch e do Horário | ✅ (1 falha, REM-19) |
| 5 | `src/lib/notifications.ts:46` | `minute: 0` → `minute: 30` | ✅ (REM-07) |
| 6 | `src/features/reminder/repository.ts` (`applyNow`) | removeu `ensurePermission` / retorno `denied` | ✅ (5 falhas) |
| 7 | `src/features/reminder/repository.ts` (`enqueue`) | fila → `task()` direto (sem serialização) | ✅ (2 falhas) |
| 8 | `src/lib/notifications.ts:17` | canal Android desativado (`if (false)`) | ✅ (REM-20) |

**Result**: 8 injected · 8 killed · 0 survived
**Isolation**: scratch (cópia fora do repo); `git status --porcelain` da árvore real vazio antes de escrever este arquivo.

## Amendments Reconciled

Nenhuma emenda no spec (`Amendments: none`).

## UAT

Executado pelo usuário em development build em 2026-10-12:

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| F2 | Visual das linhas em Ajustes, claro e escuro, vs design 9 | pass | REM-01; usuário: "ok" (claro e escuro) |
| F4 | Notificação diária dispara de fato no horário escolhido (iOS e Android) | pass | REM-07; usuário: "ok" (primeiro e segundo plano; plataforma não informada) |
| F5 | Banner sem som/selo com app aberto | pass | REM-08; usuário: "ok" (plataforma não informada) |
| F7 | Funciona offline e no fuso local do aparelho | pass | REM-07; usuário: "ok" (plataforma não informada) |
| F8 | `Abrir ajustes` abre os Ajustes do sistema do app | pass | REM-15; usuário: "ok" (Android) |
| F10 | Android 13+: canal criado e permissão pedida | pass | REM-20; usuário: "tudo ok", inclui o check extra do gap 2 (limpar dados mantendo a permissão) |

## Change Review

- Scope matches spec In scope: ✅ (com ressalva em Gaps 3)
- No debug leftovers, secrets or disabled tests: ✅
- Tests anchored and necessary: ✅
- AGENTS.md Code Rules: sem ternários aninhados; nenhuma função inline em props JSX (`onValueChange={settings.toggleReminder}`, `onPress={settings.openHour}`, `actions={settings.hourActions}`); lógica em `use-settings-screen.ts`, `repository.ts`, `domain/reminder.ts`, `use-reminder-sync.ts`. `onPress` arrow dentro de `hourActions` (`use-settings-screen.ts`, useMemo) é dado de ação da folha, não prop JSX; mesmo padrão do limite de cartões.
- Migração Realm 5→6 (`src/db/realm.ts`): correta. `schemaVersion: 6`; os ifs `< 4` e `< 6` são independentes, então v3→v6 aplica ambos, e v4/v5→v6 aplica só o novo. Valores explícitos off/19 evitam o 0/false por falta de default em objetos antigos. Teste usa arquivo v5 real.
- Restrição: `setNotificationHandler` é chamado em módulo de `_layout.tsx` (efeito de importação), aceitável.

## Gaps & Fix Tasks

1. (minor) REM-17 só tem teste de falha de **gravação** no nível do repo (`src/features/reminder/repository.test.ts:139`); não há teste de tela com `realm.write` falhando. Comportamento coberto pela invariante, risco baixo.
2. (minor) `sync` no Android não cria o canal (`src/lib/notifications.ts`, `schedule` só usa `channelId`; o canal é criado apenas em `ensurePermission`). Se o canal sumir (limpeza de dados do app com permissão mantida), o reagendamento do REM-11 pode cair no canal padrão. Verificar em UAT F10; sem teste.
3. (minor, escopo) Mudanças fora do spec no mesmo range: `.specs/features/sign-out-wipe/spec.md:SOUT-02` (texto da mensagem encurtado) e `src/domain/labels.test.ts` / commit `1041b4c`. Não relacionadas ao lembrete; registrar como drive-by aceito pelo dono.
4. (info) REM-19 depende de `isPending` do React Query, que o teste avança com timer (`settings-screen.test.tsx:296-298`); a serialização real é garantida pela fila do repositório (`repository.test.ts:248,282`; mutante 7 morto).
5. (info) `schedule` faz `cancel` e depois `schedule` com o mesmo id; janela mínima sem notificação se o 2º passo falhar, coberta por REM-18 (reconcile).

Nenhum mutante sobreviveu e nenhum AC ficou sem evidência. O veredito só passa a PASS pleno depois do UAT do humano (F2, F4, F5, F7, F8, F10).

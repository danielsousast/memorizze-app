# i18n Strings — Plan

**Spec**: [spec.md](spec.md)
**Risk**: HIGH (from spec)
**Status**: Done

## Approach

Cada texto visível vira uma chave `t("area.chave")` do módulo `@/lib/i18n` (AD-009), com valores em `pt-BR.json`, `en.json` e `es.json`. Funções de `src/domain/` que devolvem texto passam a chamar `t` com `count` e interpolação; as tabelas de dias e meses saem de `dates.ts` e vão para o catálogo. Constantes de módulo com texto viram funções ou chamadas `t` dentro do hook. Uma ordem de ondas fecha uma área por vez, com a suíte pt-BR existente como regressão: os testes atuais passam sem edição porque o idioma padrão é pt-BR. Um teste-guarda impede texto fixo novo (AD-005 já separa lógica de UI, então os componentes só trocam literais por `t`).

## Design

### Research (feito)

Verificado em `i18n-js@4.5.4`: `t("c", { count })` escolhe `one`/`other` (0 vai para `other`, igual ao `plural()` atual); `{{n}}` e `%{n}` interpolam; chave numérica (`date.weekdays.0`) resolve; chave ausente em `es` cai no pt-BR com `enableFallback`; `i18n.onChange(cb)` existe.

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `t`, `i18n`, `syncLocale` | `src/lib/i18n/index.ts` | Chamar nas telas, hooks e domínio |
| `useLocaleSync` | `src/lib/i18n/use-locale-sync.ts` | Estender para devolver o locale |
| `resolveLocale` | `src/domain/locale.ts` | Acrescentar `es` |
| `plural` | `src/domain/text.ts` | Sai de uso; removido ao fim se sem chamadas |

### Components and interfaces

- **`AppLocale`** (`src/domain/locale.ts`): `"pt-BR" | "en" | "es"`.
- **Catálogos** (`src/lib/i18n/locales/*.json`): chaves agrupadas por área: `common`, `date`, `grade`, `deck`, `card`, `study`, `profile`, `settings`, `backup`, `reminder`, `nav`, `errors`.
- **`useLocale()`** (`src/lib/i18n/use-locale-sync.ts`): `useLocaleSync` passa a guardar o locale em estado e devolvê-lo; o `RootLayout` usa o valor como `key` do `RootStack`.
- **Datas** (`src/domain/dates.ts`): `formatLongDate`, `formatDayMonth`, `formatMonthYear`, `formatWeekdayShort` montam o texto de `date.weekdays.N`, `date.months.N` e do molde `date.longDate` / `date.dayMonth` / `date.monthYear` (ordem muda por idioma).
- **Teste-guarda** (`src/i18n-guard.test.ts`): varre arquivos de produção e falha em texto literal visível (I18NS-03).
- **Notificação** (`src/domain/reminder.ts`, `src/lib/notifications.ts`): `REMINDER_TITLE/BODY` e `CHANNEL_NAME` viram `reminderTitle()`, `reminderBody()` e `channelName()` chamados em `schedule`.

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| I18NS-10 chave ausente em en/es | `enableFallback` | Texto pt-BR |
| I18NS-11 texto capturado no carregamento | Funções/`t` na hora do uso; guarda varre `const X = "..."` de texto | Mensagem no idioma atual |

### Architecture impact

**Architecture impact**: ARCHITECTURE_UPDATE_REQUIRED — descrever `es`, os catálogos por área e o `key={locale}` na raiz; atualizar AD-009 (idiomas) e `i18n-setup` I18N-02 (emenda A-01).

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Domínio chama `t` direto | Sim, importa `@/lib/i18n` | Alternativa de passar `t` por parâmetro toca todas as chamadas; testes mudam o locale em `i18n.locale` |
| Convenção de chaves | `area.elemento`, plural em `{ one, other }` | Previsível; casa com `i18n-js` |
| Teste de idioma | `i18n.locale = "en"` no teste, restaurado em `afterEach` | Sem mock; usa a instância real |

## Alternatives Considered

| Option | Trade-offs | Verdict |
| --- | --- | --- |
| `t` global + `key={locale}` na raiz | Simples, poucas mudanças em telas; remonta a árvore na troca de idioma | Chosen |
| Hook `useT()` em cada componente | Re-render fino; toca ~80 componentes e hooks e o domínio fica de fora | Rejected: custo alto, domínio não usa hooks |
| Passar `t` como parâmetro às funções de domínio | Domínio puro | Rejected: quebra cada chamada e teste |
| Chaves por tela, sem compartilhar | Zero acoplamento | Rejected: duplica "Cancelar", "Salvar" e erros genéricos em `common` |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Constante de módulo congela o idioma | `use-*-screen.ts`, `use-import-flow.ts`, `card-form.ts` | Mensagem no idioma errado | I18NS-11 e guarda; trocar por função |
| Teste existente que casa texto pt-BR | `*.test.tsx` | Falha ao mudar redação | Manter o texto pt-BR idêntico ao atual |
| `key={locale}` remonta e perde navegação | `src/app/_layout.tsx` | Volta à raiz ao trocar idioma | Aceito (spec); só no evento raro |
| Plural de 0 em en/es | catálogos | `0 card` | `other` sem `zero`; teste I18NS-06 |
| Tradução ruim | `en.json`, `es.json` | Texto estranho | Revisão nativa registrada como pendência |

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Domínio e catálogos | unit | SPEC | `src/domain/*.test.ts`, `src/lib/i18n/*.test.ts` |
| Telas e componentes | component | SPEC, REGRESSION | `src/**/*.test.tsx` |
| Guarda | unit | SPEC | `src/i18n-guard.test.ts` |
| Reatividade | component | SPEC | `src/lib/i18n/use-locale-sync.test.tsx` |

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest <paths> && npx tsc --noEmit` | after each task |
| full | `npm run ci` | after each wave, before verify |

## Tasks

### T1 — Espanhol reconhecido e catálogo `es` com as mesmas chaves

- **Covers**: I18NS-01, I18NS-02, I18NS-10
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/locale.ts`, `src/domain/locale.test.ts`, `src/lib/i18n/index.ts`, `src/lib/i18n/locales/es.json`, `src/lib/i18n/i18n.test.ts`, `src/lib/i18n/config.test.ts`, `app.json`
- **Change**: `resolveLocale` devolve `es`; plugin com `es`; `es.json` com `common.appName`; teste de paridade cobre os três catálogos e valores não vazios.
- **Tests**:
  - SPEC I18NS-01 · unit — `es`, `es-ES`, `es-MX`, `es_AR` → `es`; `pt-PT` → `pt-BR`; `en-GB` → `en`; `fr` e `undefined` → `pt-BR`
  - SPEC I18NS-01 · unit — `app.json` lista `pt-BR`, `en`, `es` em iOS e Android
  - SPEC I18NS-02 · unit — chaves dos três catálogos iguais; nenhum valor de en/es vazio
  - SPEC I18NS-10 · unit — `es` sem a chave devolve o texto pt-BR
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Datas, rótulos e textos de domínio por idioma

- **Covers**: I18NS-05, I18NS-06, I18NS-07, I18NS-08, I18NS-11
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/domain/dates.ts`, `src/domain/labels.ts`, `src/domain/schedule.ts`, `src/domain/preferences.ts`, `src/domain/backup.ts`, `src/domain/stage.ts`, `src/domain/reminder.ts`, `src/lib/notifications.ts`, `src/features/decks/screens/deck-messages.ts`, `src/lib/i18n/locales/*.json`, testes dos mesmos arquivos
- **Change**: funções de domínio chamam `t`; tabelas de dia/mês vão ao catálogo; lembrete e canal Android viram funções; `plural` sai se ficar sem uso.
- **Tests**:
  - SPEC I18NS-07 · unit — 12/10/2026 em pt-BR, en e es → tabela do spec nas quatro funções; `formatWeekdayShort` de domingo a sábado nos três idiomas
  - SPEC I18NS-06 · unit — `tomorrowLabel`, `signOutMessage`, `reviewsLabel`, `streakTitle` com 0, 1, 2 nos três idiomas (`1 cartão`/`2 cartões`, `1 card`/`0 cards`, `1 tarjeta`/`2 tarjetas`)
  - SPEC I18NS-05 · unit — `deleteDeckMessage("Inglês", 3)` interpola o nome sem alterar
  - CONTRACT I18NS-08 · unit — `scheduleNotificationAsync` recebe `content.title/body` no idioma ativo
  - SPEC I18NS-08 · unit — `schedule(9)` com `en` envia título/corpo em inglês; `ensurePermission` no Android nomeia o canal em inglês
  - SPEC I18NS-11 · unit — trocar `i18n.locale` entre duas chamadas da mesma função muda o texto
  - REGRESSION · unit — suítes de domínio atuais (pt-BR) passam sem edição
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Componentes compartilhados e títulos de navegação

- **Covers**: I18NS-04
- **Depends on**: T2
- **Risk**: inherit
- **Touches**: `src/components/{confirm-dialog,bottom-sheet,text-field,toast,toast-provider,segmented-control,fab,badge,button,goal-progress,settings-row,settings-switch-row,not-found,icon}.tsx`, `src/navigation/root-stack.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/_layout.tsx` (texto "Abrindo banco de dados…"), catálogos, testes
- **Change**: rótulos de acessibilidade, botões padrão, títulos de aba e de rota e `NotFound` pelo catálogo.
- **Tests**:
  - SPEC I18NS-04 · component — `ConfirmDialog`, `NotFound` e `GoalProgress` em `en` e `es` mostram o texto do idioma
  - REGRESSION · component — testes atuais dos componentes (pt-BR) passam sem edição
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T4 — Decks e cartões

- **Covers**: I18NS-04, I18NS-05, I18NS-06, I18NS-11
- **Depends on**: T3
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/*`, `src/features/cards/screens/*`, `src/features/{decks,cards}/usecases/*` e `repository.ts` onde houver texto, catálogos, testes
- **Change**: telas, hooks de tela, validações (`use-deck-form`, `card-form`) e mensagens de erro pelo catálogo; constantes `*_ERROR` viram resolvidas no uso.
- **Tests**:
  - SPEC I18NS-04 · component — `HomeScreen`, `DeckScreen` e `CardEditorScreen` em `en` e `es`
  - SPEC I18NS-05 · component — botão "Estudar · 3 cartões" / "Study · 3 cards" / "Estudiar · 3 tarjetas"
  - SPEC I18NS-06 · unit — `deckSheetSubtitle(1, 0)` e `(2, 1)` nos três idiomas (`1 cartão`, `2 cartões · 1 para hoje`, etc.)
  - SPEC I18NS-11 · unit — erro de nome vazio/duplicado sai no idioma ativo após trocar o locale
  - REGRESSION · component — telas atuais (pt-BR) sem edição
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T5 — Sessão de estudo

- **Covers**: I18NS-04, I18NS-06
- **Depends on**: T3
- **Risk**: inherit
- **Touches**: `src/features/study/screens/*`, `src/features/study/usecases/*`, `src/features/study/repository.ts`, `src/domain/session.ts` se houver texto, catálogos, testes
- **Change**: `SessionView`, `SummaryView`, `EmptyView`, `HowToAnswerSheet`, botões de nota (`Errei`/`Difícil`/`Bom`/`Fácil`) e o erro de salvar pelo catálogo.
- **Tests**:
  - SPEC I18NS-04 · component — `SessionView`, `SummaryView` e `EmptyView` em `en` e `es`
  - SPEC I18NS-06 · component — resumo com 1 e 2 cartões revistos nos três idiomas
  - REGRESSION · component — testes atuais do estudo sem edição
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T6 — Perfil, ajustes, boas-vindas e backup

- **Covers**: I18NS-04, I18NS-05, I18NS-06, I18NS-11
- **Depends on**: T3
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/*`, `src/features/backup/screens/*`, `src/features/{profile,backup,reminder}/repository.ts` e `files.ts` onde houver texto, catálogos, testes
- **Change**: `ProfileScreen`, `SettingsScreen`, `WelcomeScreen`, `EditNameScreen`, `BackupScreen` e seus hooks pelo catálogo; erros de exportar/importar/restaurar e `NO_BACKUP_LABEL` no idioma ativo.
- **Tests**:
  - SPEC I18NS-04 · component — `ProfileScreen`, `SettingsScreen`, `BackupScreen` e `WelcomeScreen` em `en` e `es`
  - SPEC I18NS-05 · component — `BackupScreen` mostra contagens e a data do último backup interpoladas em `en`
  - SPEC I18NS-06 · unit — resumo do backup com 1 e 2 baralhos nos três idiomas
  - SPEC I18NS-11 · unit — erro de arquivo inválido sai no idioma ativo após trocar o locale
  - REGRESSION · unit — formato do arquivo de backup inalterado (testes de `backup.ts` atuais)
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T7 — Idioma reativo e teste-guarda

- **Covers**: I18NS-03, I18NS-09
- **Depends on**: T4, T5, T6
- **Risk**: inherit
- **Touches**: `src/lib/i18n/use-locale-sync.ts`, `src/lib/i18n/use-locale-sync.test.tsx`, `src/app/_layout.tsx`, `src/i18n-guard.test.ts`
- **Change**: `useLocaleSync` devolve o locale; `RootStack` usa `key={locale}`; teste-guarda varre a produção.
- **Tests**:
  - SPEC I18NS-09 · component — tela montada em `pt-BR`; `getLocales` passa a `en`; `AppState` emite `active` → o texto da tela muda para inglês; emitir `background` não muda
  - SPEC I18NS-03 · unit — a varredura passa na árvore atual; um arquivo fixture com `<Text>Olá</Text>` ou `title="Salvar"` faz a função de varredura reportar o achado
  - REGRESSION · full — `npm run ci` verde
- **Done when**: tests above pass; full gate green
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2
- **Wave 3**: T3
- **Wave 4**: T4, T5, T6 (arquivos disjuntos; só os catálogos JSON são compartilhados, então rodam em sequência ou com merge dos JSON por área)
- **Wave 5**: T7

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Reagendar o lembrete quando o idioma muda | Fora do spec | Nova feature, se pedido |
| Nome do app e `InfoPlist` por idioma | Config nativa | Nova feature |
| Revisão de en/es por falante nativo | Sem revisor | Pendência no handoff |

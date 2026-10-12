# i18n Setup — Plan

**Spec**: [spec.md](spec.md)
**Risk**: MEDIUM (from spec)
**Status**: Implemented (pending verify)

## Approach

`resolveLocale` é uma função pura em `src/domain/locale.ts`. `src/lib/i18n/` cria a instância `I18n` com os catálogos JSON, `defaultLocale` e fallback `pt-BR`, e define o locale na carga a partir de `getLocales()`. Um hook `useLocaleSync` no `RootLayout` reavalia o locale quando o `AppState` volta a `active`, como a doc do Expo pede para Android. Segue o padrão de `src/lib/notifications.ts` (setup app-wide em `lib`) e o AD-005 (lógica em domínio e hook).

## Design

### Components and interfaces

- `src/domain/locale.ts`: `type AppLocale = "pt-BR" | "en"`, `resolveLocale(tag: string | undefined): AppLocale`.
- `src/lib/i18n/index.ts`: `createI18n(translations)` e a instância `i18n` com `locale = resolveLocale(getLocales()[0]?.languageTag)`; `syncLocale()` reaplica o locale; exporta `t`.
- `src/lib/i18n/locales/pt-BR.json`, `en.json`: chave semente `common.appName`.
- `src/lib/i18n/use-locale-sync.ts`: `useLocaleSync()`, `AppState.addEventListener("change")` chama `syncLocale()` quando `active`.
- `app.json`: `["expo-localization", { "supportedLocales": { ... } }]`; o formato é conferido no plugin instalado.
- `jest.setup.ts`: mock de `expo-localization` com `getLocales` retornando pt-BR.

### Architecture impact

**Architecture impact**: ARCHITECTURE_UPDATE_REQUIRED — acrescentar `src/lib/i18n/` e `src/domain/locale.ts`.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Lib | `i18n-js` | Guia do Expo; sem dependências pesadas |
| Registro do AD | Novo `AD-009` em STATE.md na entrega | Decisão de projeto de difícil reversão |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Plugin muda o binário | `app.json` | Precisa de novo development build | Registrar no Handoff; não rodar `expo run` sem go-ahead |
| Formato de `supportedLocales` incerto | `app.json` | Prebuild falha | Ler o plugin instalado em T2 |

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Domínio | unit | SPEC | `src/domain/locale.test.ts` |
| lib | unit | SPEC, REGRESSION | `src/lib/i18n/*.test.ts(x)` |
| Config | unit | SPEC | `src/lib/i18n/config.test.ts` |

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest <paths> && npx tsc --noEmit` | after each task |
| full | `npm run ci` | after each wave, before verify |

## Tasks

### T1 — Resolver o locale do aparelho para pt-BR ou en

- **Covers**: I18N-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/locale.ts`, `src/domain/locale.test.ts`
- **Change**: função pura `resolveLocale`.
- **Tests**:
  - SPEC I18N-02 · unit — `pt-BR`, `pt-PT`, `pt` → `pt-BR`; `en-US`, `en-GB` → `en`; `es-ES`, `""`, `undefined` → `pt-BR`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Instalar as libs, configurar o plugin e criar a instância com catálogos

- **Covers**: I18N-01, I18N-03, I18N-04, I18N-05
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `package.json`, `package-lock.json`, `app.json`, `jest.setup.ts`, `src/lib/i18n/index.ts`, `src/lib/i18n/locales/pt-BR.json`, `src/lib/i18n/locales/en.json`, `src/lib/i18n/i18n.test.ts`, `src/lib/i18n/config.test.ts`
- **Change**: `npx expo install expo-localization i18n-js`; plugin com `pt-BR` e `en`; instância com fallback; mock global.
- **Tests**:
  - SPEC I18N-01 · unit — `app.json` tem o plugin `expo-localization` com `pt-BR` e `en` em iOS e Android
  - SPEC I18N-03 · unit — com `getLocales` em `en-US`, `i18n.locale` é `en`; em `pt-BR`, é `pt-BR`
  - SPEC I18N-04 · unit — `createI18n` com `en` sem a chave: `t("x")` devolve o texto pt-BR
  - SPEC I18N-05 · unit — chaves de `pt-BR.json` e `en.json` são iguais
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Atualizar o locale ao voltar para o primeiro plano

- **Covers**: I18N-06
- **Depends on**: T2
- **Risk**: inherit
- **Touches**: `src/lib/i18n/use-locale-sync.ts`, `src/lib/i18n/use-locale-sync.test.tsx`, `src/app/_layout.tsx`
- **Change**: `useLocaleSync` chamado no `RootLayout`.
- **Tests**:
  - SPEC I18N-06 · unit — `getLocales` passa de pt-BR para en e o `AppState` emite `active`: `i18n.locale` vira `en`; emitir `background` não muda
  - REGRESSION · unit — suíte existente continua verde (`npm run ci`)
- **Done when**: tests above pass; full gate green
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2
- **Wave 3**: T3

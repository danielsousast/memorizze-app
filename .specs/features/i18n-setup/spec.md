# i18n Setup — Spec

**Status**: Draft
**Date**: 2026-10-12

## Problem

Todas as strings do app estão fixas em pt-BR e não há infraestrutura de tradução. Antes de extrair as strings das telas, o app precisa de uma base de i18n: lib instalada, idiomas declarados no app, locale do aparelho detectado e catálogos prontos. Esta feature entrega só essa base; nenhuma tela muda.

## Scope

### In scope

- Instalar `expo-localization` e `i18n-js`; registrar o plugin no `app.json` com os idiomas suportados.
- Módulo `src/lib/i18n/` com a instância, o fallback e os catálogos `pt-BR` e `en`.
- Escolha do locale (pt-BR ou en) a partir do aparelho, na abertura e ao voltar para o primeiro plano.
- Mock de `expo-localization` nos testes.

### Out of scope

| Item | Reason |
| --- | --- |
| Extrair e traduzir as strings das telas | Próxima feature |
| Textos das notificações e do nome do app | Próxima feature |
| Formatação de datas e números (`Intl`), revisão de `backup.ts` | Próxima feature |
| Seletor de idioma em Ajustes | Fora do pedido; o idioma segue o aparelho |
| RTL | Só pt-BR e en (ambos LTR) |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | Escopo fechado: só instalação e configuração |
| criticality | none | Nenhuma tela usa o módulo ainda |
| blast_radius | low | Arquivos novos; edita só `_layout.tsx`, `app.json`, `jest.setup.ts` |
| novelty | medium | Primeira lib de i18n e primeiro plugin de locale do projeto |
| irreversibility | none | Reversível por revert; sem dados |
| integrations | none | Sem rede |
| state | low | Locale ativo guardado na instância em memória |
| auth | none | N/A |
| concurrency | none | N/A |
| migrations | none | Sem Realm |
| security | none | N/A |
| data_integrity | none | N/A |

**Declared level**: MEDIUM

## Acceptance Criteria

### P1 — Base de i18n instalada e configurada

- **I18N-01** — O `app.json` lista o plugin `expo-localization` com `supportedLocales` `pt-BR` e `en` para iOS e Android.
- **I18N-02** — `resolveLocale` devolve `"pt-BR"` para `pt-BR`, `pt-PT` e `pt`; `"en"` para `en-US` e `en-GB`; `"pt-BR"` para qualquer outro valor (`es-ES`, `""`, `undefined`).
- **I18N-03** — WHEN o módulo `@/lib/i18n` é carregado THEN `i18n.locale` SHALL ser `resolveLocale` do primeiro locale de `getLocales()`.
- **I18N-04** — IF uma chave não existe no catálogo do locale ativo THEN `t(chave)` SHALL devolver o texto do catálogo `pt-BR`.
- **I18N-05** — Os catálogos `pt-BR.json` e `en.json` têm exatamente o mesmo conjunto de chaves.

### P2 — Locale acompanha o aparelho

- **I18N-06** — WHEN o app volta ao primeiro plano (`AppState` = `active`) THEN o sistema SHALL reavaliar `getLocales()` e atualizar `i18n.locale`.

## Failure & Edge Behavior

- Locale ausente ou desconhecido cai em pt-BR (ver I18N-02).

Other dimensions: input validation, idempotency, auth, concurrency, state transitions, data lifecycle, external dependency, observability N/A porque a feature não tem entrada de usuário, dados nem rede.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Biblioteca | `i18n-js` | Guia oficial do Expo; leve | yes |
| Idiomas | pt-BR (padrão) e en | Pedido do usuário | yes |
| Catálogos iniciais | Uma chave semente `common.appName` = "Memorizze" nos dois | Permite testar sem extrair strings | no |
| Formato de `supportedLocales` | Conferido no plugin instalado antes de gravar | A doc do SDK 57 não detalha o formato | no |

**Open questions**: none

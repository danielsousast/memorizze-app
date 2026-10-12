# i18n Strings — Spec

**Status**: Approved
**Date**: 2026-10-12

## Problem

Todo texto visível do app está fixo em pt-BR, em telas, hooks, funções de domínio e na notificação. A base de i18n (`i18n-setup`) existe, mas nenhuma tela usa `t`, e o espanhol ainda não é um idioma suportado. Quem usa o aparelho em inglês ou espanhol vê o app em português.

## Scope

### In scope

- Adicionar `es` como terceiro idioma (amenda AD-009 e `i18n-setup`): `resolveLocale`, plugin no `app.json`, catálogo `es.json`.
- Trocar todo texto visível por chaves `t(...)`, com catálogos `pt-BR`, `en` e `es`: componentes compartilhados, títulos de navegação, telas, hooks de tela, mensagens de erro, funções de `src/domain/` que devolvem texto.
- Plurais e interpolação via `i18n-js` (`count`, `{{valor}}`).
- Datas por idioma (nomes de dia e mês e ordem), no lugar das tabelas fixas em pt-BR.
- Título e corpo do lembrete diário e nome do canal Android no idioma ativo.
- As telas passam a mostrar o novo idioma quando o aparelho muda e o app volta ao primeiro plano.
- Teste-guarda que falha se surgir texto fixo na UI.

### Out of scope

| Item | Reason |
| --- | --- |
| Seletor de idioma em Ajustes | AD-009: o idioma segue o aparelho |
| Nome do app na tela inicial e textos de permissão do SO (`InfoPlist`) | Exige config nativa por idioma; feature à parte |
| Reagendar o lembrete quando o idioma muda | O texto fica no idioma de quando foi agendado; reagendar ao reativar |
| Traduzir dados do usuário (nomes de baralho, texto de cartão) | Conteúdo do usuário |
| Mudar o formato do arquivo de backup | Backup não é texto de UI |
| Revisão de tradução por falante nativo | en e es escritos pelo agente; revisão humana fica como pendência |
| RTL | pt-BR, en e es são LTR |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | low | Escopo claro; só o mapeamento de `es-*` e a redação en/es são escolhas |
| criticality | low | Texto de UI; erro vira rótulo errado, não perda de dado |
| blast_radius | high | ~55 arquivos de produção: todas as telas, componentes e rótulos de domínio |
| novelty | low | Segue a base do `i18n-setup`; só plural e data por idioma são novos |
| irreversibility | none | Reversível por revert; sem dados |
| integrations | low | Texto da notificação local |
| state | low | Locale em memória; remonta a árvore ao mudar |
| auth | none | N/A |
| concurrency | none | N/A |
| migrations | none | Sem Realm |
| security | none | N/A |
| data_integrity | none | Backup e dados intocados |

**Declared level**: HIGH
**Override**: none (`risk.py` calcula HIGH por `blast_radius`)

## Acceptance Criteria

### P1 — Espanhol como idioma suportado

- **I18NS-01** — `resolveLocale` devolve `"es"` para `es`, `es-ES`, `es-MX` e `es_AR`; `pt-BR`, `en-US` e valores desconhecidos mantêm o resultado atual. O `app.json` lista `es` ao lado de `pt-BR` e `en` para iOS e Android.
- **I18NS-02** — `pt-BR.json`, `en.json` e `es.json` têm exatamente o mesmo conjunto de chaves, e nenhum valor de `en` ou `es` é vazio.

### P1 — Textos vêm do catálogo

- **I18NS-03** — Um teste-guarda varre `src/**/*.ts(x)` de produção (exceto catálogos, testes, `src/db` e `src/theme`) e falha se achar texto literal visível: texto JSX direto, ou literal em `title`, `label`, `subtitle`, `placeholder`, `accessibilityLabel`, `accessibilityHint`, `message`, `name`.
- **I18NS-04** — Given o locale `en`, When uma tela é renderizada, Then todos os textos visíveis estão em inglês; o mesmo vale para `es` em espanhol. Cada área (componentes, decks, cards, estudo, perfil, backup) tem ao menos um teste de tela por idioma.
- **I18NS-05** — Textos com valores (nome do baralho, contagens, minutos) interpolam o valor sem tradução do valor: `Estudar · 3 cartões` / `Study · 3 cards` / `Estudiar · 3 tarjetas`.
- **I18NS-06** — Plurais seguem as regras do idioma: contagem `1` usa o singular; `0` e `≥ 2` usam o plural (0 segue plural como hoje). Exemplos: `1 cartão`, `2 cartões`; `1 card`, `0 cards`; `1 tarjeta`, `2 tarjetas`.
- **I18NS-07** — Datas por idioma, para 12/10/2026 (segunda-feira):

  | Função | pt-BR | en | es |
  | --- | --- | --- | --- |
  | `formatLongDate` | Segunda-feira, 12 de outubro | Monday, October 12 | lunes, 12 de octubre |
  | `formatDayMonth` | 12 de outubro | October 12 | 12 de octubre |
  | `formatMonthYear` | outubro de 2026 | October 2026 | octubre de 2026 |
  | `formatWeekdayShort` | Seg | Mon | lun |

### P2 — Idioma ativo em todo o app

- **I18NS-08** — O título e o corpo do lembrete e o nome do canal Android saem no idioma ativo na hora de agendar.
- **I18NS-09** — WHEN o idioma do aparelho muda e o app volta ao primeiro plano THEN as telas montadas SHALL mostrar o novo idioma, sem reiniciar o app.

## Failure & Edge Behavior

- **I18NS-10** — IF uma chave falta em `en` ou `es` THEN `t` SHALL devolver o texto pt-BR (I18N-04, sem regressão).
- **I18NS-11** — Mensagens de erro e rótulos são resolvidos na hora do uso, não no carregamento do módulo; mudar o idioma muda a mensagem seguinte.

Other dimensions: input validation, idempotency, auth, concurrency, data lifecycle, external dependency N/A porque a feature só troca texto de apresentação.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Todo `es-*` usa um único catálogo `es` (espanhol neutro) | `es` | Evita catálogo por país | no |
| "card" em espanhol | "tarjeta" | Termo comum em apps de estudo | no |
| Traduções en e es | Escritas pelo agente | Pedido do usuário; revisão nativa depois | no |
| Montagem reativa ao mudar o idioma | `key={locale}` na raiz das telas | Simples; perde o estado de navegação só nessa troca rara | no |
| Plural de 0 | Mantém plural (`0 cartões`) | Preserva o comportamento atual | no |

**Open questions**: none

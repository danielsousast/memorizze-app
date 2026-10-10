# Deck & Card Screens — Plan

**Spec**: [spec.md](spec.md)
**Risk**: HIGH (from spec)
**Status**: Approved

## Approach

As rotas em `src/app/` são finas: leem os params e renderizam uma tela de `src/features/<f>/screens/`. As telas falam só com os hooks públicos de `@/features/decks` e `@/features/cards` (AD-001, AD-002). Elas não importam Realm, e a regra de lint de ARC-03 já cobre isso. A UI comum (botão, FAB, selo, campo, ícone de baralho, ícone) vive em `src/components/` e usa os tokens de `src/theme`. As regras puras ficam em `src/domain/`: datas, estágio, iniciais, plural e chave de busca. O `dueCount` entra no `Deck` pelo adapter, com o relógio `now` que o repositório já recebe. O Form de baralho e o Editor são rotas com `presentation: "modal"` no `Stack` raiz. Os testes de tela usam `renderRouter` (`expo-router/testing-library`) com Realm em memória e `QueryClient` reais.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| Hooks de baralho e cartão | `src/features/decks/index.ts`, `src/features/cards/index.ts` | Única fonte de dados das telas |
| Matriz de invalidação | `ARCHITECTURE.md#feature-modules` | Cartão criar/excluir já invalida `["decks"]`, então DUE-02 sai de graça |
| `now` na fábrica do repositório | `src/features/decks/repository.ts:10` | Relógio de `dueCount` |
| Tokens de tema e `useTheme` | `src/theme/` | Cores, tipografia, `sizes.minTouch`, raios |
| `openTestRealm`, `createRandom` | `src/testing/` | Realm em memória; seed do INV-02 |
| Providers de teste | `src/testing/providers.tsx` | Base do novo `renderRouterWithProviders` |
| `renderRouter`, `toHavePathname` | `expo-router/testing-library` (57.0.25) | Testes de tela com navegação real |
| `SymbolView` | `expo-symbols` (instalado) | Ícones nativos: SF Symbols no iOS, Material no Android |

### Components and interfaces

**Domínio (`src/domain/`, puro)**

- `dates.ts`: `endOfLocalDay(now: Date): Date`, `isDue(dueDate: Date, now: Date): boolean`, `formatLongDate(d: Date): string`. Nomes de dias e meses ficam em arrays pt-BR, sem `Intl`, para dar o mesmo resultado no Hermes e no Jest.
- `stage.ts`: `type CardStage = "new" | "learning" | "mature"`, `cardStage({ repetitions, intervalDays }): CardStage`, `stageLabel: Record<CardStage, string>`.
- `text.ts`:
  - `initials(name): string` (INI-01).
  - `plural(n, one, many): string` (`"1 cartão"`, `"2 cartões"`).
  - `searchKey(text): string`: minúsculas, sem acentos (`normalize("NFD")` e remove `̀-ͯ`), `trim`.
  - `matches(query, ...fields): boolean`.

**decks (mudança)**

- `interfaces.ts`: `Deck` ganha `dueCount: number`.
- `adapters.ts`: `toDeck(obj, now: Date)`. `dueCount = obj.cards.filtered("dueDate <= $0", endOfLocalDay(now)).length`.
- `repository.ts`: toda chamada a `toDeck` passa `now()`.

**Componentes (`src/components/`)**: um arquivo por componente, todos com `accessibilityRole` e `accessibilityLabel`, e toque ≥ `sizes.minTouch`.

| Componente | Props principais |
| --- | --- |
| `Button` | `label`, `onPress`, `variant: "primary" \| "secondary" \| "text" \| "danger"`, `disabled`, `icon?` |
| `Fab` | `label` (a11y), `onPress`, `text?` (estendido: "Adicionar cartão") |
| `Badge` | `text`, `tone: "accent" \| "neutral" \| "outline"`, `icon?` |
| `TextField` | `label`, `hint?`, `error?`, `multiline?`, `inputRef?`, demais `TextInputProps`; borda de foco `sizes.borderFocus` |
| `DeckIcon` | `name` → `initials(name)` em quadrado `sizes.deckIcon` |
| `Icon` | `name: "plus" \| "chevron-left" \| "more" \| "search" \| "check" \| "bulb"` → `SymbolView` com nome iOS e Android |
| `Screen` | `SafeAreaView` com `colors.background`, `KeyboardAvoidingView` opcional |
| `NotFound` | `title`, `actionLabel`, `onAction` (DECK-11, DFM-07, EDT-09) |

**Telas** (`src/features/<f>/screens/<nome>-screen.tsx`, uma por arquivo)

| Rota (`src/app/`) | Tela | Hooks |
| --- | --- | --- |
| `index.tsx` → `/` | `decks/screens/home-screen.tsx` | `useDecks` |
| `decks/[deckId]/index.tsx` | `decks/screens/deck-screen.tsx` | `useDeck`, `useCards`, `useDeleteDeck` |
| `decks/new.tsx` (modal) | `decks/screens/deck-form-screen.tsx` (`deckId?`) | `useDeck`, `useCreateDeck`, `useUpdateDeck` |
| `decks/[deckId]/edit.tsx` (modal) | idem, modo edição | idem |
| `decks/[deckId]/cards/new.tsx` (modal) | `cards/screens/card-editor-screen.tsx` (`deckId`) | `useDeck`, `useCreateCard` |
| `cards/[cardId]/edit.tsx` (modal) | idem (`cardId`) | `useCard`, `useUpdateCard`, `useDeleteCard` |

O `_layout.tsx` raiz declara as quatro rotas modais com `presentation: "modal"`. Telas que usam as duas features importam só os barrels públicos (`@/features/cards`).

**Teste**: `renderRouterWithProviders(routes, realm, initialUrl)` em `src/testing/router.tsx`. Ele monta um `_layout` falso com `RealmProvider realm={realm}`, um `QueryClient` de teste e um `Stack`, e chama `renderRouter`.

### Data

Sem mudança de schema. `dueCount` é derivado na leitura (Profile §4: estatísticas derivadas, nunca armazenadas).

### Error handling

| Failure (AC) | Handling | User sees |
| --- | --- | --- |
| DFM-05 | `mutate(..., { onError })` lê `error.code` e guarda a mensagem do campo | Texto sob `Nome`; valores mantidos |
| EDT-07 | Idem para `CARD_FRONT_EMPTY` / `CARD_BACK_EMPTY` | Texto sob `Frente` ou `Verso` |
| ERR-01 | Erro sem `code` de domínio (`!(e instanceof AppError)`) | `Não foi possível salvar. Tente de novo.` acima dos botões |
| DFM-06, EDT-08 | `disabled={mutation.isPending}` | Botões desativados |
| DECK-11, DFM-07, EDT-09 | Leitura `isSuccess` e `data === null` | `NotFound` com ação de voltar |
| LOAD-01 | `isPending` → renderiza só o cabeçalho | Nenhum estado vazio falso |

### Architecture impact

**Architecture impact**: ARCHITECTURE_UPDATE_REQUIRED. Mudam três coisas: `screens/` dentro das features (AD-003), `src/components/` e `src/domain/` (dates, stage, text). Também entram as rotas modais e o `dueCount` no `Deck`. A atualização é feita no Verify.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Onde ficam as telas | `src/features/<f>/screens/`; a rota só passa params (AD-003) | PROJECT-SPEC §9 ("telas + hooks"); `src/app/` só rotas (AGENTS.md) |
| Menu `⋯` | `Alert.alert` com 3 botões | Funciona em iOS e Android (Android aceita até 3), sem dependência |
| Confirmações | `Alert.alert` com botão `destructive` | Nativo; testável com `jest.spyOn(Alert, "alert")` |
| Ícones | `expo-symbols` (já instalado) | Sem nova dependência; nativo nas duas plataformas |
| Data por extenso | Arrays pt-BR próprios | Resultado determinístico, sem depender do ICU do Hermes |
| Busca | Filtro em memória sobre `searchKey` pré-calculada por cartão | 1.000 cartões é pouco; nada de consulta nova no repositório |
| Lista de cartões | `FlatList` sobre `[...cards].reverse()` | DECK-03 e PERF-01; CRD-02 continua na ordem de inserção |
| Após criar baralho | Fecha o modal e empurra `/decks/<id>` | DFM-02; voltar leva ao Início |
| Tarefas com 7–10 ACs (T1, T4, T5, T6, T8) | Mantidas inteiras | Cada uma é uma tela ou um modo, com ACs pequenos de exibição; dividir geraria tarefas sem comportamento próprio. Aviso do `validate_plan.py` aceito |
| Falha genérica em teste | `jest.spyOn(realm, "write")` lançando `Error` | Injeção de falha pontual; o Realm continua real |

## Alternatives Considered

| Option | Trade-offs | Verdict |
| --- | --- | --- |
| Telas em `src/features/<f>/screens/`, rotas finas | + coesão por feature, como PROJECT-SPEC §9; − telas cruzam features pelo barrel | Chosen (AD-003) |
| Telas inteiras dentro de `src/app/` | + menos arquivos; − mistura rota e UI, contra AGENTS.md; testes não podem viver em `src/app/` | Rejected |
| `src/screens/` de topo | + separa UI de dados; − dispersa a feature, foge do PROJECT-SPEC §9 | Rejected |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| `SymbolView` sem mock no Jest | `src/components/icon.tsx` | Testes de tela quebram | T3 renderiza `Icon` no Jest primeiro; se falhar, `fallback` + mock em `jest.setup.ts` |
| `renderRouter` com providers próprios | `src/testing/router.tsx` | Fiação errada nos testes de tela | T3 tem um CONTRACT test do helper (rota lê `useDecks`) |
| API de fechar modal e navegar (`dismiss`, `push`) | `deck-form-screen.tsx` | Pilha errada após criar | Conferir em `docs.expo.dev/versions/v57.0.0/sdk/router` na T5; teste checa pathname e o `back` |
| Flash de "não encontrado" após excluir | `deck-screen.tsx`, `card-editor-screen.tsx` | Tela pisca antes de voltar | Com `remove.isSuccess`, não renderiza `NotFound`; volta no `onSuccess` |
| Fuso nos testes de data | `src/domain/dates.test.ts` | Teste depende da máquina | Datas criadas com o construtor local `new Date(y, m, d, …)`; o oráculo do INV-02 compara componentes locais |
| Teclado cobre `Verso` e `Salvar` | Editor | Usabilidade | `Screen` com `KeyboardAvoidingView` e `ScrollView` `keyboardShouldPersistTaps="handled"`; checado no UAT |
| Asserções transversais rasas (L-001, candidata) | testes de tela | Mutantes vivos | A11Y-01, THM-01 e LOAD-01 têm asserção em cada tela que tocam |

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Domínio | unit | SPEC, INVARIANT | `src/domain/*.test.ts` |
| Repositório / hooks | integração com Realm em memória | SPEC, REGRESSION | `src/features/decks/repository.test.ts`, `src/features/*/usecases/*.test.tsx` |
| Componentes | Testing Library | SPEC, CONTRACT | `src/components/*.test.tsx` |
| Telas | `renderRouterWithProviders` + Realm real + `Alert` espionado | SPEC, INVARIANT, REGRESSION | `src/features/*/screens/*.test.tsx` |
| Arquitetura | unit + lint | REGRESSION | `src/features/architecture.test.ts` |

Regras de domínio são testadas uma vez, no domínio. As telas provam fiação e texto: o que aparece, para onde navega e o que fica gravado no Realm. O foco em `Frente` (EDT-03), o teclado, a apresentação modal e o visual contra `design/` (claro e escuro) ficam no UAT, em development build no iOS e no Android.

Mutações sugeridas ao verificador:
- `<=` → `<` em `isDue`.
- Inverter a precedência `repetitions` / `intervalDays` em `cardStage`.
- Remover `normalize` em `searchKey`.
- Não passar `now()` a `toDeck` no `create`.
- Remover `disabled={isPending}` no Form.
- Remover o `reverse()` da lista.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest <paths do task> && npx tsc --noEmit` | após cada task |
| full | `npm test && npx tsc --noEmit && npx expo lint` | após cada wave e antes do verify |

## Tasks

### T1 — Regras puras de vencimento, estágio e texto

- **Covers**: DAT-01, DAT-02, STG-01, INI-01, HOME-01, DECK-04, INV-02
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/dates.ts`, `src/domain/dates.test.ts`, `src/domain/stage.ts`, `src/domain/stage.test.ts`, `src/domain/text.ts`, `src/domain/text.test.ts`
- **Change**: `endOfLocalDay`, `isDue`, `formatLongDate`, `cardStage`, `stageLabel`, `initials`, `plural`, `searchKey`, `matches`.
- **Tests**:
  - SPEC DAT-01 · unit — `new Date(2026,9,9,0,0)` e `new Date(2026,9,9,23,59,59,999)` → `new Date(2026,9,9,23,59,59,999)`; `31/12` → mesmo dia, não o seguinte
  - SPEC DAT-02 · unit — due `9/10 23:59:59.999`, now `9/10 08:00` → `true`; due `10/10 00:00` → `false`; due `1/1/2020` → `true`
  - SPEC STG-01 · unit — `(0,30)` → `"new"`; `(1,20)` → `"learning"`; `(3,21)` → `"mature"`; labels `Novo`, `Aprendendo`, `Maduro`
  - SPEC INI-01 · unit — tabela do spec: `IN`, `JA`, `É`, `RE`, `#`
  - SPEC HOME-01 · unit — `formatLongDate(new Date(2026,9,9))` → `"Sexta-feira, 9 de outubro"`; domingo de 1º de março → `"Domingo, 1 de março"`
  - SPEC DECK-04 · unit — `matches("ESQUE", "esquecer")`, `matches("facil", "fácil")`, `matches("  ", "x")` → `true`; `matches("zz", "a", "b")` → `false`
  - INVARIANT INV-02 · unit — 1.000 pares aleatórios (`createRandom`, seed fixa) em ±400 dias → `isDue(d, n)` ⇔ (ano, mês, dia locais de `d`) ≤ (de `n`)
- **Done when**: tests above pass; cobertura de `src/domain/` ≥ 90%; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Baralhos informam quantos cartões vencem hoje

- **Covers**: DUE-01, DUE-02
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/features/decks/interfaces.ts`, `src/features/decks/adapters.ts`, `src/features/decks/repository.ts`, `src/features/decks/repository.test.ts`, `src/features/cards/usecases/cards.test.tsx`
- **Change**: `Deck.dueCount`; `toDeck(obj, now)`; o repositório passa `now()` em `list`, `getById`, `create` e `update`.
- **Tests**:
  - SPEC DUE-01 · integration — `now` fixo em 9/10 10:00; baralho com cartões de `dueDate` 8/10, 9/10 23:00 e 10/10 00:00 → `list()[0].dueCount === 2` e `getById(id).dueCount === 2`; baralho vazio → `0`
  - SPEC DUE-01 · integration — `create` e `update` devolvem `dueCount` (0 para novo)
  - SPEC DUE-02 · integration — `useDecks` montado; `useCreateCard` → `waitFor` `dueCount` +1; `useDeleteCard` → −1
  - REGRESSION · integration — suítes de repositório e hooks de decks/cards verdes sem afrouxar asserções; `toEqual` de objetos `Deck` ganha `dueCount` (mudança mandada por DUE-01)
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

### T3 — Componentes base acessíveis, rotas modais e helper de teste de tela

- **Covers**: A11Y-01
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/components/*.tsx`, `src/components/*.test.tsx`, `src/testing/router.tsx`, `src/testing/router.test.tsx`, `src/app/_layout.tsx`, `jest.setup.ts`, `.specs/TESTING.md`, `.specs/PROJECT.md`
- **Change**:
  - Cria `Button`, `Fab`, `Badge`, `TextField`, `DeckIcon`, `Icon`, `Screen` e `NotFound`.
  - Cria `renderRouterWithProviders`.
  - Declara as 4 rotas modais no `Stack` raiz.
  - TESTING.md ganha a camada Tela; PROJECT.md ganha `src/components` e `screens/`.
- **Tests**:
  - SPEC A11Y-01 · component — `Button`, `Fab`, `TextField` e `NotFound` → `accessibilityRole` `"button"` nos tocáveis, `accessibilityLabel` igual ao rótulo, `minHeight` (ou `hitSlop`) ≥ 44
  - SPEC A11Y-01 · component — `Button disabled` → `accessibilityState.disabled === true` e `onPress` não dispara
  - CONTRACT · component — `TextField error="x"` mostra `x`; sem `error`, nada (base de DFM-05/EDT-07)
  - CONTRACT · integration — `renderRouterWithProviders({ index: () => <Text>{useDecks().data?.length}</Text> }, realm)` com 2 baralhos → mostra `2`; `toHavePathname("/")`
  - CONTRACT · component — `Icon name="plus"` renderiza no Jest sem lançar
  - REGRESSION · suíte inteira verde (`_layout` alterado)
- **Done when**: tests above pass; full gate green
- **Gate**: full
- **Status**: [x] done

### T4 — Início lista baralhos com contagens e cria o primeiro baralho

- **Covers**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06, HOME-07, A11Y-02, THM-01, LOAD-01
- **Depends on**: T1, T2, T3
- **Risk**: inherit
- **Touches**: `src/app/index.tsx`, `src/features/decks/screens/home-screen.tsx`, `src/features/decks/screens/home-screen.test.tsx`
- **Change**: tela Início; o placeholder sai.
- **Tests**:
  - SPEC HOME-01 · screen — com `now` real, mostra `formatLongDate(new Date())` e `Olá`
  - SPEC HOME-02 · screen — 2 baralhos → `Seus baralhos`, `2 baralhos`, nomes na ordem de criação; 1 baralho → `1 baralho`
  - SPEC HOME-03 · screen — baralho "Inglês" com 1 cartão → `IN`, `Inglês`, `1 cartão`; nome com `numberOfLines={1}`
  - SPEC HOME-04 · screen — vencidos 2 → `2 hoje`; cartão com `dueDate` futuro (semeado via `realm.write`) → `Em dia`; vazio → sem selo
  - SPEC HOME-05 · screen — toque no item → `toHavePathname("/decks/<id>")`
  - SPEC HOME-06 · screen — sem baralhos → `Nenhum baralho ainda`, botão `Criar primeiro baralho` → `/decks/new`; sem FAB `Criar baralho`
  - SPEC HOME-07 · screen — com baralhos, FAB `Criar baralho` → `/decks/new`
  - SPEC A11Y-02 · screen — item com label `Inglês, 1 cartão, 1 para hoje`; com cartão futuro → `…, em dia`
  - SPEC THM-01 · screen — `useColorScheme` → `"dark"` → fundo `darkColors.background`
  - SPEC LOAD-01 · screen — antes de `useDecks` resolver, `Nenhum baralho ainda` não aparece
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

### T5 — Criar e editar baralho pelo form modal

- **Covers**: DFM-01, DFM-02, DFM-03, DFM-04, DFM-05, DFM-06, DFM-07, ERR-01
- **Depends on**: T3
- **Risk**: inherit
- **Touches**: `src/app/decks/new.tsx`, `src/app/decks/[deckId]/edit.tsx`, `src/features/decks/screens/deck-form-screen.tsx`, `src/features/decks/screens/deck-form-screen.test.tsx`
- **Change**: form único com modo criar/editar.
- **Tests**:
  - SPEC DFM-01 · screen — `/decks/new` → `Novo baralho`, campos `Nome` e `Descrição`, `Cancelar`, `Salvar`
  - SPEC DFM-02 · screen — digita ` Inglês ` + `Salvar` → Realm tem `Inglês`; pathname `/decks/<novo id>`; `back` → `/`
  - SPEC DFM-03 · screen — `/decks/<id>/edit` → campos com nome e descrição; troca o nome e apaga a descrição → Realm `name` novo, `description` ausente; volta ao Baralho
  - SPEC DFM-04 · screen — digita e toca `Cancelar` → Realm sem baralho novo; modal fechado
  - SPEC DFM-05 · screen — nome `"  "` → `Dê um nome ao baralho.`; nome existente → `Já existe um baralho com esse nome.`; texto digitado mantido; continua em `/decks/new`
  - SPEC DFM-06 · screen — dois `press` em `Salvar` no mesmo `act` → 1 baralho no Realm; durante a gravação, `Salvar` com `disabled`
  - SPEC DFM-07 · screen — `/decks/<id inexistente>/edit` → `Baralho não encontrado` + `Voltar`
  - SPEC ERR-01 · screen — `jest.spyOn(realm, "write")` lança `Error` → `Não foi possível salvar. Tente de novo.`; continua no form
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

### T6 — Baralho mostra detalhes e cartões com estágio

- **Covers**: DECK-01, DECK-02, DECK-03, DECK-06, DECK-11, PERF-01, LOAD-01, THM-01
- **Depends on**: T1, T2, T3
- **Risk**: inherit
- **Touches**: `src/app/decks/[deckId]/index.tsx`, `src/features/decks/screens/deck-screen.tsx`, `src/features/decks/screens/deck-screen.test.tsx`
- **Change**: tela Baralho com cabeçalho, selos e lista; busca e navegação na T10, menu `⋯` na T7.
- **Tests**:
  - SPEC DECK-01 · screen — mostra `Início` (volta para `/`), botão `Opções do baralho`, nome e descrição; sem descrição → nenhum texto de descrição
  - SPEC DECK-02 · screen — 3 cartões (1 vencido, 1 maduro com `intervalDays` 30 e `dueDate` futuro, 1 aprendendo futuro) → `3 cartões`, `1 para hoje`, `1 maduros`; nenhum vencido e nenhum maduro → só `N cartões`
  - SPEC DECK-03 · screen — cartões c1, c2, c3 → linhas na ordem c3, c2, c1; verso `"a\nb"` aparece `a b`; selos `Novo`/`Aprendendo`/`Maduro` conforme semeado
  - SPEC DECK-06 · screen — baralho vazio → `Nenhum cartão ainda`; sem campo `Buscar cartões`
  - SPEC DECK-11 · screen — `/decks/xyz` e id válido inexistente → `Baralho não encontrado`; `Voltar ao início` → `/`
  - SPEC PERF-01 · screen — 1.000 cartões semeados → menos de 100 linhas renderizadas
  - SPEC LOAD-01 · screen — antes de resolver, nem `Nenhum cartão ainda` nem `Baralho não encontrado`
  - SPEC THM-01 · screen — esquema escuro → fundo `darkColors.background`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

### T7 — Menu do baralho edita e exclui com confirmação

- **Covers**: DECK-09, DECK-10
- **Depends on**: T10
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/deck-screen.tsx`, `src/features/decks/screens/deck-screen.test.tsx`
- **Change**: `⋯` abre o `Alert` de opções; `Excluir baralho` abre a confirmação e exclui.
- **Tests**:
  - SPEC DECK-09 · screen — `Opções do baralho` → `Alert.alert` com botões `Editar baralho`, `Excluir baralho`, `Cancelar` (style `cancel`); `Editar baralho` → `/decks/<id>/edit`
  - SPEC DECK-10 · screen — baralho "Inglês" com 2 cartões → título `Excluir “Inglês”?`, mensagem `Os 2 cartões deste baralho também serão excluídos.`; com 1 → `O único cartão deste baralho também será excluído.` (A-01); vazio → sem mensagem
  - SPEC DECK-10 · screen — `Excluir` (`destructive`) → baralho e cartões fora do Realm; pathname `/`; Início sem o item
  - SPEC DECK-10 · screen — `Cancelar` → Realm inalterado; continua em `/decks/<id>`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

### T8 — Criar cartões pelo Editor

- **Covers**: EDT-01, EDT-02, EDT-03, EDT-06, EDT-07, EDT-08, EDT-09, ERR-01
- **Depends on**: T1, T3
- **Risk**: inherit
- **Touches**: `src/app/decks/[deckId]/cards/new.tsx`, `src/features/cards/screens/card-editor-screen.tsx`, `src/features/cards/screens/card-editor-screen.test.tsx`
- **Change**: Editor em modo criar.
- **Tests**:
  - SPEC EDT-01 · screen — `/decks/<id>/cards/new` → `Novo cartão`, `Cancelar`, `IN` + `Inglês`, `Frente` com `Pergunta ou termo`, `Verso` com `Resposta`, campos `multiline`, dica, `Salvar`, `Salvar e criar outro`
  - SPEC EDT-02 · screen — preenche e `Salvar` → cartão no Realm; volta a `/decks/<id>`; primeira linha mostra a frente e `Novo`
  - SPEC EDT-03 · screen — `Salvar e criar outro` → cartão no Realm; continua em `.../cards/new`; campos vazios (foco checado no UAT)
  - SPEC EDT-06 · screen — `Cancelar` → nenhum cartão novo; verso `"a\nb"` salvo → Realm `back === "a\nb"`
  - SPEC EDT-07 · screen — frente vazia → `Escreva a frente do cartão.`; verso vazio → `Escreva o verso do cartão.`; texto mantido; continua no Editor
  - SPEC EDT-08 · screen — dois `press` em `Salvar` no mesmo `act` → 1 cartão; durante a gravação os dois botões com `disabled`
  - SPEC EDT-09 · screen — baralho inexistente → `Baralho não encontrado` + `Voltar`
  - SPEC ERR-01 · screen — `realm.write` lança `Error` → mensagem genérica; continua no Editor
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T9 — Editar e excluir cartão pelo Editor sem tocar no agendamento

- **Covers**: EDT-04, EDT-05, EDT-08, EDT-09, INV-01
- **Depends on**: T8
- **Risk**: inherit
- **Touches**: `src/app/cards/[cardId]/edit.tsx`, `src/features/cards/screens/card-editor-screen.tsx`, `src/features/cards/screens/card-editor-screen.test.tsx`
- **Change**: Editor em modo edição, com `Excluir cartão`.
- **Tests**:
  - SPEC EDT-04 · screen — `/cards/<id>/edit` → `Editar cartão`, campos preenchidos, `Excluir cartão`, sem `Salvar e criar outro`; muda o verso e `Salvar` → Realm com o novo verso; modal fechado
  - SPEC EDT-05 · screen — `Excluir cartão` → `Alert` `Excluir cartão?` com `Cancelar`/`Excluir`; `Excluir` → cartão fora do Realm e o Baralho não o lista; `Cancelar` → cartão intacto
  - SPEC EDT-08 · screen — durante a exclusão pendente, `Salvar` e `Excluir cartão` com `disabled`
  - SPEC EDT-09 · screen — `/cards/<id inexistente>/edit` → `Cartão não encontrado` + `Voltar`
  - INVARIANT INV-01 · screen — cartão com agendamento semeado (`easeFactor` 1.9, `intervalDays` 6, `repetitions` 3, `lapses` 1, `dueDate` d); 20 edições com textos aleatórios (`createRandom`, seed fixa) pelo Editor → os 5 campos idênticos após cada uma
- **Done when**: tests above pass; full gate green
- **Gate**: full
- **Status**: [ ] pending

### T10 — Baralho busca cartões e abre o Editor

- **Covers**: DECK-04, DECK-05, DECK-07, DECK-08
- **Depends on**: T6
- **Risk**: inherit
- **Touches**: `src/features/decks/screens/deck-screen.tsx`, `src/features/decks/screens/deck-screen.test.tsx`
- **Change**: campo `Buscar cartões` filtrando com `matches`; FAB `Adicionar cartão`; toque na linha abre o Editor.
- **Tests**:
  - SPEC DECK-04 · screen — busca `ESQUE` → só o cartão com verso `esquecer`; `facil` → o cartão `fácil`; limpar → todos
  - SPEC DECK-05 · screen — busca `zzz` → `Nenhum cartão encontrado`
  - SPEC DECK-07 · screen — `Adicionar cartão` → `/decks/<id>/cards/new`
  - SPEC DECK-08 · screen — toque no cartão → `/cards/<cardId>/edit`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

## Execution Waves

- **Wave 1**: T1 ∥ T3
- **Wave 2**: T2 ∥ T5 ∥ T8
- **Wave 3**: T4 ∥ T6 ∥ T9
- **Wave 4**: T10 → T7 (mesmo arquivo)

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Contagens na virada do dia sem escrita | `staleTime: Infinity` (AD-002) | M3, com a sessão de estudo |
| Seletor de baralho no Editor, swipe, ordenação | Fora do escopo (context.md) | Feature futura |
| CI no GitHub Actions | Ainda não existe (PROJECT.md) | M0 pendente / M5 |

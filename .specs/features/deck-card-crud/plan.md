# Deck & Card CRUD — Plan

**Spec**: [spec.md](spec.md)
**Risk**: HIGH (from spec)
**Status**: Done

## Approach

Duas features, `src/features/decks/` e `src/features/cards/`, no padrão de AD-001. Cada repositório é uma fábrica síncrona sobre uma instância Realm (`createDeckRepository(realm, now)`) que valida, grava e devolve objetos simples via adapters. Cada hook de caso de uso embrulha um único método do repositório em um único `useQuery`/`useMutation`. As mutações invalidam os prefixos de query afetados no `onSuccess` (AD-002). O `QueryClient` roda em `networkMode: "always"`, porque o Realm é local. Os testes de repositório usam `openTestRealm`. Os testes de hook usam `RealmProvider realm={testRealm}` e um `QueryClient` novo por teste.

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| Schemas `Deck`, `Card`, `ReviewLog`, `Profile` | `src/db/schemas/` | Gravação e leitura nos repositórios |
| `openTestRealm` | `src/testing/realm.ts` | Realm em memória nos testes de repositório e hook |
| `RealmProvider` / `useRealm` | `@realm/react` (já instalado) | Instância Realm nos hooks; `realm={...}` aceita instância existente (`node_modules/@realm/react/dist/RealmProvider.d.ts:29`) |
| `RealmErrorBoundary` + `RealmProvider` | `src/app/_layout.tsx` | Recebe o `QueryClientProvider` por dentro |

### Components and interfaces

**Estrutura de pastas (ARC-01, ARC-05)**

```
src/features/<feature>/
  interfaces.ts        tipos simples, inputs, códigos de erro, contrato do repositório
  adapters.ts          Realm.Object → objeto simples (só se houver conversão)
  repository.ts        createXRepository(realm, now) + useXRepository(); único acesso ao Realm
  usecases/            um hook por arquivo (use-*.ts) + keys.ts (query keys)
  index.ts             API pública: hooks e tipos
  # um único caso de uso → use-*.ts na raiz, sem usecases/
```

**Compartilhado**

- **`AppError<C>`** (`src/domain/errors.ts`): `class AppError<C extends string> extends Error { readonly code: C }`. Puro, sem Realm nem React.
- **`createQueryClient()`** (`src/lib/query-client.ts`): `QueryClient` com `networkMode: "always"` e `retry: false` em queries e mutations, mais `staleTime: Infinity` em queries.
- **`renderHookWithProviders(hook, realm)`** (`src/testing/providers.tsx`): `renderHook` do RNTL dentro de `QueryClientProvider` (cliente novo, `gcTime: Infinity`) + `RealmProvider realm={realm}`. Devolve também o `queryClient`.

**decks**

- `interfaces.ts`
  - `Deck = { id: string; name: string; description?: string; createdAt: Date; cardCount: number }`
  - `DeckInput = { name: string; description?: string }`
  - `DeckErrorCode = "DECK_NAME_EMPTY" | "DECK_NAME_DUPLICATE" | "DECK_NOT_FOUND"`
  - `DeckRepository = { list(): Deck[]; getById(id: string): Deck | null; create(input: DeckInput): Deck; update(id: string, input: DeckInput): Deck; remove(id: string): void }`
- `adapters.ts`: `toDeck(obj: DeckObject): Deck`, com `id = _id.toHexString()` e `cardCount = cards.length`.
- `repository.ts`: `createDeckRepository(realm: Realm, now = () => new Date()): DeckRepository` e `useDeckRepository()` (chama `useRealm()`).
- `usecases/keys.ts`: `deckKeys = { all: ["decks"], detail: (id) => ["decks", id] }`.
- `usecases/`: `useDecks()`, `useDeck(id)`, `useCreateDeck()`, `useUpdateDeck()` (variables `{ id, input }`), `useDeleteDeck()` (variables `id`).

**cards**

- `interfaces.ts`
  - `Card = { id; front; back; easeFactor; intervalDays; repetitions; lapses; dueDate: Date; createdAt: Date }`
  - `CardInput = { front: string; back: string }`
  - `CardErrorCode = "CARD_FRONT_EMPTY" | "CARD_BACK_EMPTY" | "CARD_NOT_FOUND" | "DECK_NOT_FOUND"`
  - `CardRepository = { listByDeck(deckId): Card[]; getById(id): Card | null; create(deckId, input: CardInput): Card; update(id, input: Partial<CardInput>): Card; remove(id): void }`
- `adapters.ts`: `toCard(obj: CardObject): Card`.
- `repository.ts`: `createCardRepository(realm, now)` e `useCardRepository()`.
- `usecases/keys.ts`: `cardKeys = { all: ["cards"], byDeck: (deckId) => ["cards", "deck", deckId], detail: (id) => ["cards", "detail", id] }`.
- `usecases/`: `useCards(deckId)`, `useCard(id)`, `useCreateCard()` (variables `{ deckId, input }`), `useUpdateCard()` (variables `{ id, input }`), `useDeleteCard()` (variables `id`).

**Forma de um hook (ARC-02)**

```ts
export function useCreateDeck() {
  const repository = useDeckRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeckInput) => repository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deckKeys.all }),
  });
}
```

`useQueryClient` e `invalidateQueries` não acessam o banco. A regra "uma chamada" conta só `useQuery`/`useMutation` e métodos do repositório.

### Data

Sem mudança de schema. Regras de escrita:

- **Criar baralho:** `name.trim()`, `createdAt = now()`, `cards = []`.
- **Excluir baralho:** dentro de um único `realm.write`, `realm.delete(deck.cards)` e depois `realm.delete(deck)`.
- **Criar cartão:** `const t = now()`, depois `realm.create(Card, { front, back, createdAt: t, dueDate: t })` e `deck.cards.push(card)`, no mesmo `write`.
- **Editar cartão:** grava só `front`/`back`.
- **Excluir cartão:** `realm.delete(card)`. O Realm remove o cartão de `deck.cards`.
- **ids:** a UI usa `string` hex. Um id que não é um `ObjectId` válido (`BSON.ObjectId.isValid`) é tratado como inexistente.

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| DCK-06 | Valida antes do `realm.write` | `AppError` `DECK_NAME_EMPTY` lançado pelo repositório; `mutation.error.code` no hook |
| DCK-07 | Compara `trim().toLocaleLowerCase()` com os outros baralhos (exclui o próprio id no update) antes do `write` | `DECK_NAME_DUPLICATE` |
| DCK-08 | `objectForPrimaryKey` → `null` | `DECK_NOT_FOUND` (update, remove, criar cartão) |
| CRD-06 | Valida `front` antes de `back` | `CARD_FRONT_EMPTY` / `CARD_BACK_EMPTY` |
| CRD-07 | `objectForPrimaryKey` → `null` | `CARD_NOT_FOUND` |
| HK-04, HK-06 | Erro lançado antes do `write`; `onSuccess` não roda, nada é invalidado | `mutation.isError`, `error.code`; leituras inalteradas |

### Architecture impact

**Architecture impact**: ARCHITECTURE_UPDATE_REQUIRED — nova seção "Feature modules" (AD-001), React Query como camada de leitura/escrita da UI (AD-002), `src/lib/` e `src/domain/errors.ts`. Feito em T8 (exigido por ARC-04).

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Tipo do id na API das features | `string` hex | Tipos de `interfaces.ts` não importam `realm` (ARC-03); a UI não lida com BSON |
| Unicidade do nome | Comparação em JS, não `==[c]` do Realm | `[c]` do Realm não cobre todo Unicode; o número de baralhos é pequeno |
| Escopo da invalidação | Prefixo inteiro (`["decks"]`, `["cards"]`) | Leituras locais são baratas; dispensa saber o `deckId` do cartão (o Card não tem backlink) |
| Matriz de invalidação | Baralho criar/atualizar → `decks`; baralho excluir → `decks` + `cards`; cartão criar/excluir → `cards` + `decks`; cartão editar → `cards` | HK-02 |
| `staleTime: Infinity` | Dados só mudam por mutação, que invalida | Evita refetch inútil ao montar |
| `retry: false` | Erros locais são determinísticos | Repetir uma validação só atrasa o erro |
| Relógio | Parâmetro `now` na fábrica | Testes determinísticos de `createdAt`/`dueDate` |
| Erros | `AppError` em `src/domain/errors.ts` | Puro; reutilizável por study/profile |
| ARC-03 | `no-restricted-imports` no ESLint para `src/features/**`, exceto `repository.ts`, `adapters.ts` e `*.test.ts(x)` | Falha no `expo lint`, que já é gate |

## Alternatives Considered

| Option | Trade-offs | Verdict |
| --- | --- | --- |
| React Query sobre repositório síncrono, invalidação por prefixo | + padrão pedido, testável, objetos simples, cache explícito; − escritas fora dos hooks deixam cache velho | Chosen (AD-002) |
| `useQuery`/`useObject` do `@realm/react` (live) | + reatividade automática, zero cache; − devolve `Realm.Object` vivos, acopla telas ao Realm, contraria o pedido | Rejected: requisito explícito de React Query |
| React Query + `realm.addListener("change")` invalidando tudo | + cobre escritas fora dos hooks; − invalidação global a cada write, mais peças | Rejected por ora; reavaliar no M3 se surgir escrita fora de hooks |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Timers de `gcTime` do React Query mantêm o Jest aberto | `src/testing/providers.tsx` | Suíte não termina | Cliente de teste com `gcTime: Infinity`, `queryClient.clear()` no unmount; nunca usar `--forceExit` |
| `renderHook` do RNTL v14 pode ser assíncrono como `render` | `src/testing/providers.tsx` | Testes flutuantes | `await renderHookWithProviders(...)` e `waitFor` em toda asserção pós-mutação |
| `RealmProvider realm={x}` fechar a instância no unmount | `@realm/react` 0.20 | Erro "Realm closed" entre testes | O teste dono fecha o Realm no `afterEach`; T1 confirma o comportamento |
| Escrita futura fora dos hooks (M3) deixa cache velho | AD-002 | UI desatualizada | AD-002 obriga mutações via hooks; alternativa 3 fica como plano B |
| Acesso a um `Realm.Object` apagado lança | adapters | Crash em tela após exclusão | Adapters copiam campos na leitura (HK-05) |
| `@tanstack/react-query` com React 19.2 / Compiler | `package.json` | Incompatibilidade | Peer `react ^18 \|\| ^19` (npm view 5.104.1); instalar via `npx expo install` |

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Repositório | integração com Realm em memória | SPEC, INVARIANT | `src/features/*/repository.test.ts` |
| Hooks | `renderHook` + `RealmProvider` + `QueryClient` reais | SPEC, CONTRACT | `src/features/*/usecases/*.test.ts` |
| QueryClient | unit | CONTRACT | `src/lib/query-client.test.ts` |
| Arquitetura | unit (lê o sistema de arquivos) + lint | SPEC | `src/features/architecture.test.ts`, `eslint.config.js` |

As regras de negócio ficam no repositório. Os testes de hook provam só a fiação: dados simples, invalidação, offline e propagação de erro. Eles não repetem os casos de validação. Os INVARIANT rodam uma sequência pseudoaleatória com seed fixa de create/update/remove (100 operações), checando a propriedade após cada passo. Mutações sugeridas ao verificador: remover o `trim` na comparação de duplicado; remover `realm.delete(deck.cards)`; trocar a ordem front/back na validação; retirar `cards` da invalidação de `useDeleteDeck`; trocar `networkMode` para `"online"`.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest <paths do task> && npx tsc --noEmit` | após cada task |
| full | `npm test && npx tsc --noEmit && npx expo lint` | após cada wave e antes do verify |

## Tasks

### T1 — App fornece React Query configurado para dados locais

- **Covers**: enabler for T6, T7
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `package.json`, `package-lock.json`, `src/lib/query-client.ts`, `src/lib/query-client.test.ts`, `src/app/_layout.tsx`, `src/testing/providers.tsx`, `src/testing/providers.test.tsx`
- **Change**: `npx expo install @tanstack/react-query`; `createQueryClient()`; `QueryClientProvider` dentro do `RealmProvider` no layout raiz; helper `renderHookWithProviders`.
- **Tests**:
  - CONTRACT · unit — `createQueryClient().getDefaultOptions()` → queries `{ networkMode: "always", retry: false, staleTime: Infinity }`, mutations `{ networkMode: "always", retry: false }`
  - CONTRACT · integration — `renderHookWithProviders(() => useRealm(), realm)` devolve a mesma instância `realm`; após unmount `realm.isClosed === false`
  - REGRESSION · suíte existente verde (`realm-error-boundary.test.tsx`, `schemas.test.ts`)
- **Done when**: tests above pass; full gate green (lockfile muda)
- **Gate**: full
- **Status**: [x] done

### T2 — Criar, listar e obter baralhos com nome validado

- **Covers**: DCK-01, DCK-02, DCK-03, DCK-06, DCK-07, INV-01
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/errors.ts`, `src/features/decks/interfaces.ts`, `src/features/decks/adapters.ts`, `src/features/decks/repository.ts`, `src/features/decks/repository.test.ts`
- **Change**: `AppError`; tipos de decks; `toDeck`; `createDeckRepository` com `list`, `getById`, `create`; `useDeckRepository`.
- **Tests**:
  - SPEC DCK-01 · integration — `create({ name: "  Inglês ", description: "x" })` com `now` fixo → `{ name: "Inglês", description: "x", createdAt: now, cardCount: 0 }`, `id` hex de 24 chars; um objeto no Realm
  - SPEC DCK-02 · integration — três baralhos criados em t1 < t2 < t3, inseridos fora de ordem → `list()` na ordem t1, t2, t3; baralho com 2 cartões → `cardCount: 2`
  - SPEC DCK-03 · integration — `getById(id)` → baralho; `getById(new ObjectId().toHexString())` → `null`; `getById("xyz")` → `null`
  - SPEC DCK-06 · integration — `create({ name: "   " })` → `AppError` `DECK_NAME_EMPTY`; `realm.objects(Deck).length` inalterado
  - SPEC DCK-07 · integration — existindo "Inglês", `create({ name: " inglês " })` → `DECK_NAME_DUPLICATE`; contagem inalterada
  - INVARIANT INV-01 · integration — 100 operações `create` aleatórias (seed fixa) com nomes de um pool pequeno com variação de caixa/espaços → nunca dois nomes normalizados iguais
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Atualizar e excluir baralhos (com cascata)

- **Covers**: DCK-04, DCK-05, DCK-07, DCK-08, DCK-09, DCK-10, INV-02
- **Depends on**: T2
- **Risk**: inherit
- **Touches**: `src/features/decks/interfaces.ts`, `src/features/decks/repository.ts`, `src/features/decks/repository.test.ts`
- **Change**: `update` e `remove` no repositório de decks.
- **Tests**:
  - SPEC DCK-04 · integration — `update(id, { name: " Espanhol ", description: "y" })` → `name: "Espanhol"`, `description: "y"`; `createdAt` e ids de `cards` inalterados
  - SPEC DCK-10 · integration — baralho "Inglês" → `update(id, { name: "INGLÊS" })` aceito; nome gravado "INGLÊS"
  - SPEC DCK-07 · integration — `update` para o nome de outro baralho → `DECK_NAME_DUPLICATE`; valores inalterados
  - SPEC DCK-08 · integration — `update`/`remove` com id inexistente → `DECK_NOT_FOUND`; contagens inalteradas
  - SPEC DCK-05 · integration — baralho A com 3 cartões → `remove(A)` → `objectForPrimaryKey` de A e dos 3 cartões → `null`
  - SPEC DCK-09 · integration — baralho B com 2 cartões e 2 `ReviewLog` de cartões de A → após `remove(A)`, B tem 2 cartões e `realm.objects(ReviewLog).length === 2`
  - INVARIANT INV-02 · integration — 100 operações aleatórias de baralho (create/update/remove, seed fixa), com cartões semeados via `realm.write` → `realm.objects(Card).length` == soma de `deck.cards.length`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T4 — Criar, listar e obter cartões de um baralho

- **Covers**: CRD-01, CRD-02, CRD-03, CRD-06, DCK-08
- **Depends on**: T2
- **Risk**: inherit
- **Touches**: `src/features/cards/interfaces.ts`, `src/features/cards/adapters.ts`, `src/features/cards/repository.ts`, `src/features/cards/repository.test.ts`
- **Change**: tipos de cards; `toCard`; `createCardRepository` com `listByDeck`, `getById`, `create`; `useCardRepository`.
- **Tests**:
  - SPEC CRD-01 · integration — `create(deckId, { front: " a ", back: " b " })` com `now` fixo → `{ front: "a", back: "b", easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0, dueDate: now, createdAt: now }`; último item de `deck.cards`
  - SPEC CRD-02 · integration — cartões c1, c2, c3 criados em ordem → `listByDeck(deckId)` ids na ordem c1, c2, c3
  - SPEC CRD-03 · integration — `getById(id)` → cartão; id inexistente ou inválido → `null`
  - SPEC CRD-06 · integration — `{ front: " ", back: "b" }` → `CARD_FRONT_EMPTY`; `{ front: "a", back: "" }` → `CARD_BACK_EMPTY`; `{ front: "", back: "" }` → `CARD_FRONT_EMPTY`; nenhum `Card` gravado
  - SPEC DCK-08 · integration — `create(idInexistente, …)` → `DECK_NOT_FOUND`; nenhum `Card` gravado
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T5 — Editar e excluir cartões sem tocar no agendamento

- **Covers**: CRD-04, CRD-05, CRD-06, CRD-07, CRD-08, INV-03
- **Depends on**: T4
- **Risk**: inherit
- **Touches**: `src/features/cards/interfaces.ts`, `src/features/cards/repository.ts`, `src/features/cards/repository.test.ts`
- **Change**: `update` (só `front`/`back`, validados quando presentes) e `remove`.
- **Tests**:
  - SPEC CRD-04 · integration — cartão com agendamento alterado à mão (`easeFactor` 1.9, `intervalDays` 6, `repetitions` 3, `lapses` 1, `dueDate` d) → `update(id, { back: " novo " })` → `back: "novo"`, `front` igual, os seis campos de agendamento idênticos
  - SPEC CRD-06 · integration — `update(id, { front: "  " })` → `CARD_FRONT_EMPTY`; texto inalterado
  - SPEC CRD-07 · integration — `update`/`remove` com id inexistente → `CARD_NOT_FOUND`
  - SPEC CRD-05 · integration — `remove(id)` → `getById(id) === null` e `deck.cards` sem o id
  - SPEC CRD-08 · integration — cartão com 2 `ReviewLog` → após `remove`, os 2 logs existem com `cardId` igual
  - INVARIANT INV-03 · integration — sequência aleatória (seed fixa) de 100 operações de deck e card a partir de 5 `ReviewLog` semeados → os 5 logs continuam idênticos (ids, campos) e nenhum novo
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T6 — Hooks de baralho com cache invalidado e erros expostos

- **Covers**: HK-01, HK-02, HK-03, HK-04, HK-05, HK-06
- **Depends on**: T1, T3
- **Risk**: inherit
- **Touches**: `src/features/decks/usecases/*.ts`, `src/features/decks/usecases/decks.test.tsx`, `src/features/decks/index.ts`
- **Change**: `keys.ts` e os cinco hooks de baralho com a matriz de invalidação; barrel `index.ts`.
- **Tests**:
  - SPEC HK-01 · integration — `useDecks`, `useDeck`, `useCreateDeck`, `useUpdateDeck`, `useDeleteDeck` resolvem contra o Realm de teste (lista, item, criado, atualizado, excluído)
  - SPEC HK-05 · integration — `useDeck(id).data` não é `instanceof Realm.Object`; após excluir pelo hook, a referência guardada ainda lê `name` sem lançar
  - SPEC HK-02 · integration — `useDecks` + `useDeck(id)` montados; criar/atualizar/excluir via hooks → `waitFor` lista e item refletem o novo estado sem remount (item → `null` após excluir)
  - SPEC HK-03 · integration — `onlineManager.setOnline(false)` → `useDecks` chega a `isSuccess` e `fetchStatus !== "paused"`; `useCreateDeck` conclui (restaura `setOnline(true)` no `afterEach`)
  - SPEC HK-04 · integration — `useCreateDeck().mutateAsync({ name: "" })` → `error.code === "DECK_NAME_EMPTY"`
  - SPEC HK-06 · integration — após HK-04, `useDecks().data` igual (mesma referência) ao anterior
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T7 — Hooks de cartão atualizam cartões e contagem do baralho

- **Covers**: HK-01, HK-02, HK-04, HK-05
- **Depends on**: T1, T5, T6
- **Risk**: inherit
- **Touches**: `src/features/cards/usecases/*.ts`, `src/features/cards/usecases/cards.test.tsx`, `src/features/cards/index.ts`
- **Change**: `keys.ts` e os cinco hooks de cartão; barrel `index.ts`.
- **Tests**:
  - SPEC HK-01 · integration — `useCards`, `useCard`, `useCreateCard`, `useUpdateCard`, `useDeleteCard` resolvem contra o Realm de teste
  - SPEC HK-02 · integration — `useDecks` + `useCards(deckId)` montados; criar cartão → `cardCount` +1 e cartão na lista; excluir → `cardCount` −1 e fora da lista
  - SPEC HK-02 · integration — `useCards(deckId)` + `useCard(id)` montados; editar → ambos mostram o novo `front`
  - SPEC HK-05 · integration — `useCard(id).data` simples e legível após exclusão
  - SPEC HK-04 · integration — `useCreateCard` com `front` vazio → `error.code === "CARD_FRONT_EMPTY"`
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T8 — Padrão de arquitetura garantido e documentado

- **Covers**: ARC-01, ARC-02, ARC-03, ARC-04, ARC-05
- **Depends on**: T6, T7
- **Risk**: inherit
- **Touches**: `eslint.config.js`, `src/features/architecture.test.ts`, `ARCHITECTURE.md`, `.specs/PROJECT.md`, `.specs/TESTING.md`
- **Change**: regra `no-restricted-imports` (ARC-03); teste que percorre `src/features/*` (ARC-01/02/05); seção "Feature modules" no ARCHITECTURE.md com estrutura, regras, exemplo de hook e matriz de invalidação; `PROJECT.md` (estrutura, React Query na stack) e `TESTING.md` (camada Hook, `renderHookWithProviders`) atualizados.
- **Tests**:
  - SPEC ARC-01 · unit — cada pasta em `src/features/` tem `interfaces.ts` e `repository.ts`; arquivos fora de `usecases/` estão em {`interfaces.ts`, `adapters.ts`, `repository.ts`, `index.ts`, `use-*.ts`, `*.test.ts(x)`}
  - SPEC ARC-05 · unit — feature com `usecases/` tem ≥ 2 arquivos `use-*.ts` nela; sem `usecases/` tem ≤ 1 `use-*.ts` na raiz
  - SPEC ARC-02 · unit — cada `use-*.ts` tem exatamente 1 ocorrência de `useQuery(` ou `useMutation(` e exatamente 1 de `repository.<método>(`
  - SPEC ARC-03 · lint — `npx expo lint` passa; mutação manual: `import Realm from "realm"` em um `use-*.ts` → lint falha
  - SPEC ARC-04 · review — ARCHITECTURE.md tem a seção "Feature modules" citando AD-001/AD-002; STATE.md tem AD-001 e AD-002
- **Done when**: tests above pass; full gate green
- **Gate**: full
- **Status**: [x] done

## Execution Waves

- **Wave 1**: T1 ∥ T2
- **Wave 2**: T3 ∥ T4
- **Wave 3**: T5 ∥ T6
- **Wave 4**: T7
- **Wave 5**: T8

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Invalidação via `realm.addListener("change")` | Desnecessária enquanto toda escrita passa por hooks | Reavaliar no M3 (study) |
| `focusManager` com `AppState` | Dados locais não ficam velhos ao voltar do background | Nunca, salvo escrita externa |
| Contagem "vencem hoje" no `Deck` | Depende do módulo de datas do M1 | Feature da tela Início |

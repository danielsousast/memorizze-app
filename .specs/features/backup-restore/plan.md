# Backup and Restore — Plan

**Spec**: [spec.md](spec.md)
**Risk**: CRITICAL (from spec)
**Status**: Approved

## Approach

Camada pura em `src/domain/backup.ts` (montar, validar e ler o JSON, nome do arquivo, textos de data), uma feature nova `src/features/backup/` no molde de AD-001 (repositório com todo o acesso ao Realm, um hook por caso de uso, tela e hook de tela por AD-003/AD-006) e um adaptador fino `files.ts` que isola `expo-file-system`, `expo-sharing` e `expo-document-picker` para o teste trocá-los por doubles. Importar lê, parseia e valida o arquivo inteiro antes de abrir a transação, e a transação apaga e recria tudo (INV-01, INV-05). Segue AD-002 (hook de mutação invalida todas as queries, como `useSignOut`), AD-005 e AD-007 (`ConfirmDialog`, `useToast`).

## Design

### Reuse

| Existing | Location | Use |
| --- | --- | --- |
| `useSignOut` | `src/features/profile/usecases/use-sign-out.ts` | Mesmo padrão: transação única e `invalidateQueries()` |
| `ConfirmDialog`, `useToast`, `SettingsRow`, `Button`, `Screen` | `src/components/` | Diálogo destrutivo, toast com ação, linha de Ajustes |
| `useApplyTheme` | `src/navigation/use-apply-theme.ts` | Tema restaurado segue a leitura do perfil invalidada (BKP-12), sem código novo |
| `parseTheme`, `limitFromStored`, `THEME_OPTIONS` | `src/domain/preferences.ts` | Validar `themePreference` e `newCardsPerDay` do arquivo |
| `openTestRealm`, `createRandom` | `src/testing/` | Realm em memória e INVARIANT com semente |
| `useSettingsScreen`, `Stack.Protected` | `src/features/profile/screens/`, `src/navigation/root-stack.tsx` | Linha em Ajustes e rota `/backup` protegida |

### Components and interfaces

- **`src/domain/backup.ts`** (sem Realm, sem React): `BACKUP_VERSION = 1`, `MAX_BACKUP_BYTES = 20 * 1024 * 1024`; tipos `BackupFile`, `BackupSnapshot`; `buildBackup(snapshot, exportedAt): BackupFile`; `parseBackup(text): { ok: true; backup } | { ok: false; reason: "invalid" | "newer" }` (BKP-16, 17, 19); `backupFileName(date)`; `backupStatusLabel(last, now)`, `previousBackupLabel(prev)`, `settingsBackupSubtitle(last)` (BKP-07, 09); `formatCount(n)` com ponto de milhar.
- **`src/features/backup/interfaces.ts`**: `BackupRepository { counts(): BackupCounts; lastBackup(): { last: Date | null; previous: Date | null }; snapshot(): BackupSnapshot; restore(backup: BackupFile): void; markBackedUp(at: Date): void }`; `BackupErrorCode = "BACKUP_INVALID" | "BACKUP_NEWER" | "BACKUP_TOO_LARGE" | "BACKUP_RESTORE_FAILED" | "BACKUP_EXPORT_FAILED"`.
- **`src/features/backup/repository.ts`**: único acesso ao Realm. `restore` roda `realm.write` com `deleteAll()` e recria `Profile`, `Deck`, `Card` (ligados à lista `Deck.cards`) e `ReviewLog` com `_id` do arquivo; qualquer exceção desfaz a transação.
- **`src/features/backup/files.ts`**: `writeBackupFile(name, json): string` (cache, apaga o anterior, BKP-24), `shareBackupFile(uri)`, `pickBackupText(): Promise<string | null>` (recusa acima de `MAX_BACKUP_BYTES` pelo `size` do asset antes de ler, BKP-20).
- **`usecases/`**: `use-backup-counts`, `use-last-backup`, `use-export-backup` (snapshot → `buildBackup` → `writeBackupFile` → `shareBackupFile` → `markBackedUp`), `use-import-backup` (`parseBackup` → devolve o arquivo parseado para confirmação) e `use-restore-backup` (`repository.restore` + `invalidateQueries()`). Cada um faz uma chamada React Query (AD-001).
- **`screens/backup-screen.tsx` + `use-backup-screen.ts`**, rota `src/app/backup.tsx`; `use-import-flow.ts` compartilhado pela tela e pela Boas-vindas.

### Data

`Profile.lastBackupAt?: Date` e `Profile.previousBackupAt?: Date` (`"date?"`), `schemaVersion` 4→5. Aditivo, sem backfill em `onMigration`. Formato do arquivo v1:

```json
{ "app": "memorizze", "version": 1, "exportedAt": "2026-10-10T19:04:00.000Z",
  "profile": { "id": "…24 hex", "name": "", "dailyGoal": 20, "createdAt": "…", "studyTutorialSeen": false, "themePreference": "system", "newCardsPerDay": 10 },
  "decks": [{ "id": "", "name": "", "description": null, "createdAt": "" }],
  "cards": [{ "id": "", "deckId": "", "front": "", "back": "", "easeFactor": 2.5, "intervalDays": 0, "repetitions": 0, "lapses": 0, "dueDate": "", "createdAt": "" }],
  "reviewLogs": [{ "id": "", "cardId": "", "deckId": "", "grade": 0, "reviewedAt": "" }] }
```

### Error handling

| Failure (AC) | Handling | Caller / user sees |
| --- | --- | --- |
| BKP-16 JSON inválido, outro `app`, falha de validação | `parseBackup` devolve `invalid`; nada é gravado | Toast `Arquivo inválido. Escolha um backup do Memorizze.` |
| BKP-17 `version` > 1 | `parseBackup` devolve `newer` | Toast `Este backup é de uma versão mais nova do app.` |
| BKP-20 arquivo > 20 MB | `pickBackupText` recusa sem ler | Toast de BKP-16 |
| BKP-18 erro na transação | Realm desfaz; mutação lança `BACKUP_RESTORE_FAILED` | Toast `Não foi possível restaurar. Seus dados não foram alterados.` |
| BKP-21 falha ao escrever ou abrir a folha | Apaga o arquivo temporário; não chama `markBackedUp` | Toast `Não foi possível exportar.` |
| BKP-14 cancelar seletor ou diálogo | `pickBackupText` devolve `null` / diálogo fecha | Nada |
| BKP-22 | `isPending` das mutações desativa os dois botões | Botões desativados |

### Architecture impact

**Architecture impact**: ARCHITECTURE_UPDATE_REQUIRED — nova feature `backup`, três módulos Expo nativos (arquivos, compartilhar, seletor), `Profile` com dois campos e Realm na versão 5.

### Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Validar tudo antes de apagar | `parseBackup` é função pura chamada antes de `restore` | INV-05; a validação roda sem Realm e é testável por propriedade |
| ObjectId do arquivo | Mantém os `_id` originais | Referências de `ReviewLog` continuam válidas sem remapear |
| Datas de backup no arquivo | Não exportadas | BKP-03, BKP-13: o backup restaurado não finge ter sido feito |
| Isolar módulos nativos | `files.ts` com `jest.mock` nos testes | Sem módulo nativo no Jest; o resto roda com Realm real |

## Alternatives Considered

| Option | Trade-offs | Verdict |
| --- | --- | --- |
| Feature `backup` própria, validação pura, `restore` numa transação | +Testável sem UI; +INV-05 por construção; −feature nova com 3 módulos Expo | Chosen |
| Repositório de `profile` ganha `export`/`import` | +Menos arquivos; −`profile` passa a conhecer decks, cartões e arquivos, viola a fronteira de AD-001 | Rejected: mistura responsabilidades |
| Importar remapeando ids e mesclando | +Preserva dados atuais; −fora do escopo (AD-008) e exige resolver conflitos | Rejected: AD-008 manda substituir |
| `File.pickFileAsync` no lugar de `expo-document-picker` | +Uma dependência a menos; −docs da SDK 57 inconsistentes | Rejected |

## Failure Modes

| Path | Timeout | Duplicate | Partial success | Crash mid-way | Covered by |
| --- | --- | --- | --- | --- | --- |
| Exportar (escrever, compartilhar, `markBackedUp`) | Sem timeout; a folha é do sistema | Toque duplo bloqueado por `isPending`; arquivo anterior apagado | Arquivo escrito e folha falha: arquivo apagado, data não muda | App morto antes de `markBackedUp`: data fica antiga, nada se perde | BKP-21, BKP-22, BKP-24 |
| Importar (ler, validar, confirmar) | Seletor sem timeout | Importar duas vezes dá o mesmo estado | Arquivo parcial ou truncado rejeitado na validação antes de qualquer escrita | Antes da transação: nada muda. Dentro: Realm desfaz ao reabrir | INV-01, INV-03, INV-05, BKP-16, BKP-18 |
| Transação `restore` | — | `deleteAll` + `create` determinísticos pelo arquivo | Exceção no meio desfaz tudo (injetada em teste) | Realm é atômico; sem escrita parcial | INV-01, BKP-18 |
| Migração 4→5 | — | — | Campos opcionais, sem backfill | Realm refaz a migração ao reabrir | BKP-27 |

## Risks & Mitigations

| Risk | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| `shareAsync` não informa cancelamento | `src/features/backup/files.ts` | Data de backup marcada sem arquivo salvo | A-01 muda BKP-04/05; texto do toast `Backup exportado`; UAT no aparelho |
| Arquivo grande demora a parsear | `parseBackup` | UI trava segundos em 20 MB | Limite de 20 MB (BKP-20); mutação assíncrona com botões desativados |
| `deleteAll()` apaga também objetos de outros modelos futuros | `repository.ts` | Perda de dado de modelo novo | Teste `schemas` lista os 4 modelos; `restore` apaga por modelo, não `deleteAll` |
| Realm exige `_id` único ao criar com id do arquivo | `repository.ts` | Exceção no meio da transação | Validação rejeita ids repetidos (BKP-19) e o Realm desfaz o resto |
| Documento escolhido está em nuvem (iCloud) e não baixou | `files.ts` | Leitura falha | Cai em BKP-16 (arquivo ilegível é inválido); `copyToCacheDirectory: true` |

## Rollback

- **Point of no return**: o `commit` da transação de `restore` (BKP-11). Antes dele, nada muda; depois, os dados antigos só voltam se o usuário tiver um backup deles.
- **Undo / compensate**: o diálogo de BKP-25 avisa que substitui tudo; a tela mostra o último backup. Não há desfazer no app; quem quer segurança exporta antes. Reverter o código não devolve o Realm à versão 4, porque o Realm não faz downgrade: um build com `schemaVersion` 4 não abre um arquivo já migrado. Um revert mantém `schemaVersion` 5 e os dois campos opcionais.
- **Rehearsal**: INV-01 e BKP-18 por falha injetada no teste de repositório; UAT no aparelho com dados descartáveis e sua autorização antes de importar sobre dados reais.

## Test Strategy

| Layer | Test type | Origins used | Location pattern |
| --- | --- | --- | --- |
| Domain | unit + property (seeded, 100+ iterações) | SPEC, INVARIANT | `src/domain/backup.test.ts` |
| Repository / Realm | integration, Realm em memória, falha injetada | SPEC, INVARIANT, REGRESSION | `src/features/backup/repository.test.ts`, `src/db/realm.test.ts` |
| Hook | wiring, invalidação, estado `isPending` | SPEC | `src/features/backup/usecases/*.test.tsx` |
| Screen | router + Realm em memória, `files.ts` com `jest.mock` | SPEC, REGRESSION | `src/features/*/screens/*.test.tsx` |

Discriminação (Verify): ≥ 5 mutações manuais, zero sobreviventes. Alvos: `deleteAll` antes da validação; remover a checagem de `deckId`; aceitar `version` 2; gravar `lastBackupAt` antes de compartilhar; não apagar o arquivo antigo; restaurar sem `invalidateQueries`.

## Verification Commands

| Gate | Command | When |
| --- | --- | --- |
| quick | `npx jest <arquivos da tarefa> && npx tsc --noEmit` | after each task |
| full | `npm run ci` | after each wave, before verify |

## Tasks

### T1 — Montar e validar o arquivo de backup

- **Covers**: BKP-02, BKP-16, BKP-17, BKP-19, INV-02, INV-04
- **Depends on**: none
- **Risk**: inherit
- **Touches**: `src/domain/backup.ts`, `src/domain/backup.test.ts`
- **Change**: `buildBackup`, `parseBackup`, `backupFileName` e `MAX_BACKUP_BYTES` puros. `parseBackup` aceita só um arquivo versão 1 com referências íntegras.
- **Tests**:
  - SPEC BKP-02 · unit — snapshot com 1 baralho, 2 cartões, 3 revisões → JSON com `app`, `version: 1`, `exportedAt` ISO UTC, ids de 24 hex e `deckId` em cada cartão
  - SPEC BKP-16 · unit — texto não JSON, `app: "outro"`, perfil ausente → `{ ok: false, reason: "invalid" }`
  - SPEC BKP-17 · unit — `version: 2` válido em tudo mais → `{ ok: false, reason: "newer" }`
  - SPEC BKP-19 · unit — uma entrada por regra (nome com 31 caracteres, id repetido, id não hex, data inválida, `grade` 4, cartão com `deckId` inexistente, revisão com `cardId` inexistente, `intervalDays` negativo, `easeFactor` 1,2, número `NaN`) → `invalid`
  - INVARIANT INV-02 · unit — 200 snapshots aleatórios com semente (Unicode, `\n`, aspas, `description` ausente, datas nos limites) → `parseBackup(JSON.stringify(buildBackup(s)))` devolve os mesmos dados
  - INVARIANT INV-04 · unit — 200 arquivos válidos mutados em uma referência (`deckId`, `cardId`) → sempre `invalid`; os não mutados passam
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T2 — Restaurar tudo numa transação e migrar o Realm

- **Covers**: BKP-03, BKP-13, BKP-18, BKP-23, BKP-27, INV-01, INV-03, INV-05
- **Depends on**: T1
- **Risk**: inherit
- **Touches**: `src/db/schemas/profile.ts`, `src/db/realm.ts`, `src/db/realm.test.ts`, `src/features/backup/interfaces.ts`, `src/features/backup/repository.ts`, `src/features/backup/repository.test.ts`, `src/features/backup/adapters.ts`, `src/features/backup/index.ts`, `src/features/backup/usecases/` (`keys.ts`, `use-backup-counts.ts`, `use-last-backup.ts`, `backup.test.tsx`), `src/db/schemas/schemas.test.ts`
- **Change**: `Profile` ganha `lastBackupAt` e `previousBackupAt`, schema 5; os dois hooks de leitura (ARC-02 exige ao menos um hook por feature; `markBackedUp` fica para a T3); o repositório lê o snapshot completo, conta registros, marca a data de backup e restaura apagando e recriando perfil, baralhos, cartões e revisões numa só `realm.write`.
- **Tests**:
  - SPEC BKP-03 · integration — banco com dados completos → `snapshot()` traz todos os campos e nenhuma data de backup
  - SPEC BKP-13 · integration — `restore` de um arquivo → `lastBackup()` devolve `{ last: null, previous: null }`
  - SPEC BKP-23 · integration — banco sem baralhos → `snapshot()` com listas vazias; `restore` de listas vazias deixa só o perfil
  - SPEC BKP-27 · integration — Realm gravado na versão 4 com perfil, baralhos, cartões e revisões, aberto com `realmConfig` → tudo preservado e datas vazias
  - SPEC BKP-18 · integration — `Card` com `deckId` duplicado injetado para o `create` falhar no meio → lança `BACKUP_RESTORE_FAILED`; banco igual ao anterior campo a campo
  - INVARIANT INV-01 · integration — 50 falhas injetadas em pontos aleatórios da transação (semente) → banco sempre idêntico ao inicial
  - INVARIANT INV-02 · integration — 100 bancos aleatórios → `restore(parse(build(snapshot)))` dá o mesmo banco, exceto as datas de backup
  - INVARIANT INV-03 · integration — `restore` do mesmo arquivo duas vezes → estado igual ao de uma
  - INVARIANT INV-05 · integration — `restore` só é alcançável com arquivo já validado: texto inválido nunca chega ao repositório e o banco permanece intacto
  - REGRESSION · integration — suítes existentes de `profile`, `decks`, `cards` e `study` seguem verdes
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done

### T3 — Exportar backup pela tela Backup

- **Covers**: BKP-01, BKP-04, BKP-06, BKP-07, BKP-08, BKP-09, BKP-21, BKP-22, BKP-24
- **Depends on**: T2
- **Risk**: inherit
- **Touches**: `package.json`, `package-lock.json`, `src/features/backup/files.ts`, `src/features/backup/index.ts`, `src/features/backup/usecases/`, `src/features/backup/screens/backup-screen.tsx`, `src/features/backup/screens/use-backup-screen.ts`, `src/features/backup/screens/backup-screen.test.tsx`, `src/domain/backup.ts`, `src/domain/backup.test.ts`, `src/app/backup.tsx`, `src/navigation/root-stack.tsx`, `src/features/profile/screens/settings-screen.tsx`, `src/features/profile/screens/use-settings-screen.ts`, `src/features/profile/screens/settings-screen.test.tsx`
- **Change**: `npx expo install expo-file-system expo-sharing`; tela `/backup` com cartão de estado, contagens e `Exportar backup` (escrever, compartilhar, marcar a data, toast); linha `Backup e restauração` em Ajustes. A-01 vale: a data é gravada quando `shareAsync` resolve.
- **Tests**:
  - SPEC BKP-01 · screen — toque em `Exportar backup` → `writeBackupFile` com `memorizze-2026-10-10.json` (relógio fixo) e `shareBackupFile` com o URI devolvido
  - SPEC BKP-04 · screen — `shareBackupFile` resolve → perfil com `lastBackupAt` = agora, `previousBackupAt` = valor anterior, toast `Backup exportado` e ação `Compartilhar` que chama `shareBackupFile` de novo
  - SPEC BKP-06 · screen — título `Backup`, link `Ajustes`, os dois botões e as duas legendas, claro e escuro
  - SPEC BKP-07 · unit — `lastBackupAt` hoje 16:04 → `Backup feito hoje, 16:04`; 2 de outubro → `Backup feito em 2 de outubro`; nulo → `Nenhum backup ainda`; `Anterior: 2 de outubro` só com `previousBackupAt`
  - SPEC BKP-08 · screen — banco com 4 baralhos, 492 cartões, 3.418 revisões → `4`, `492`, `3.418`
  - SPEC BKP-09 · screen — Ajustes mostra `Último backup: 2 de outubro` ou `Nenhum backup ainda` e o toque abre `/backup`
  - SPEC BKP-21 · screen — `shareBackupFile` rejeita → toast `Não foi possível exportar.`, `lastBackupAt` igual e o arquivo temporário apagado
  - SPEC BKP-22 · screen — durante a exportação os dois botões ficam desativados
  - CONTRACT · unit — `files.ts` chama `Sharing.shareAsync(uri, { mimeType: "application/json", UTI: "public.json" })` e `File` do cache com o nome do backup, e o seletor com `type: "application/json"` e `copyToCacheDirectory: true`
  - SPEC BKP-24 · unit — `writeBackupFile` apaga o arquivo da exportação anterior antes de gravar
  - REGRESSION · screen — Ajustes continua com tema, limite e versão (suíte existente)
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done
- **Note**: AD-001 pede um método de repositório por hook, então `markBackedUp` ganhou o hook `use-mark-backed-up` e o hook de tela compõe export → marcar data → toast. `files.ts` entrou na lista de arquivos de raiz permitidos em `architecture.test.ts`.

### T4 — Importar backup substituindo tudo

- **Covers**: BKP-10, BKP-11, BKP-12, BKP-14, BKP-16, BKP-17, BKP-18, BKP-20, BKP-22, BKP-25
- **Depends on**: T3
- **Risk**: inherit
- **Touches**: `package.json`, `package-lock.json`, `src/features/backup/files.ts`, `src/features/backup/usecases/`, `src/features/backup/screens/use-import-flow.ts`, `src/features/backup/screens/backup-screen.tsx`, `src/features/backup/screens/use-backup-screen.ts`, `src/features/backup/screens/backup-screen.test.tsx`
- **Change**: `npx expo install expo-document-picker`; `Importar backup` abre o seletor, valida, mostra o `ConfirmDialog` com as contagens do arquivo e, ao confirmar, restaura, invalida todas as queries e avisa. Os erros de BKP-16, 17 e 18 mostram os toasts do plano.
- **Tests**:
  - SPEC BKP-10 · screen — toque em `Importar backup` → `pickBackupText` chamado
  - SPEC BKP-25 · screen — arquivo com 2 baralhos, 10 cartões, 30 revisões → diálogo `Substituir 2 baralhos, 10 cartões e 30 revisões pelos do arquivo?` com `Substituir` e `Cancelar`
  - SPEC BKP-11 · screen — confirmar → Realm só com os dados do arquivo, toast `Backup restaurado` e leituras do cache refeitas
  - SPEC BKP-12 · screen — arquivo com `themePreference: "dark"` → `Appearance.setColorScheme("dark")` após restaurar
  - SPEC BKP-14 · screen — seletor devolve `null`; ou `Cancelar` no diálogo → banco idêntico, sem toast de erro
  - SPEC BKP-20 · unit — asset com `size` de 20 MB + 1 → `pickBackupText` recusa sem ler o arquivo
  - SPEC BKP-22 · screen — durante a restauração os dois botões ficam desativados
  - SPEC BKP-16 · screen — arquivo inválido → toast `Arquivo inválido. Escolha um backup do Memorizze.` e banco intacto
  - SPEC BKP-17 · screen — `version: 2` → toast `Este backup é de uma versão mais nova do app.` e banco intacto
  - SPEC BKP-18 · screen — `restore` falha → toast `Não foi possível restaurar. Seus dados não foram alterados.` e banco intacto
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [x] done
- **Note**: o seletor e a validação ficam em `use-import-flow.ts` (função assíncrona, sem React Query, pois não chamam o repositório); só `use-restore-backup` é um hook de caso de uso (ARC-02).

### T5 — Importar a partir da Boas-vindas

- **Covers**: BKP-15, BKP-26
- **Depends on**: T4
- **Risk**: inherit
- **Touches**: `src/features/profile/screens/welcome-screen.tsx`, `src/features/profile/screens/welcome-screen.test.tsx`, `src/features/profile/screens/use-welcome-form.ts`, `src/features/backup/screens/use-import-flow.ts`, `src/features/backup/index.ts`
- **Change**: link `Já tenho um backup` na Boas-vindas que usa o mesmo `use-import-flow`; ao concluir, a leitura do perfil volta preenchida e o guard de AD-004 leva ao Início.
- **Tests**:
  - SPEC BKP-15 · screen — Boas-vindas mostra `Já tenho um backup`; toque abre o seletor e, com arquivo válido, o diálogo de confirmação
  - SPEC BKP-26 · screen — confirmar sem perfil prévio → perfil do arquivo criado e a rota é `/` (Início)
  - REGRESSION · screen — criar perfil pelo nome continua funcionando (suíte existente de Boas-vindas)
- **Done when**: tests above pass; quick gate green
- **Gate**: quick
- **Status**: [ ] pending

## Execution Waves

- **Wave 1**: T1
- **Wave 2**: T2
- **Wave 3**: T3
- **Wave 4**: T4
- **Wave 5**: T5

## Deferred

| Item | Reason | Where it goes |
| --- | --- | --- |
| Linha `Fazer backup antes` no Sair (F7) | Reaproveita `use-export-backup` depois desta feature | Emenda de `sign-out-wipe` |
| Atualizar `ARCHITECTURE.md` | `ARCHITECTURE_UPDATE_REQUIRED`; feito no Verify | Verify desta feature |

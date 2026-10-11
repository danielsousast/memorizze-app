# Backup and Restore — Validation

**Verdict**: PASS (author; independent verifier, adversarial review, UAT em dispositivo e aprovação humana pendentes)
**Risk**: CRITICAL (from spec)
**Verifier**: author fresh-eyes (sem verificador independente; exigido em CRITICAL)
**Diff range**: `0ad30eb^..f7902f6`
**Date**: 2026-10-11
**Human sign-off**: pending

## Gate

- **Command**: `npm run ci`
- **Result**: 69 suites, 693 passed, 0 failed, 0 skipped; lint e `tsc` limpos; domínio ≥ 90%
- **Test count**: 588 → 693
- **Skips**: none

## Acceptance Criteria Evidence

| AC | Spec-defined outcome | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- | --- |
| BKP-01 | grava `memorizze-AAAA-MM-DD.json` e abre a folha | `src/features/backup/screens/backup-screen.test.tsx:145` — `writeMock` com o nome e `shareMock` com o URI | SPEC | ✅ |
| BKP-02 | JSON com `app`, `version`, `exportedAt` e listas | `src/domain/backup.test.ts:136` — teste `BKP-02` | SPEC | ✅ |
| BKP-03 | todos os registros e campos, sem datas de backup | `src/features/backup/repository.test.ts:93` — `snapshot()` completo | SPEC | ✅ |
| BKP-04 | `lastBackupAt`, `previousBackupAt`, toast e `Compartilhar` | `src/features/backup/screens/backup-screen.test.tsx:145` e `src/features/backup/repository.test.ts:301` | SPEC | ✅ |
| BKP-06 | título, link, textos e botões | `src/features/backup/screens/backup-screen.test.tsx:100` — teste `BKP-06` | SPEC | ✅ |
| BKP-07 | rótulos de data e linha `Anterior` | `src/domain/backup.test.ts:280` e `src/features/backup/screens/backup-screen.test.tsx:111` | SPEC | ✅ |
| BKP-08 | contagens reais com milhar | `src/features/backup/screens/backup-screen.test.tsx:127` — `3.418` | SPEC | ✅ |
| BKP-09 | subtítulo em Ajustes e rota `/backup` | `src/features/backup/screens/backup-screen.test.tsx:220` | SPEC | ✅ |
| BKP-10 | abre o seletor | `src/features/backup/screens/backup-screen.test.tsx:249` — `pickMock` chamado | SPEC | ✅ |
| BKP-11 | substitui tudo, invalida e avisa | `src/features/backup/screens/backup-screen.test.tsx:266` — Realm só com o arquivo, toast | SPEC | ✅ |
| BKP-12 | tema do arquivo na hora | `src/features/backup/screens/backup-screen.test.tsx:288` — `setColorScheme("dark")` | SPEC | ✅ |
| BKP-13 | datas de backup vazias após importar | `src/features/backup/repository.test.ts:192` | SPEC | ✅ |
| BKP-14 | cancelar seletor ou diálogo não muda nada | `src/features/backup/screens/backup-screen.test.tsx:301` e `:310`; `src/features/backup/files.test.ts:104` | SPEC | ✅ |
| BKP-15 | link `Já tenho um backup` na Boas-vindas | `src/features/profile/screens/welcome-screen.test.tsx:141` | SPEC | ✅ |
| BKP-16 | toast de arquivo inválido, nada gravado | `src/features/backup/screens/backup-screen.test.tsx:330` (3 casos); `src/domain/backup.test.ts:170` | SPEC | ✅ |
| BKP-17 | toast de versão mais nova | `src/features/backup/screens/backup-screen.test.tsx:345`; `src/domain/backup.test.ts:178` | SPEC | ✅ |
| BKP-18 | falha na transação: toast e banco intacto | `src/features/backup/screens/backup-screen.test.tsx:364`; `src/features/backup/repository.test.ts:214` | SPEC | ✅ |
| BKP-19 | validação rejeita ids, datas, notas, referências | `src/domain/backup.test.ts:223` (tabela de casos), `:227` | SPEC | ✅ |
| BKP-20 | recusa acima de 20 MB sem ler | `src/features/backup/files.test.ts:110`, `:118` (limite exato) | SPEC | ✅ |
| BKP-21 | falha ao exportar: toast, data igual, temp apagado | `src/features/backup/screens/backup-screen.test.tsx:178`, `:189` | SPEC | ✅ |
| BKP-22 | botões desativados durante a operação | `src/features/backup/screens/backup-screen.test.tsx:202` e `:383` | SPEC | ✅ |
| BKP-23 | export sem baralhos | `src/features/backup/screens/backup-screen.test.tsx:168`; `src/features/backup/repository.test.ts:176` | SPEC | ✅ |
| BKP-24 | apaga o arquivo da exportação anterior | `src/features/backup/files.test.ts:50` | SPEC | ✅ |
| BKP-25 | diálogo com as contagens do arquivo | `src/features/backup/screens/backup-screen.test.tsx:256`; `src/domain/backup.test.ts:310` | SPEC | ✅ |
| BKP-26 | Boas-vindas conclui e leva ao Início | `src/features/profile/screens/welcome-screen.test.tsx:154` — pathname `/` | SPEC | ✅ |
| BKP-27 | migração 4→5 preserva dados | `src/db/realm.test.ts:81` | SPEC | ✅ |

BKP-05 foi removido pela A-01 (`shareAsync` não informa cancelamento); BKP-04 e BKP-27 foram reconciliados com a emenda no texto, no código e nos testes.

## Invariants

| Invariant | Evidence (`file:line` — assertion) | Origin | Result |
| --- | --- | --- | --- |
| INV-01 | `src/features/backup/repository.test.ts:228` | INVARIANT | ✅ |
| INV-02 | `src/features/backup/repository.test.ts:252`; `src/domain/backup.test.ts:245` | INVARIANT | ✅ |
| INV-03 | `src/features/backup/repository.test.ts:269` | INVARIANT | ✅ |
| INV-04 | `src/domain/backup.test.ts:253` | INVARIANT | ✅ |
| INV-05 | `src/features/backup/repository.test.ts:286`; `src/features/backup/screens/backup-screen.test.tsx:330` | INVARIANT | ✅ |

## Discrimination

| # | Location | Mutation | Killed |
| --- | --- | --- | --- |
| 1 | `screens/use-import-flow.ts` | pula `parseBackup` antes do diálogo | ✅ |
| 2 | `domain/backup.ts` | remove a checagem de `deckId` do cartão | ✅ |
| 3 | `domain/backup.ts` | aceita `version` 2 | ✅ |
| 4 | `usecases/use-export-backup.ts` | erro de `shareAsync` engolido (data marcada sem compartilhar) | ✅ |
| 5 | `files.ts` | não apaga a exportação anterior | ✅ |
| 6 | `usecases/use-restore-backup.ts` | restaurar sem `invalidateQueries` | ✅ |
| 7 | `repository.ts` | `restore` não apaga os cartões antigos | ✅ |
| 8 | `repository.ts` | `restore` engole a exceção da transação | ✅ |
| 9 | `repository.ts` | `previousBackupAt` não recebe a data anterior | ✅ |
| 10 | `files.ts` | limite `>` vira `>=` | ✅ |
| 11 | `usecases/use-export-backup.ts` | mantém o arquivo temporário na falha | ✅ |
| 12 | `repository.ts` | perfil restaurado ganha `lastBackupAt` | ✅ |

**Result**: 12 injected · 12 killed · 0 survived
**Isolation**: mutações no próprio worktree, arquivo restaurado após cada uma; `git status` limpo ao fim

## Change Review

- Scope matches spec In scope: ✅
- Desvios do plano: (1) `markBackedUp` virou o hook `use-mark-backed-up`, composto pelo hook de tela, porque AD-001 e ARC-02 pedem um método de repositório por hook; (2) seletor e validação ficam em `use-import-flow.ts`, sem React Query, pois não chamam o repositório; (3) `files.ts` entrou na lista de arquivos de raiz de `architecture.test.ts`; (4) `files.ts` guarda a exportação em `cache/backups/` para apagar a anterior com uma chamada.
- Plural do diálogo (`1 baralho`) e dos botões é um acréscimo mínimo ao texto de BKP-25.
- No drive-by changes, debug leftovers, secrets or disabled tests: ✅

## Gaps & Fix Tasks

1. Verificador independente, revisão adversarial e aprovação humana (CRITICAL).
2. UAT em aparelho com dados descartáveis: folha de compartilhamento iOS e Android, seletor de arquivos (iCloud não baixado), arquivo grande, tema restaurado ao vivo, migração 4→5 sobre dados reais. Autorização do usuário antes de importar sobre dados reais.
3. `ARCHITECTURE_UPDATE_REQUIRED`: seção `backup` em `ARCHITECTURE.md` (feita nesta sessão).

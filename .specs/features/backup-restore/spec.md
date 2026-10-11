# Backup and Restore — Spec

**Status**: Approved
**Date**: 2026-10-10

## Problem

Os dados vivem só no aparelho (Realm local, sem conta). Trocar de celular, reinstalar o app ou usar Sair apaga baralhos, cartões e histórico sem volta. O design 10 pede a tela Backup: exportar um arquivo JSON e importar um arquivo do próprio app. AD-008 trouxe o backup para o MVP.

## Scope

### In scope

- Rota `/backup` (design 10), aberta por uma linha `Backup e restauração` na seção `SEUS DADOS` de Ajustes (design 9), com a nota `Tudo fica só neste aparelho. Sem conta, sem nuvem.`
- Exportar: gerar `memorizze-AAAA-MM-DD.json` com perfil, baralhos, cartões e revisões, e abrir a folha de compartilhamento do sistema (`expo-sharing`; em iOS ela inclui "Salvar em Arquivos").
- Importar: escolher um arquivo (`expo-document-picker`), validar, confirmar e substituir todos os dados numa única transação Realm.
- Cartão de estado com data do último e do anterior backup e contagens reais (baralhos, cartões, revisões).
- Link `Já tenho um backup` na Boas-vindas, que importa sem perfil prévio.
- Domínio puro `src/domain/backup.ts`: serializar, validar e contar (sem Realm nem React).
- Migração Realm 4→5: `Profile.lastBackupAt` e `Profile.previousBackupAt`, ambos opcionais.

### Out of scope

| Item | Reason |
| --- | --- |
| Linha `Fazer backup antes` no diálogo do Sair (F7) | Emenda de `sign-out-wipe`, feita depois desta feature reaproveitando o export |
| Backup automático, agendado ou em nuvem | PROJECT-SPEC §2: sem nuvem nem sincronização |
| Criptografia ou senha do arquivo | Dados não sensíveis, arquivo fica com o usuário |
| Mesclar o arquivo com os dados atuais | AD-008 e design 10: importar substitui tudo |
| Importar formatos de terceiros (Anki, CSV) | PROJECT-SPEC §2 |
| Lembrete diário | Feature própria `daily-reminder` |

## Risk Assessment

| Factor | Rating | Evidence |
| --- | --- | --- |
| ambiguity | medium | Formato do arquivo, versão e importação sem perfil não estavam no design |
| criticality | medium | Única proteção contra perda de dados; falha degrada a UX sem quebrar o estudo |
| blast_radius | medium | Toca as 4 coleções Realm, `Profile`, Ajustes e Boas-vindas; sem utilitário compartilhado novo |
| novelty | high | Primeiro uso de arquivo, compartilhamento e seletor de documentos; 3 módulos Expo novos |
| irreversibility | high | Importar apaga todos os dados atuais e não há desfazer |
| integrations | medium | Folha de compartilhamento e seletor do sistema; falha tolerada, sem rede |
| state | medium | Substituição transacional de 4 coleções e invalidação de todo o cache React Query (AD-002) |
| auth | none | Perfil local, sem login |
| concurrency | low | Usuário único; só impedir toques duplos durante exportar/importar |
| migrations | medium | Realm 4→5, campos opcionais aditivos |
| security | medium | Arquivo vindo de fora é entrada não confiável, parseada e validada antes de gravar |
| data_integrity | high | Substitui o sistema de registro do usuário; um import parcial ou malformado destrói os dados |

**Declared level**: CRITICAL

Computado: `irreversibility`, `data_integrity` high → CRITICAL. Sem override. Rigor CRITICAL: invariantes, falhas injetadas, mutações sem sobreviventes, verificador independente e aprovação humana antes de cada passo irreversível.

## Acceptance Criteria

### P1 — Exportar

- **BKP-01** — WHEN o usuário toca em `Exportar backup` THEN o app SHALL gravar `memorizze-AAAA-MM-DD.json` (data local) no cache e abrir a folha de compartilhamento do sistema com esse arquivo.
- **BKP-02** — O JSON SHALL ter `app: "memorizze"`, `version: 1`, `exportedAt` (ISO 8601 UTC) e as listas `profile`, `decks`, `cards`, `reviewLogs`. Datas em ISO 8601 UTC; ids como string hexadecimal de 24 caracteres; cada cartão leva `deckId`.
- **BKP-03** — O arquivo SHALL conter todos os registros e todos os campos dos modelos Realm (nome, meta, tema, limite, tutorial visto, cartões com `easeFactor`, `intervalDays`, `repetitions`, `lapses`, `dueDate`, e todos os `ReviewLog`), sem `lastBackupAt` nem `previousBackupAt`.
- **BKP-04** *(A-01)* — WHEN `shareAsync` resolve sem erro THEN o app SHALL gravar `lastBackupAt = agora` e `previousBackupAt = lastBackupAt anterior` e mostrar o toast `Backup exportado` com a ação `Compartilhar`, que reabre a folha com o mesmo arquivo.
~~**BKP-05** — IF o usuário cancela a folha de compartilhamento THEN o app SHALL NOT alterar `lastBackupAt` nem mostrar erro.~~ *(removed by A-01)*

### P1 — Tela Backup

- **BKP-06** — A tela SHALL mostrar título `Backup`, link `‹ Ajustes`, texto de apoio, o cartão de estado e os botões `Exportar backup` (primário, legenda `Gera o arquivo memorizze-AAAA-MM-DD.json`) e `Importar backup` (secundário, legenda `Substitui os dados atuais pelos do arquivo.`), claro e escuro, como no design 10.
- **BKP-07** — O cartão SHALL mostrar `Backup feito hoje, HH:MM` quando `lastBackupAt` é de hoje, `Backup feito em D de mês` nos outros dias e `Nenhum backup ainda` sem `lastBackupAt`; a linha `Anterior: D de mês` só aparece com `previousBackupAt`.
- **BKP-08** — O cartão SHALL mostrar as contagens reais de baralhos, cartões e revisões do banco atual, com separador de milhar (`3.418`).
- **BKP-09** — A linha `Backup e restauração` de Ajustes SHALL mostrar o subtítulo `Último backup: D de mês` ou `Nenhum backup ainda`, e levar a `/backup`.

### P1 — Importar

- **BKP-10** — WHEN o usuário toca em `Importar backup` THEN o app SHALL abrir o seletor de documentos.
- **BKP-25** — WHEN o usuário escolhe um arquivo válido THEN o app SHALL abrir um `ConfirmDialog` destrutivo `Substituir N baralhos, M cartões e K revisões pelos do arquivo?` (contagens do arquivo) com os botões `Substituir` e `Cancelar`.
- **BKP-11** — WHEN o usuário confirma THEN o app SHALL apagar perfil, baralhos, cartões e revisões e criar os do arquivo numa única transação Realm, depois invalidar todas as queries (AD-002) e mostrar o toast `Backup restaurado`.
- **BKP-12** — Após importar, o tema SHALL passar ao `themePreference` do arquivo na hora (mesmo caminho de THM-02).
- **BKP-13** — `lastBackupAt` e `previousBackupAt` do perfil restaurado SHALL ficar vazios.
- **BKP-14** — IF o usuário cancela o seletor ou o diálogo THEN o app SHALL manter todos os dados e não mostrar erro.

### P1 — Importar na Boas-vindas

- **BKP-15** — A Boas-vindas SHALL mostrar um link `Já tenho um backup` que abre o mesmo fluxo de importação (BKP-10 e BKP-25).
- **BKP-26** — WHEN a importação a partir da Boas-vindas conclui THEN o perfil restaurado SHALL liberar o app (AD-004) e levar ao Início.

- **BKP-27** *(A-01)* — WHEN o app abre um Realm 4 THEN a migração 4→5 SHALL manter perfil, baralhos, cartões e revisões e deixar `lastBackupAt` e `previousBackupAt` vazios.

## Failure & Edge Behavior

- **BKP-16** — IF o arquivo não é JSON válido, não tem `app: "memorizze"`, ou falha a validação do BKP-19 THEN o app SHALL mostrar o toast `Arquivo inválido. Escolha um backup do Memorizze.` e NOT alterar nenhum dado.
- **BKP-17** — IF `version` é maior que `1` THEN o app SHALL mostrar `Este backup é de uma versão mais nova do app.` e NOT alterar nenhum dado.
- **BKP-18** — IF a gravação da transação falha THEN o app SHALL mostrar `Não foi possível restaurar. Seus dados não foram alterados.` e o banco idêntico ao anterior (INV-01).
- **BKP-19** — A validação SHALL rejeitar: perfil ausente ou com `name` fora de 1–30 caracteres; ids repetidos dentro de uma lista; ids que não são hexadecimais de 24 caracteres; datas inválidas; `grade` fora de 0..3; cartão com `deckId` inexistente; `reviewLog` com `cardId` ou `deckId` inexistente; campos numéricos não finitos ou negativos; `easeFactor` menor que 1,3.
- **BKP-20** — IF o arquivo passa de 20 MB THEN o app SHALL recusar com o toast de BKP-16 sem ler o conteúdo inteiro.
- **BKP-21** — IF a exportação falha (disco cheio, folha indisponível) THEN o app SHALL mostrar `Não foi possível exportar.`, NOT alterar `lastBackupAt` e apagar o arquivo temporário.
- **BKP-22** — WHILE exportar ou importar roda os dois botões SHALL ficar desativados.
- **BKP-23** — Banco sem baralhos: o export SHALL funcionar, com listas vazias e cartão com `0 baralhos`.
- **BKP-24** — WHEN uma nova exportação começa THEN o app SHALL apagar o arquivo de exportação anterior do cache.

Other dimensions: auth N/A porque o perfil é local e sem login; idempotência: importar o mesmo arquivo duas vezes dá o mesmo estado (INV-03), sem chave de dedup; limites de taxa N/A porque a ação é manual e local; observabilidade N/A porque o app não tem telemetria (PROJECT-SPEC §2).

## Invariants

- **INV-01** — Importar é tudo ou nada: após qualquer falha o banco é idêntico ao anterior (perfil, baralhos, cartões, revisões, campo a campo).
- **INV-02** — `importar(exportar(db))` reproduz `db` exceto `lastBackupAt` e `previousBackupAt`, para qualquer conjunto de dados válido, incluindo `description` ausente, textos com Unicode, quebras de linha e aspas, e datas nos limites.
- **INV-03** — Importar o mesmo arquivo duas vezes dá o mesmo estado que importar uma vez.
- **INV-04** — Todo arquivo que passa na validação respeita a integridade referencial: cada cartão pertence a um baralho e cada revisão aponta para cartão e baralho existentes; o que não passa nunca chega ao Realm.
- **INV-05** — Nenhum dado do banco atual é apagado antes de o arquivo inteiro ser lido, parseado e validado.

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed |
| --- | --- | --- | --- |
| Importação na Boas-vindas | Link `Já tenho um backup` (BKP-15) | Celular novo não tem perfil; resposta do usuário em 2026-10-10 | yes |
| Como salvar o arquivo | Folha de compartilhamento do sistema, sem escolher pasta | `expo-sharing` cobre iOS (Salvar em Arquivos) e Android; o design 10 mostra o toast com `Compartilhar` | no |
| Seletor de arquivo | `expo-document-picker` | Incluído no Expo Go; `File.pickFileAsync` tem docs inconsistentes na SDK 57 | no |
| Onde guardar as datas de backup | Campos em `Profile`, migração 4→5 | Segue o padrão da F5; evita um modelo novo | no |
| Revisões na importação | Entram todas, incluindo as de cartões já `Redefinir progresso` | AD-008: redefinir mantém os `ReviewLog` | no |
| Preferências (tema, limite) no arquivo | Entram no arquivo e são restauradas | "Substitui tudo" (AD-008) | no |
| Limite de 20 MB | Recusar acima | Um cartão de 200 B x 50 mil cartões já passa de 10 MB; 20 MB evita travar a memória | no |
| Datas em UTC no arquivo, exibidas no fuso local | ISO 8601 `Z` | Troca de fuso entre aparelhos não muda o instante | no |
| Textos de erro e toast | Os literais acima | Português sem design específico | no |

**Open questions**: none

## Amendments

### A-01 — Compartilhar não informa cancelamento; AC de migração

- **Type**: clarification
- **Discovered in**: Plan (leitura de `expo-sharing` SDK 57, iOS `SharingModule.swift`)
- **Change**: `shareAsync` resolve sem erro quando a folha fecha, tenha o usuário compartilhado ou cancelado; o app não distingue os dois casos. BKP-05 deixa de existir como cancelamento da folha. BKP-04 passa a: WHEN `shareAsync` resolve sem erro THEN gravar `lastBackupAt = agora`, `previousBackupAt = lastBackupAt anterior` e mostrar o toast `Backup exportado` com a ação `Compartilhar`. Novo BKP-27: WHEN o app abre um Realm 4 THEN a migração 4→5 SHALL manter perfil, baralhos, cartões e revisões e deixar `lastBackupAt` e `previousBackupAt` vazios.
- **Reason**: Sem sinal de cancelamento, o texto `Backup salvo` do design afirmaria algo que o app não sabe. O restante do BKP-04 e a falha de BKP-21 (`shareAsync` rejeita) ficam como estão.
- **Affected**: BKP-04 (modified), BKP-05 (removed), BKP-27 (added)
- **Risk impact**: none
- **Status**: approved

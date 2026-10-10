# STATE

<!-- Section-scoped writes only. Decisions: append. Handoff: replace. Never rewrite the whole file. -->

## Decisions

### AD-001
- **Decision**: Cada feature vive em `src/features/<feature>/` com `interfaces.ts`, `repository.ts` (único acesso ao Realm), `adapters.ts` se houver conversão e `usecases/` com um hook por arquivo; cada hook faz uma única chamada React Query que invoca um único método do repositório; feature com um só caso de uso não tem `usecases/`.
- **Reason**: Camadas previsíveis e testáveis; telas nunca tocam o Realm.
- **Trade-off**: Mais arquivos por feature; operações compostas exigem um método de repositório dedicado.
- **Scope**: `src/features/**` (decks, cards, study, profile)
- **Source**: `.specs/features/deck-card-crud/plan.md`
- **Date**: 2026-10-09
- **Status**: active

### AD-002
- **Decision**: A UI lê e grava via React Query (`@tanstack/react-query`, `networkMode: "always"`, `staleTime: Infinity`); toda escrita passa por um hook de mutação que invalida os prefixos de query afetados.
- **Reason**: Pedido do usuário; cache explícito e objetos simples em vez de `Realm.Object` vivos.
- **Trade-off**: Sem reatividade automática do Realm; uma escrita fora dos hooks deixa o cache velho.
- **Scope**: Todas as features; vale também para a sessão de estudo (M3)
- **Source**: `.specs/features/deck-card-crud/plan.md`
- **Date**: 2026-10-09
- **Status**: active

### AD-003
- **Decision**: Telas vivem em `src/features/<feature>/screens/<nome>-screen.tsx`; as rotas em `src/app/` só leem params e renderizam a tela. UI compartilhada fica em `src/components/`.
- **Reason**: PROJECT-SPEC §9 ("telas + hooks" por feature); AGENTS.md mantém `src/app/` só com rotas e testes fora dele.
- **Trade-off**: Telas que usam duas features importam o barrel público da outra (`@/features/cards`).
- **Scope**: `src/features/**/screens/`, `src/app/**`, `src/components/`
- **Source**: `.specs/features/deck-card-screens/plan.md`
- **Date**: 2026-10-09
- **Status**: active

### AD-004
- **Decision**: A entrada do app usa `Stack.Protected` do Expo Router num `RootStack` (`src/navigation/root-stack.tsx`): a Boas-vindas só existe sem `Profile` e o resto do app só com `Profile`. Abas Início e Perfil vivem no grupo `src/app/(tabs)/` com `Tabs` de `expo-router/js-tabs`; as demais telas ficam no `Stack` raiz, sem barra de abas.
- **Reason**: API oficial do Expo Router 57; o guard limpa o histórico, então voltar não reabre a Boas-vindas, e nenhuma rota precisa repetir a checagem.
- **Trade-off**: Testes de navegação que dependem do guard precisam montar o `RootStack` no helper de teste (`navigator`).
- **Scope**: `src/app/_layout.tsx`, `src/app/(tabs)/`, `src/navigation/`
- **Source**: `.specs/features/profile-onboarding/plan.md`
- **Date**: 2026-10-10
- **Status**: active

### AD-005
- **Decision**: Regras de código: (1) sem ternário aninhado; (2) sem funções criadas inline nas props de componentes; (3) sem lógica de negócio em telas e componentes, que só renderizam e ligam props, e a lógica vai para hooks da feature apoiados em `src/domain/`.
- **Reason**: Pedido do usuário; leitura simples, props estáveis e telas testáveis sem a UI.
- **Trade-off**: Mais arquivos de hook e handlers nomeados; as duas regras mecânicas estão como `error` no lint.
- **Scope**: `src/**/*.tsx`
- **Source**: pedido do usuário, 2026-10-10 (AGENTS.md "Code Rules")
- **Date**: 2026-10-10
- **Status**: active

### AD-006
- **Decision**: Hooks de tela (`use-<tela>.ts`) ficam em `src/features/<feature>/screens/` ao lado da tela; compõem hooks de `usecases/` e funções de `src/domain/`, e a tela só renderiza e liga props.
- **Reason**: `usecases/` obriga uma chamada React Query por hook (ARC-02); um hook de tela compõe vários.
- **Trade-off**: `src/features/architecture.test.ts` não inspeciona esses hooks; a checagem é `src/features/screen-logic.test.ts`.
- **Scope**: `src/features/*/screens/`
- **Source**: `.specs/features/code-rules-refactor/plan.md`
- **Date**: 2026-10-10
- **Status**: active

### AD-007
- **Decision**: Confirmações, menus e avisos usam `ConfirmDialog`, `BottomSheet` e `ToastProvider`/`useToast` de `src/components/`; `Alert.alert` não é mais usado em telas novas. Os dois primeiros são `Modal` do RN e cobrem o toast, então a ação de uma folha fecha a folha antes de chamar `useToast().show`.
- **Reason**: Os designs (Componentes 2, 3c, 3d, 7b, 5c) pedem visual próprio e ação no aviso, que `Alert.alert` não permite.
- **Trade-off**: Sem gesto de arrastar a folha; um toast por vez (o novo substitui o atual).
- **Scope**: `src/components/`, telas que confirmam ações
- **Source**: `.specs/features/ui-overlays/plan.md`
- **Date**: 2026-10-10
- **Status**: active

### AD-008
- **Decision**: Backup/importação, lembrete (notificação local), tema escolhido e "novos por dia" entram no MVP. Exclusão de baralho sem "Desfazer". "Editar baralho" é uma ação da folha do menu 3c (revisto em 2026-10-10: o botão no cabeçalho saiu). "Redefinir progresso" zera só o agendamento e mantém os `ReviewLog`.
- **Reason**: Respostas do usuário às decisões 1, 2, 3 e 5 do handoff.
- **Trade-off**: A decisão 1 exige emenda em PROJECT-SPEC §2 e §13 antes de F5 e F6.
- **Scope**: F2, F5, F6, F7
- **Source**: pedido do usuário, 2026-10-10
- **Date**: 2026-10-10
- **Status**: active



## Handoff
- **Feature**: settings-and-preferences (F5, HIGH) T1..T5 feitas e commitadas; `npm run ci` sai 0 (588 testes), lint e `tsc` limpos, 7 mutações mortas. Verificação pelo autor (`validation.md`); falta verificador independente e UAT em dispositivo. Lembrete diário fica para `daily-reminder`
- **Where**: `src/domain/{preferences,new-cards}.ts`, `src/db/{realm.ts,schemas/profile.ts}` (Realm 4), `src/features/{profile,study}/repository.ts`, `src/navigation/use-apply-theme.ts`, `src/components/{segmented-control,settings-row}.tsx`, `src/features/profile/screens/{settings-screen.tsx,use-settings-screen.ts}`, `src/app/settings.tsx`, `.specs/features/settings-and-preferences/`
- **Next step**: verificador independente de settings-and-preferences, depois F6 `backup-restore` (HIGH) e `daily-reminder`. Rodar o skill `adaptive-spec-driven` primeiro. UAT em dispositivo pendente: F2, F4, F5, F7, F8
- **Roteiro**: F1..F4, F8, F9 feitas (ver commits). F5 `settings-and-preferences` FEITA 2026-10-10 (tema Automático/Claro/Escuro, novos por dia 5..50 ou sem limite, orçamento diário na fila, rota `/settings`; `Appearance.setColorScheme` com `'unspecified'`). F6 `backup-restore` (HIGH): tela 10; `src/domain/backup.ts`, exportar JSON, importar substituindo tudo numa transação. F7 `sign-out-wipe` (HIGH, PARCIAL): o Sair já apaga preferências e devolve o tema ao sistema; falta "Fazer backup antes" (F6), verificador independente e UAT. `daily-reminder` (HIGH, nova): lembrete, horário, `Switch`, `expo-notifications`
- **Decisões pendentes do usuário**: nenhuma
- **Notas**: `design/` tem PNGs novos e alterados sem commit. NEW-09 lido como: cartão redefinido entra como novo dentro do orçamento e não conta como introduzido hoje. O primeiro run do CI no GitHub exige `git push` com go-ahead
- **Open amendments**: none
- **Blockers**: none
- **Updated**: 2026-10-10

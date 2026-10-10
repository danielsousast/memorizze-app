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

## Handoff
- **Feature**: study-onboarding-and-exit (F4, MEDIUM) — T1–T3 feitas, `npm run ci` sai 0 (504 testes), lint limpo, 5 mutações detectadas, commitada. Revisão do diff pelo autor; UAT em dispositivo pendente (folha 5c, diálogo de saída, migração Realm 2→3)
- **Where**: `src/features/study/screens/{how-to-answer-sheet.tsx,use-study-session.ts,session-view.tsx}`, `Profile.studyTutorialSeen` (`src/db/schemas/profile.ts`, schemaVersion 3), `src/features/profile/`
- **Next step**: F9 `profile-redesign` (LOW). F8 feita: ícones redesenhados em SVG-like a partir da prancha (iOS claro/escuro/tingido, Android adaptativo/monocromático); UAT visual em dispositivo exige `expo prebuild`/dev build; F2 segue bloqueada pelas decisões 1–5. Rodar o skill `adaptive-spec-driven` primeiro
- **Roteiro** (análise de `design/`, novos PNGs 3b, 3c, 3d, 5c, 7b, 9, 10, Componentes 2, ícone do app):
  - F2 `deck-menu-and-delete` (MEDIUM): menu 3c em `BottomSheet` (Adicionar cartão, Redefinir progresso, Excluir baralho); excluir 3d em `ConfirmDialog`; toast "Baralho excluído"; novo método de repositório e hook `useResetDeckProgress`. Troca o `Alert` de `use-deck-screen.ts`
  - F3 `deck-all-cards` (MEDIUM, FEITA): rota `decks/[deckId]/cards/index.tsx` (3b) com busca; Baralho (3) mostra só os 5 primeiros + "Ver todos >"; excluir cartão do editor passa a `ConfirmDialog`; checar 1.000 cartões
  - F4 `study-onboarding-and-exit` (MEDIUM, FEITA): folha "Como responder" (5c) na 1ª sessão, flag persistida no `Profile` (migração Realm); sair da sessão em `ConfirmDialog`; conferir visual de 5a/5b/6/8
  - F5 `settings-and-preferences` (HIGH): rota `/settings` (9) via engrenagem do Perfil; novo `Switch`, `SegmentedControl`, `SettingsRow`; schema com tema, lembrete, horário, novos por dia; `useTheme` com preferência; "novos por dia" altera a fila (RF4); lembrete com `expo-notifications` (talvez `daily-reminder` separada, HIGH)
  - F6 `backup-restore` (HIGH): tela 10; `src/domain/backup.ts` (serializar, validar, versionar), exportar JSON (`expo-file-system` + `expo-sharing`), importar (`expo-document-picker`) substituindo tudo numa transação; data do último backup
  - F7 `sign-out-wipe` (HIGH): botão Sair no Perfil + dialog 7b com atalho "Fazer backup antes" (depende de F6); apaga Realm, preferências e cache; volta à Boas-vindas (AD-004)
  - F8 `app-branding` (LOW, FEITA): ícone novo (iOS claro/escuro/tingido, Android adaptativo) em `app.json` e `assets/`; splash
  - F9 `profile-redesign` (LOW): conferir Perfil (rolagem completa) vs. código: engrenagem, linha "meta 30" no gráfico, rótulo de data
- **Decisões pendentes do usuário** (bloqueiam F2, F5, F6, F7):
  1. Backup/importação, lembrete (notificação local), tema escolhido e "novos por dia" entram no MVP? Exige emenda em PROJECT-SPEC §2 e §13
  2. Toast de exclusão de baralho mantém "Desfazer" (adia a exclusão 4 s) ou fica só o "Não dá para desfazer" do diálogo 3d? Os designs se contradizem
  3. "Editar baralho" não está no menu 3c; vai para onde? (hoje existe `decks/[deckId]/edit`)
  4. ~~Splash removida de propósito?~~ Resolvida 2026-10-10: sim; splash = `SplashIcon.png` (já em `assets/images/splash-icon.png`) sobre #5B45E0
  5. "Redefinir progresso" mantém os `ReviewLog`?
- **Notas**: `design/` tem PNGs novos e alterados sem commit; não entraram nos commits de F1. UAT de profile-stats em dispositivo segue pendente; o primeiro run do CI no GitHub exige `git push` com go-ahead
- **Open amendments**: none
- **Blockers**: decisões 1–5 acima para F2 e seguintes (F8 e F9 podem começar sem elas)
- **Updated**: 2026-10-10

# PROJECT SPEC — Memorizze

Flashcards com repetição espaçada.

> Fonte da verdade do projeto. Toda feature nasce aqui antes de virar código.
> Status: rascunho v0.1

## 1. Visão

App mobile offline de flashcards com repetição espaçada. O usuário cria baralhos e cartões, estuda o que está vencido no dia e acompanha seu progresso (estatísticas e streak) em um perfil local.

**Objetivo do repositório:** ser uma peça de portfólio. Código limpo, testado e bem documentado pesa mais que quantidade de features.

## 2. Escopo

**Dentro (MVP)**
- Perfil local (sem login, sem servidor)
- CRUD de baralhos e cartões
- Sessão de estudo com repetição espaçada
- Estatísticas e streak

**Fora (não fazer)**
- Login, backend, sincronização, nuvem
- Imagens/áudio nos cartões
- Importação/exportação (Anki, CSV)
- Notificações push
- Múltiplos perfis

## 3. Stack

| Camada | Escolha |
|---|---|
| App | React Native + TypeScript (strict) |
| Banco | Realm (`realm` + `@realm/react`), somente local |
| Navegação | React Navigation (stack + bottom tabs) |
| Testes | Jest + React Native Testing Library |
| Qualidade | ESLint, Prettier, GitHub Actions (lint + typecheck + testes) |

## 4. Modelo de dados (Realm)

**Profile** (registro único)
| Campo | Tipo | Nota |
|---|---|---|
| _id | ObjectId | PK |
| name | string | obrigatório, 1–30 caracteres |
| dailyGoal | int | cartões/dia, padrão 20 |
| createdAt | date | |

**Deck**
| Campo | Tipo | Nota |
|---|---|---|
| _id | ObjectId | PK |
| name | string | obrigatório, único |
| description | string? | |
| createdAt | date | |
| cards | lista de Card | exclusão em cascata |

**Card**
| Campo | Tipo | Nota |
|---|---|---|
| _id | ObjectId | PK |
| front | string | obrigatório |
| back | string | obrigatório |
| easeFactor | double | padrão 2.5, mínimo 1.3 |
| intervalDays | int | padrão 0 |
| repetitions | int | acertos consecutivos, padrão 0 |
| lapses | int | padrão 0 |
| dueDate | date | padrão: data de criação (indexado) |
| createdAt | date | |

**ReviewLog** (imutável, base das estatísticas)
| Campo | Tipo | Nota |
|---|---|---|
| _id | ObjectId | PK |
| cardId | ObjectId | |
| deckId | ObjectId | |
| grade | int | 0=Errei, 1=Difícil, 2=Bom, 3=Fácil |
| reviewedAt | date | indexado |

Estatísticas e streak são **derivados** de `ReviewLog`, nunca armazenados.

## 5. Algoritmo de repetição espaçada (SM-2 simplificado)

Função pura `schedule(card, grade, now) → { easeFactor, intervalDays, repetitions, lapses, dueDate }`, sem dependência de Realm ou React.

| Resposta | repetitions | intervalDays | easeFactor |
|---|---|---|---|
| Errei (0) | 0 | 0 (volta na mesma sessão) | −0.20 |
| Difícil (1) | +1 | max(1, round(intervalo × 1.2)) | −0.15 |
| Bom (2) | +1 | 1ª vez: 1 · 2ª vez: 3 · depois: round(intervalo × EF) | sem mudança |
| Fácil (3) | +1 | valor de "Bom" × 1.3 (arredondado) | +0.15 |

Regras:
- `easeFactor` nunca fica abaixo de 1.3.
- "Errei" incrementa `lapses`.
- `dueDate` = início do dia local de `now` + `intervalDays`.
- Cartão está **vencido** quando `dueDate <= fim do dia de hoje`.

## 6. Telas

1. **Boas-vindas** — pede o nome e cria o perfil. Aparece só se não existir `Profile`.
2. **Início (aba)** — lista de baralhos com total de cartões e quantos vencem hoje; botão "Estudar tudo".
3. **Baralho** — lista de cartões, busca por texto, adicionar/editar/excluir, botão "Estudar".
4. **Editor de cartão** — frente e verso.
5. **Sessão de estudo** — mostra a frente, toque revela o verso, quatro botões de resposta, barra de progresso.
6. **Resumo da sessão** — cartões revistos, % de acerto, streak atual.
7. **Perfil (aba)** — nome, meta diária, estatísticas, streak.

## 7. Requisitos funcionais

**RF1 — Perfil**
- Sem perfil, o app abre em Boas-vindas; com perfil, abre em Início.
- Nome e meta diária são editáveis na aba Perfil.

**RF2 — Baralhos**
- Criar, renomear e excluir. Excluir pede confirmação e remove os cartões.
- Nome vazio ou duplicado mostra erro e não salva.

**RF3 — Cartões**
- Criar, editar e excluir dentro de um baralho.
- Frente e verso obrigatórios. Cartão novo já nasce vencido.
- Editar o texto não altera o agendamento.

**RF4 — Sessão de estudo**
- Fila = cartões vencidos do baralho (ou de todos), ordenados por `dueDate` crescente.
- Sem cartões vencidos: estado vazio "Nada para revisar hoje".
- Cada resposta, em uma única transação: atualiza o cartão via `schedule` e grava um `ReviewLog`.
- "Errei" recoloca o cartão no fim da fila da sessão.
- Sair no meio preserva o que já foi respondido.
- Fila vazia leva ao Resumo.

**RF5 — Estatísticas**
- Revisões hoje vs. meta diária.
- Total de revisões e % de acerto (resposta ≥ 1) nos últimos 7 e 30 dias.
- Gráfico de revisões por dia (últimos 7 dias).
- Cartões por estágio: novos (`repetitions = 0`), aprendendo (intervalo < 21 dias), maduros (≥ 21 dias).

**RF6 — Streak**
- Um dia conta quando há pelo menos 1 `ReviewLog` naquela data local.
- Streak atual = dias consecutivos terminando hoje, ou ontem se hoje ainda não houve revisão.
- Pular um dia inteiro zera o streak.
- Maior streak histórico também é exibido.

## 8. Requisitos não funcionais

- 100% offline; nenhuma chamada de rede.
- Listas com `FlatList`; fluido com 1.000 cartões em um baralho.
- Datas sempre no fuso local do dispositivo; lógica de data isolada em um módulo.
- Acessibilidade: labels em todos os botões, alvos de toque ≥ 44pt.
- Tema claro/escuro seguindo o sistema.

## 9. Arquitetura

```
src/
  domain/        # lógica pura: schedule.ts, streak.ts, stats.ts, dates.ts
  db/            # schemas Realm e repositórios
  features/      # decks/, cards/, study/, profile/ (telas + hooks)
  components/    # UI compartilhada
  navigation/
  theme/
specs/           # um arquivo por feature, derivado deste SPEC
```

Regra: `domain/` não importa Realm nem React. Telas falam com o banco só por hooks/repositórios.

## 10. Testes

- `domain/`: cobertura ≥ 90% (schedule, streak, stats, incluindo virada de dia e dias pulados).
- Repositórios: testes com Realm em memória.
- Telas: fluxo principal da sessão de estudo com Testing Library.
- CI falha em erro de lint, tipo ou teste.

## 11. Marcos

| # | Entrega | Pronto quando |
|---|---|---|
| M0 | Setup: projeto, lint, CI, navegação vazia | CI verde |
| M1 | `domain/` completo com testes | cobertura ≥ 90% |
| M2 | Schemas Realm + CRUD de baralhos e cartões | RF2 e RF3 |
| M3 | Sessão de estudo + resumo | RF4 |
| M4 | Perfil, estatísticas e streak | RF1, RF5, RF6 |
| M5 | Polimento: tema, acessibilidade, README com GIFs | pronto para divulgar |

## 12. Fluxo spec-driven

1. Cada feature ganha um arquivo em `specs/` com: contexto, critérios de aceite, fora de escopo.
2. Critérios de aceite viram testes antes da implementação.
3. PR referencia o spec; mudança de comportamento atualiza o spec no mesmo PR.

## 13. Decisões em aberto

- Expo (dev client) ou React Native CLI?
- Limite de cartões novos por dia? (hoje: sem limite)
- Idioma da interface: só pt-BR ou pt-BR + en?
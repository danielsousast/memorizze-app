# Deck & Card Screens — Context

**Gathered**: 2026-10-09
**Spec**: [spec.md](spec.md)

## Feature Boundary

As telas Início, Baralho, Form de baralho e Editor de cartão sobre os hooks de `deck-card-crud`. Fecham o M2 (RF2, RF3 na UI). Tudo que o design mostra de M3/M4 fica de fora.

## Decisions

### Contagem de vencidos ("N hoje")

- Incluir agora um `dates` mínimo em `src/domain/` (fim do dia local, cartão vencido) e o estágio do cartão (novo/aprendendo/maduro). Motivo: cartão novo nasce vencido (CRD-01), então o selo já tem valor no M2, e as funções são puras e pequenas. M1 completa o módulo depois. → DAT-01..03, STG-01, DUE-01..02

### Elementos de outros marcos

- Omitir até o marco: card de streak/meta e nome na saudação (M4), botões "Estudar" e "Estudar tudo" (M3), barra de abas com Perfil (M4). Motivo: nada de placeholder falso; cada marco adiciona sua parte. → Out of scope; HOME-01

### Criar e editar baralho (sem design)

- Tela modal com formulário (Nome, Descrição), no estilo do Editor de cartão. A mesma tela serve para criar e editar, com erro inline. → DFM-01..08

### Editar e excluir

- Tocar no cartão abre o Editor em modo edição, com "Excluir cartão" e confirmação. O menu "⋯" do baralho oferece Editar e Excluir; a confirmação diz quantos cartões serão apagados. → DECK-08..10, EDT-05..06

## Agent's Discretion

- Textos dos estados vazios, mensagens de erro e confirmações não desenhados.
- Iniciais do ícone do baralho, navegação após criar baralho, ordem da lista de cartões. Ficam como assumptions no spec.

## References

- `design/2 · Início.png`, `design/2b · Início — sem baralhos.png`, `design/3 · Baralho.png`, `design/4 · Editor de cartão.png` e as variantes escuras.
- `design/Componentes — claro.png` / `— escuro.png`: botão, FAB, selo, card de baralho, campo.

## Deferred Ideas

- Seletor de baralho no Editor (mover cartão entre baralhos): exige método novo no repositório.
- Swipe para excluir cartão.
- Ordenação configurável da lista de cartões.
- Aviso de alterações não salvas ao cancelar.

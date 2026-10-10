# Perfil e entrada — Context

**Gathered**: 2026-10-10
**Spec**: [spec.md](spec.md)

## Feature Boundary

Primeira metade do M4: Boas-vindas, desvio de entrada pelo perfil, abas Início e Perfil, cabeçalho e cartão de streak/meta na Início, e na aba Perfil o cabeçalho, a edição do nome e a meta diária com "Revisões hoje". Estatísticas, maior sequência, gráfico e estágios ficam em `profile-stats`.

## Decisions

Pace: Quick. O usuário aceitou todos os padrões propostos pelo agente ("Aceitos suas sugestões", 2026-10-10).

### Divisão do M4

- M4 vira duas features: `profile-onboarding` (esta) e `profile-stats`. Um spec só passaria de ~4k tokens. "Revisões hoje" entra aqui porque a Início precisa dele. → Scope

### Edição do nome

- O PNG 7 não mostra como editar. Tocar no cabeçalho (avatar + nome) abre um modal `Editar nome`, no mesmo padrão do formulário de baralho. → PRF-04, PRF-05

### Meta diária

- Stepper de 5 em 5, de 5 a 200; cada toque grava na hora, sem botão salvar. O padrão 20 e o 30 do design são múltiplos de 5. → GOL-01..GOL-04

### Variações do cartão da Início

- O cartão aparece com e sem baralhos (PNG 2b). `Estudar tudo` fica dentro dele só com baralhos (PNG 2).
- O subtítulo depende do streak e de já ter estudado hoje. Meta batida enche a barra e mantém o texto `M de G revisões`. → HOM-03..HOM-07

### Validação do nome

- Espaços nas pontas são removidos; 1 a 30 caracteres depois disso. O campo limita a digitação a 30. Mesmas mensagens no Boas-vindas e no modal. → WEL-03, WEL-04

## Agent's Discretion

Textos dos subtítulos sem design (já estudou hoje), mensagem de erro do nome e a primeira letra como avatar do perfil.

## References

PNGs `1 · Boas-vindas`, `2 · Início`, `2b · Início — sem baralhos`, `7 · Perfil` (claro e escuro), `Componentes` (barra de abas, campo, barra de progresso).

## Deferred Ideas

- Estatísticas, maior sequência, gráfico de 7 dias e cartões por estágio → `profile-stats`.
- Nome no Resumo da sessão (out of scope do M3) → não pedido no RF1; fica fora.

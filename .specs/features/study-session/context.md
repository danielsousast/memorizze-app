# Sessão de estudo — Context

**Gathered**: 2026-10-10
**Spec**: [spec.md](spec.md)

<!-- Reasoning behind discussed decisions. Every decision that changes observable behavior must also be an AC or an assumption in spec.md; do not duplicate requirement text here. -->

## Feature Boundary

M3 (RF4): sessão de estudo por baralho ou de todos os baralhos, com fila de vencidos, revelação do verso, quatro respostas agendadas pelo SM-2 (§5), estado vazio e Resumo. Inclui o `schedule` puro (faltou no M1) e o `streak` puro que o Resumo exibe.

## Decisions

### Rótulos dos botões de resposta

- Cada botão mostra o intervalo real que `schedule` vai aplicar àquele cartão ("agora", "1 dia", "3 dias"), não os minutos do design. O design usa passos de minutos que o SM-2 da §5 não tem. O que o usuário lê tem que ser o que acontece. → spec (ACs de resposta)

### Conteúdo do Resumo

- O Resumo mostra cartões revistos, % de acerto, streak atual, distribuição das respostas, tempo de estudo e "Amanhã: N cartões". O nome do perfil fica para o M4. Até lá a saudação não leva nome. `streak.ts` entra agora porque é lógica pura que o M4 já exige. → spec (ACs do Resumo)

### Contagem com "Errei"

- O progresso conta cartões. O total é fixo (cartões únicos da fila) e avança quando o cartão sai da fila com resposta ≥ 1. "Cartões revistos" no Resumo também conta cartões únicos.
- O % de acerto e a distribuição contam todas as respostas. Cada resposta grava um `ReviewLog`, e esse é o mesmo critério que o M4 vai usar (RF5: acerto = resposta ≥ 1). → spec (ACs de progresso e do Resumo)

### Pontos de entrada

- "Estudar · N cartões" na tela Baralho e "Estudar tudo · N cartões" na Início, como nos PNGs 2 e 3. Os botões ficam sempre visíveis. Sem cartões vencidos, eles abrem "Nada para revisar hoje" (PNG 8). → spec (ACs de entrada e estado vazio)

### Sair no meio da sessão

- O X pede confirmação: "Sair da sessão? Seu progresso já foi salvo.", com Sair e Continuar. Sair volta para a tela de origem sem Resumo. As respostas dadas já estão gravadas (RF4). → spec (AC de saída)

### Virada do dia durante a sessão

- A fila é uma foto tirada ao abrir a sessão e não muda depois. Cada resposta agenda com a hora real em que foi dada. → spec (assunção de virada do dia)

## Agent's Discretion

- Início no M3: só o botão "Estudar tudo · N cartões". O bloco de streak e meta diária do PNG 2 entra no M4, com o perfil.
- Texto do rótulo para intervalo 0 ("agora") e formato de plural ("1 dia" / "3 dias").
- "Adicionar novos cartões" no estado vazio: leva ao editor de cartão quando a sessão é de um baralho e não aparece em "Estudar tudo" (repetiria "Voltar ao início").
- Tempo de estudo: da abertura da sessão até a última resposta, arredondado para minutos.
- Proteção contra toque duplo nos botões de resposta (sem `ReviewLog` duplicado).
- Como o `deckId` chega ao `ReviewLog` em "Estudar tudo" (decisão de Plan).

## References

- `design/5a · Estudo — frente.png`, `5b · Estudo — verso.png`, `6 · Resumo da sessão.png`, `8 · Nada para revisar.png` (e versões escuras)
- `design/2 · Início.png` ("Estudar tudo"), `design/3 · Baralho.png` ("Estudar · 12 cartões")

## Deferred Ideas

- Passos de aprendizado em minutos, como no Anki (o design sugere). Mudaria a §5 e o agendamento dentro do dia.
- Nome do perfil no Resumo e bloco de streak/meta na Início → M4.
- Limite de cartões novos por dia (PROJECT-SPEC §13, em aberto).

# Daily Reminder — Context

Decisões do usuário em 2026-10-11 (Discuss):

| Pergunta | Decisão |
| --- | --- |
| Escolha do horário | `BottomSheet` com horas cheias (6:00 a 22:00), mesmo padrão de "Novos por dia" (AD-007); sem dependência nova |
| Padrão | Desligado, horário 19:00; a permissão só é pedida ao ligar o Switch |
| Permissão negada | Switch volta a desligado e um toast avisa, com ação que abre os Ajustes do sistema |

Pesquisa (docs Expo SDK 57, `expo-notifications`): `scheduleNotificationAsync` com gatilho `DAILY` (`hour`, `minute`); `requestPermissionsAsync`/`getPermissionsAsync` (`granted`; iOS `ios.status`); Android 8+ exige canal; Android 13+ só mostra o pedido de permissão depois de existir um canal; sem `setNotificationHandler` a notificação não aparece com o app aberto; lembrete local funciona no Expo Go.

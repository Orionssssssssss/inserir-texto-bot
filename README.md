# 🎮 Minecraft Discord Monitor v2.0

Bot de alta performance para monitorização em tempo real de servidores Minecraft (Java Edition / Aternos) diretamente no seu servidor do Discord.

## ✨ Funcionalidades
- 🟢 **Monitorização em Tempo Real:** Atualizações automáticas a cada 15 segundos.
- 🎨 **Embed Moderno:** Design limpo com barra de progresso visual de jogadores e IP em bloco de código para cópia rápida.
- ⚡ **Sistema Duplo de Consulta:** Usa conexão por Sockets diretos + Fallback via API REST para evitar falhas no Aternos/Replit.
- 🔄 **Auto-Edit:** Encontra e edita a mensagem anterior do bot sem poluir o canal com novas mensagens.
- 🤖 **Status do Bot:** Atualiza o estado do próprio bot no Discord ("A assistir 👥 3/20").
- 🌐 **Web Server Keep-Alive:** Servidor Express integrado para compatibilidade com UptimeRobot no Replit.

## 🚀 Como Configurar no Replit
1. Importe os ficheiros para o seu Repl (Node.js).
2. Vá à aba **Segredos (Secrets)** no Replit e defina as variáveis:
   - `DISCORD_TOKEN`: O token do seu Bot do Discord.
   - `MC_HOST`: `inserirtexto-gWHK.aternos.me`
   - `MC_PORT`: `38060`
   - `STATUS_CHANNEL_ID`: `1550878827645771948`
   - `UPDATE_SECONDS`: `15`
3. Clique em **Run** no topo do ecrã.

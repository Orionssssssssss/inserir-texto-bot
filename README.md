# Minecraft Discord Monitor

Bot Discord para monitorar um servidor Minecraft Java e manter um painel atualizado em um canal específico.

## O painel mostra

- 🟢 servidor online / 🔴 offline
- 👥 jogadores online
- 📡 ping
- 🧱 versão
- 👤 lista de jogadores (quando o servidor fornece essa informação)
- atualização automática da mensagem
- aviso no canal quando o servidor cai ou volta

## Replit

1. Importe este projeto para o Replit.
2. Abra **Secrets / Environment Variables**.
3. Crie:
   - `DISCORD_TOKEN` = token do seu bot
   - `STATUS_CHANNEL_ID` = ID do canal onde ficará o painel
   - `MC_HOST` = IP/domínio do Minecraft
   - `MC_PORT` = porta (normalmente `25565`)
   - `UPDATE_SECONDS` = intervalo em segundos (ex.: `15`)
4. Rode `npm start`.

## Discord

Convide o bot para o servidor com permissões para:
- View Channel
- Send Messages
- Embed Links
- Read Message History

O bot reutiliza uma mensagem de painel existente e a edita em vez de criar uma nova a cada atualização.

## Importante

Não coloque o token do bot no GitHub. Use os Secrets do Replit.

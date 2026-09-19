require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const util = require('minecraft-server-util');
const fetch = require('node-fetch');
const express = require('express');

// ==========================================
// 1. CONFIGURAÇÕES & VARIÁVEIS DE AMBIENTE
// ==========================================
const TOKEN = process.env.DISCORD_TOKEN;
const MC_HOST = process.env.MC_HOST;
const MC_PORT = parseInt(process.env.MC_PORT) || 25565;
const CHANNEL_ID = process.env.STATUS_CHANNEL_ID;
const UPDATE_INTERVAL = (parseInt(process.env.UPDATE_SECONDS) || 15) * 1000;
const PORT = process.env.PORT || 3000;

if (!TOKEN || !MC_HOST || !CHANNEL_ID) {
  console.error('❌ [ERRO] Variáveis de ambiente obrigatórias não encontradas! Verifique os Segredos (Secrets).');
  process.exit(1);
}

// ==========================================
// 2. SERVIDOR WEB KEEP-ALIVE (REPLIT)
// ==========================================
const app = express();
app.get('/', (req, res) => {
  res.send('🟢 Bot de Monitorização do Minecraft está ativo e a rodar!');
});
app.listen(PORT, () => {
  console.log(`🌐 Servidor Web de Keep-Alive a rodar na porta ${PORT}`);
});

// ==========================================
// 3. INICIALIZAÇÃO DO BOT DISCORD
// ==========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

let statusMessage = null; // Guarda a referência da mensagem para edição rápida

// ==========================================
// 4. FUNÇÃO DE CONSULTA AO MINECRAFT (PING + FALLBACK)
// ==========================================
async function fetchMinecraftStatus() {
  // Tentativa 1: Socket direto via minecraft-server-util
  try {
    const result = await util.status(MC_HOST, MC_PORT, {
      timeout: 5000,
      enableSRV: true
    });
    return {
      online: true,
      playersOnline: result.players.online,
      maxPlayers: result.players.max,
      version: result.version.name,
      ping: result.roundTripLatency,
      motd: result.motd.clean || 'Servidor de Minecraft'
    };
  } catch (primaryError) {
    // Tentativa 2: Fallback via API REST (MCSrvStat) caso a porta/socket esteja bloqueada no Replit
    try {
      const response = await fetch(`https://api.mcsrvstat.us/3/${MC_HOST}:${MC_PORT}`);
      const data = await response.json();

      if (data.online) {
        return {
          online: true,
          playersOnline: data.players?.online || 0,
          maxPlayers: data.players?.max || 20,
          version: data.version || '1.20.x',
          ping: data.debug?.ping || 50,
          motd: data.motd?.clean?.[0] || 'Servidor de Minecraft'
        };
      }
    } catch (fallbackError) {
      // Falha em ambas as tentativas
    }

    return { online: false };
  }
}

// ==========================================
// 5. GERADOR DE EMBEDS (VISUAL MELHORADO)
// ==========================================
function createProgressBar(online, max) {
  const totalBlocks = 10;
  if (max <= 0) return '⬛'.repeat(totalBlocks);
  const percentage = Math.min(Math.max(Math.round((online / max) * totalBlocks), 0), totalBlocks);
  return '🟩'.repeat(percentage) + '⬛'.repeat(totalBlocks - percentage);
}

function buildStatusEmbed(data) {
  const fullAddress = MC_PORT === 25565 ? MC_HOST : `${MC_HOST}:${MC_PORT}`;

  if (data.online) {
    const progressBar = createProgressBar(data.playersOnline, data.maxPlayers);
    const pingEmoji = data.ping < 80 ? '🟢' : data.ping < 150 ? '🟡' : '🔴';

    return new EmbedBuilder()
      .setColor(0x2ECC71) // Verde Emerald
      .setTitle('🎮 Status do Servidor Minecraft')
      .setDescription('O servidor está atualmente **ONLINE** e pronto para jogar!')
      .setThumbnail('https://cdn.icon-icons.com/icons2/2699/PNG/512/minecraft_logo_icon_168974.png')
      .addFields(
        {
          name: '🌐 IP do Servidor (Clique para copiar)',
          value: `\`\`\`${fullAddress}\`\`\``,
          inline: false
        },
        {
          name: '📊 Estado',
          value: '🟢 **ONLINE**',
          inline: true
        },
        {
          name: '🏷️ Versão',
          value: `\`${data.version}\``,
          inline: true
        },
        {
          name: '⚡ Latência',
          value: `${pingEmoji} \`${data.ping}ms\``,
          inline: true
        },
        {
          name: `👥 Jogadores Online (${data.playersOnline}/${data.maxPlayers})`,
          value: `${progressBar}
\`${data.playersOnline} de ${data.maxPlayers} slots ocupados\``,
          inline: false
        }
      )
      .setFooter({ text: 'Monitorização em Tempo Real • Aternos' })
      .setTimestamp();
  } else {
    return new EmbedBuilder()
      .setColor(0xE74C3C) // Vermelho Alizarin
      .setTitle('🎮 Status do Servidor Minecraft')
      .setDescription('⚠️ O servidor está atualmente **OFFLINE** ou a arrancar.')
      .setThumbnail('https://cdn.icon-icons.com/icons2/2699/PNG/512/minecraft_logo_icon_168974.png')
      .addFields(
        {
          name: '🌐 IP do Servidor',
          value: `\`\`\`${fullAddress}\`\`\``,
          inline: false
        },
        {
          name: '📊 Estado',
          value: '🔴 **OFFLINE**',
          inline: true
        },
        {
          name: '💡 Como Ligar?',
          value: 'Acede ao painel do **Aternos** para iniciar o servidor!',
          inline: true
        }
      )
      .setFooter({ text: 'Monitorização em Tempo Real • Aternos' })
      .setTimestamp();
  }
}

// ==========================================
// 6. CICLO DE ATUALIZAÇÃO DO STATUS
// ==========================================
async function updateStatus() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error(`❌ [ERRO] Canal com ID ${CHANNEL_ID} não foi encontrado ou não é um canal de texto!`);
      return;
    }

    const statusData = await fetchMinecraftStatus();
    const embed = buildStatusEmbed(statusData);

    // 1. Atualizar Presença/Atividade do Bot
    if (statusData.online) {
      client.user.setPresence({
        activities: [{ name: `👥 ${statusData.playersOnline}/${statusData.maxPlayers} em ${MC_HOST}`, type: ActivityType.Watching }],
        status: 'online'
      });
    } else {
      client.user.setPresence({
        activities: [{ name: `🔴 Servidor Offline`, type: ActivityType.Watching }],
        status: 'dnd'
      });
    }

    // 2. Enviar ou Editar a Mensagem no Canal
    if (!statusMessage) {
      // Procura se já existe uma mensagem do bot com embed no histórico do canal
      const messages = await channel.messages.fetch({ limit: 10 });
      statusMessage = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);
    }

    if (statusMessage) {
      await statusMessage.edit({ embeds: [embed] });
    } else {
      statusMessage = await channel.send({ embeds: [embed] });
    }

  } catch (error) {
    console.error('⚠️ [AVISO] Falha durante o ciclo de atualização:', error.message);
  }
}

// ==========================================
// 7. EVENTOS DO CLIENTE DISCORD
// ==========================================
client.once('clientReady', (c) => {
  console.log(`✅ Bot conectado com sucesso como: ${c.user.tag}`);
  console.log(`📡 A monitorizar o servidor: ${MC_HOST}:${MC_PORT}`);
  console.log(`⏱️ Intervalo de atualização: ${UPDATE_INTERVAL / 1000}s`);

  // Executa a primeira verificação imediatamente
  updateStatus();

  // Inicia o temporizador contínuo
  setInterval(updateStatus, UPDATE_INTERVAL);
});

// Autenticação
client.login(TOKEN);

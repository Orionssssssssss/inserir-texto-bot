const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");
const { status } = require("minecraft-server-util");

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.STATUS_CHANNEL_ID;
const MC_HOST = process.env.MC_HOST;
const MC_PORT = Number(process.env.MC_PORT || 25565);
const UPDATE_SECONDS = Math.max(5, Number(process.env.UPDATE_SECONDS || 15));

if (!TOKEN || !CHANNEL_ID || !MC_HOST) {
  console.error("Configure DISCORD_TOKEN, STATUS_CHANNEL_ID and MC_HOST in Replit Secrets.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let panelMessage = null;
let lastState = null;

function formatPlayers(result) {
  const players = result.players?.sample || [];
  if (!players.length) return "Nenhum jogador online";
  return players.slice(0, 30).map(p => `• ${p.name}`).join("\n");
}

function onlineEmbed(result) {
  const online = result.players?.online ?? 0;
  const max = result.players?.max ?? "?";
  const version = result.version?.name || "Desconhecida";
  return new EmbedBuilder()
    .setTitle("🟢 SERVIDOR ONLINE")
    .setDescription(`**Minecraft Server**\nO servidor está online e respondendo normalmente.`)
    .addFields(
      { name: "👥 Jogadores", value: `**${online}/${max}**`, inline: true },
      { name: "📡 Ping", value: `**${result.roundTripLatency ?? "?"} ms**`, inline: true },
      { name: "🧱 Versão", value: `**${version}**`, inline: true },
      { name: "👤 Jogadores online", value: formatPlayers(result) }
    )
    .setTimestamp()
    .setFooter({ text: "Monitoramento automático" });
}

function offlineEmbed() {
  return new EmbedBuilder()
    .setTitle("🔴 SERVIDOR OFFLINE")
    .setDescription("**Minecraft Server**\nO servidor não está respondendo no momento.")
    .addFields({
      name: "⚠️ Status",
      value: "Servidor indisponível ou inacessível."
    })
    .setTimestamp()
    .setFooter({ text: "Monitoramento automático" });
}

async function getPanelMessage(channel) {
  if (panelMessage) return panelMessage;

  const messages = await channel.messages.fetch({ limit: 20 });
  const existing = messages.find(m =>
    m.author.id === client.user.id &&
    m.embeds.length > 0 &&
    m.embeds[0].footer?.text === "Monitoramento automático"
  );

  panelMessage = existing || await channel.send({
    embeds: [offlineEmbed()]
  });

  return panelMessage;
}

async function updatePanel() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error("STATUS_CHANNEL_ID não é um canal de texto válido.");
      return;
    }

    let result;
    try {
      result = await status(MC_HOST, MC_PORT, { timeout: 5000 });
    } catch {
      result = null;
    }

    const newState = result ? "online" : "offline";
    const changed = newState !== lastState;

    const message = await getPanelMessage(channel);
    await message.edit({
      embeds: [result ? onlineEmbed(result) : offlineEmbed()]
    });

    if (changed && lastState !== null) {
      await channel.send(
        result
          ? "🟢 **O servidor Minecraft voltou a ficar online!**"
          : "🔴 **O servidor Minecraft caiu ou ficou inacessível!**"
      );
    }

    lastState = newState;
  } catch (err) {
    console.error("Erro ao atualizar painel:", err.message);
  }
}

client.once("ready", async () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  console.log(`Monitorando ${MC_HOST}:${MC_PORT}`);
  await updatePanel();
  setInterval(updatePanel, UPDATE_SECONDS * 1000);
});

client.login(TOKEN);
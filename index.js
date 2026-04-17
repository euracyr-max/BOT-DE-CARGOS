require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN;
const ARCANE_BOT_ID = "437808476106784770";

const LEVEL_REWARDS = [
  { level: 10, roleId: "1494471278957035673" },
  { level: 50, roleId: "1494471889861611610" },
  { level: 100, roleId: "1494472303772438680" },
  { level: 150, roleId: "1494472847848898743" },
  { level: 185, roleId: "1494473176531603628" },
  { level: 200, roleId: "1494475750085230744" },
  { level: 220, roleId: "1494476052242632704" },
  { level: 250, roleId: "1494476285165179000" },
];

if (!TOKEN) {
  console.error("❌ Token não encontrado nas variáveis do Railway.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

/*
==============================
FUNÇÃO: LER MENSAGEM DO ARCANE
==============================
*/
function parseArcaneMessage(content) {
  const userMatch = content.match(/<@!?(\d{17,20})>/);

  if (!userMatch) return null;

  const userId = userMatch[1];

  const afterMention = content.slice(
    userMatch.index + userMatch[0].length
  );

  const levelMatch = afterMention.match(/\b(\d{1,4})\b/);

  if (!levelMatch) return null;

  const level = Number(levelMatch[1]);

  if (!Number.isInteger(level) || level <= 0) return null;

  return { userId, level };
}

/*
==============================
FUNÇÃO: PEGAR CARGOS DO NÍVEL
==============================
*/
function getRewardRoleIds(level) {
  return LEVEL_REWARDS
    .filter(r => level >= r.level)
    .map(r => r.roleId);
}

/*
==============================
EVENTO PRINCIPAL
==============================
*/
client.on("messageCreate", async (message) => {
  try {
    // só servidor
    if (!message.guild) return;

    // só mensagens do Arcane
    if (message.author.id !== ARCANE_BOT_ID) return;

    // segurança extra
    if (!message.content) return;

    const parsed = parseArcaneMessage(message.content);

    if (!parsed) return;

    const rewardRoleIds = getRewardRoleIds(parsed.level);

    if (!rewardRoleIds.length) return;

    const member = await message.guild.members
      .fetch(parsed.userId)
      .catch(() => null);

    if (!member) return;

    const missingRoles = rewardRoleIds.filter(
      roleId => !member.roles.cache.has(roleId)
    );

    if (!missingRoles.length) return;

    await member.roles.add(missingRoles);

    console.log(
      `🏆 Cargos adicionados para ${member.user.tag} | Nível ${parsed.level}`
    );
  } catch (err) {
    console.error("Erro:", err);
  }
});

client.login(TOKEN);

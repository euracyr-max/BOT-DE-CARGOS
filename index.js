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
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

function parseArcaneMessage(content) {
  const userMatch = content.match(/<@!?(\d{17,20})>/);

  if (!userMatch) {
    return null;
  }

  const userId = userMatch[1];
  const contentAfterMention = content.slice(userMatch.index + userMatch[0].length);
  const levelMatch = contentAfterMention.match(/\b(\d{1,4})\b/);

  if (!levelMatch) {
    return null;
  }

  const level = Number(levelMatch[1]);

  if (!Number.isInteger(level) || level <= 0) {
    return null;
  }

  return { userId, level };
}

function getRewardRoleIds(level) {
  return LEVEL_REWARDS.filter((reward) => level >= reward.level).map(
    (reward) => reward.roleId,
  );
}

client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.id !== ARCANE_BOT_ID) {
      return;
    }

    const parsed = parseArcaneMessage(message.content);

    if (!parsed) {
      return;
    }

    const rewardRoleIds = getRewardRoleIds(parsed.level);

    if (rewardRoleIds.length === 0) {
      return;
    }

    const member = await message.guild.members.fetch(parsed.userId).catch(() => null);

    if (!member) {
      return;
    }

    const missingRoleIds = rewardRoleIds.filter(
      (roleId) => !member.roles.cache.has(roleId),
    );

    if (missingRoleIds.length === 0) {
      return;
    }

    await member.roles.add(missingRoleIds);
  } catch (error) {
    console.error(error);
  }
});

client.login(TOKEN);

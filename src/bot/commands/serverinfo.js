import Guild from "../../models/Guild.js";

export default {
  name: "serverinfo",
  aliases: ["si", "server"],
  description: "Lihat informasi server",
  async execute(message, args, client) {
    const { guild } = message;

    let guildData = await Guild.findOne({ guildId: guild.id });

    if (!guildData) {
      guildData = await Guild.create({
        guildId: guild.id,
        name: guild.name,
      });
    }

    const embed = {
      color: 0x5865f2,
      title: `📊 Informasi Server`,
      thumbnail: {
        url: guild.iconURL({ dynamic: true, size: 256 }),
      },
      fields: [
        {
          name: "📛 Nama Server",
          value: guild.name,
          inline: true,
        },
        {
          name: "🆔 Server ID",
          value: guild.id,
          inline: true,
        },
        {
          name: "👑 Owner",
          value: `<@${guild.ownerId}>`,
          inline: true,
        },
        {
          name: "👥 Members",
          value: `${guild.memberCount}`,
          inline: true,
        },
        {
          name: "💬 Channels",
          value: `${guild.channels.cache.size}`,
          inline: true,
        },
        {
          name: "😀 Emojis",
          value: `${guild.emojis.cache.size}`,
          inline: true,
        },
        {
          name: "🎭 Roles",
          value: `${guild.roles.cache.size}`,
          inline: true,
        },
        {
          name: "⚙️ Prefix",
          value: `\`${guildData.prefix}\``,
          inline: true,
        },
        {
          name: "📅 Dibuat",
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: true,
        },
      ],
      footer: {
        text: `Boost Level: ${guild.premiumTier}`,
      },
      timestamp: new Date(),
    };

    await message.reply({ embeds: [embed] });
  },
};

import User from "../../models/User.js";

export default {
  name: "profile",
  description: "Lihat profil user",
  async execute(message, args, client) {
    const targetUser = message.mentions.users.first() || message.author;

    let userData = await User.findOne({ discordId: targetUser.id });

    if (!userData) {
      userData = await User.create({
        discordId: targetUser.id,
        username: targetUser.username,
        discriminator: targetUser.discriminator || "0",
        avatar: targetUser.avatar,
      });
    }

    const embed = {
      color: 0x5865f2,
      title: `📋 Profil ${targetUser.username}`,
      thumbnail: {
        url: targetUser.displayAvatarURL({ dynamic: true, size: 256 }),
      },
      fields: [
        {
          name: "🎮 Discord ID",
          value: userData.discordId,
          inline: true,
        },
        {
          name: "⭐ Level",
          value: `${userData.level}`,
          inline: true,
        },
        {
          name: "✨ Experience",
          value: `${userData.experience}`,
          inline: true,
        },
        {
          name: "💰 Points",
          value: `${userData.points}`,
          inline: true,
        },
        {
          name: "⚠️ Warnings",
          value: `${userData.warnings}`,
          inline: true,
        },
        {
          name: "📅 Bergabung",
          value: `<t:${Math.floor(userData.joinedAt.getTime() / 1000)}:R>`,
          inline: true,
        },
      ],
      footer: {
        text: `Terakhir aktif: ${userData.lastActive.toLocaleDateString(
          "id-ID"
        )}`,
      },
      timestamp: new Date(),
    };

    await message.reply({ embeds: [embed] });
  },
};

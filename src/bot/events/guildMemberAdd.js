import Guild from "../../models/Guild.js";
import User from "../../models/User.js";

export default {
  name: "guildMemberAdd",
  async execute(member, client) {
    // Create user in database
    await User.findOneAndUpdate(
      { discordId: member.id },
      {
        discordId: member.id,
        username: member.user.username,
        discriminator: member.user.discriminator || "0",
        avatar: member.user.avatar,
        joinedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Get guild settings
    const guildData = await Guild.findOne({ guildId: member.guild.id });

    if (!guildData || !guildData.settings.welcomeSystem) return;

    // Send welcome message
    if (guildData.welcomeChannel) {
      const channel = member.guild.channels.cache.get(guildData.welcomeChannel);

      if (channel) {
        const welcomeMessage = guildData.welcomeMessage
          .replace("{user}", `<@${member.id}>`)
          .replace("{server}", member.guild.name)
          .replace("{memberCount}", member.guild.memberCount);

        const embed = {
          color: 0x57f287,
          title: "👋 Selamat Datang!",
          description: welcomeMessage,
          thumbnail: {
            url: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
          },
          footer: {
            text: `Member #${member.guild.memberCount}`,
          },
          timestamp: new Date(),
        };

        await channel.send({ embeds: [embed] });
      }
    }

    // Auto role
    if (guildData.autoRole) {
      const role = member.guild.roles.cache.get(guildData.autoRole);
      if (role) {
        await member.roles.add(role).catch(console.error);
      }
    }
  },
};

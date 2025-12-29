export default {
  name: "avatar",
  aliases: ["av", "pfp"],
  description: "Lihat avatar user",
  async execute(message, args, client) {
    const targetUser = message.mentions.users.first() || message.author;

    const embed = {
      color: 0x5865f2,
      title: `🖼️ Avatar ${targetUser.username}`,
      image: {
        url: targetUser.displayAvatarURL({ dynamic: true, size: 1024 }),
      },
      footer: {
        text: `Diminta oleh ${message.author.username}`,
      },
      timestamp: new Date(),
    };

    await message.reply({ embeds: [embed] });
  },
};

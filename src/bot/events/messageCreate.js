import Guild from "../../models/Guild.js";
import User from "../../models/User.js";

export default {
  name: "messageCreate",
  async execute(message, client) {
    // Ignore bots
    if (message.author.bot) return;

    // Ignore DMs
    if (!message.guild) return;

    // Get guild prefix from database
    let guildData = await Guild.findOne({ guildId: message.guild.id });
    const prefix = guildData?.prefix || "!";

    // Update user activity
    await User.findOneAndUpdate(
      { discordId: message.author.id },
      {
        discordId: message.author.id,
        username: message.author.username,
        discriminator: message.author.discriminator || "0",
        avatar: message.author.avatar,
        lastActive: new Date(),
        $inc: { experience: Math.floor(Math.random() * 10) + 1 },
      },
      { upsert: true, new: true }
    );

    // Check for command
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Find command
    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command) return;

    // Check permissions
    if (command.permissions) {
      const missingPermissions = command.permissions.filter(
        (perm) => !message.member.permissions.has(perm)
      );

      if (missingPermissions.length > 0) {
        return message.reply(
          `❌ Kamu tidak memiliki permission: ${missingPermissions.join(", ")}`
        );
      }
    }

    // Execute command
    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      await message.reply("❌ Terjadi error saat menjalankan command!");
    }
  },
};

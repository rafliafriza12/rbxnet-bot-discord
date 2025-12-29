export default {
  name: "help",
  aliases: ["h", "commands"],
  description: "Tampilkan daftar command",
  async execute(message, args, client) {
    const commands = client.commands;

    const commandList = commands
      .map((cmd) => {
        const aliases = cmd.aliases ? ` (${cmd.aliases.join(", ")})` : "";
        return `**${cmd.name}**${aliases}\n└ ${cmd.description}`;
      })
      .join("\n\n");

    const embed = {
      color: 0x5865f2,
      title: "📚 Daftar Command",
      description: commandList,
      footer: {
        text: `Total ${commands.size} commands`,
      },
      timestamp: new Date(),
    };

    await message.reply({ embeds: [embed] });
  },
};

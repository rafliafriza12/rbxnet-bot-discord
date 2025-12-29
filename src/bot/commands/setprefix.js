import Guild from "../../models/Guild.js";

export default {
  name: "setprefix",
  description: "Ubah prefix bot untuk server ini",
  permissions: ["ManageGuild"],
  async execute(message, args, client) {
    if (!args[0]) {
      return message.reply(
        "❌ Mohon masukkan prefix baru! Contoh: `!setprefix ?`"
      );
    }

    const newPrefix = args[0];

    if (newPrefix.length > 5) {
      return message.reply("❌ Prefix tidak boleh lebih dari 5 karakter!");
    }

    await Guild.findOneAndUpdate(
      { guildId: message.guild.id },
      {
        guildId: message.guild.id,
        name: message.guild.name,
        prefix: newPrefix,
      },
      { upsert: true, new: true }
    );

    await message.reply(`✅ Prefix berhasil diubah menjadi \`${newPrefix}\``);
  },
};

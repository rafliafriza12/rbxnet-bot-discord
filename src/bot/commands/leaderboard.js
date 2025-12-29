import User from "../../models/User.js";

export default {
  name: "leaderboard",
  aliases: ["lb", "top"],
  description: "Lihat leaderboard",
  async execute(message, args, client) {
    const topUsers = await User.find()
      .sort({ level: -1, experience: -1 })
      .limit(10);

    if (topUsers.length === 0) {
      return message.reply("❌ Belum ada data user di leaderboard.");
    }

    const leaderboardList = topUsers
      .map((user, index) => {
        const medal =
          index === 0
            ? "🥇"
            : index === 1
            ? "🥈"
            : index === 2
            ? "🥉"
            : `${index + 1}.`;
        return `${medal} **${user.username}** - Level ${user.level} (${user.experience} XP)`;
      })
      .join("\n");

    const embed = {
      color: 0xffd700,
      title: "🏆 Leaderboard",
      description: leaderboardList,
      footer: {
        text: `Top 10 users berdasarkan level`,
      },
      timestamp: new Date(),
    };

    await message.reply({ embeds: [embed] });
  },
};

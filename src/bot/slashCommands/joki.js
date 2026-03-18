import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import Joki from "../../models/Joki.js";

// Helper function untuk membuat embed daftar game (dengan gambar per game)
export function createGameListEmbeds(
  games,
  currentPage,
  totalPages,
  itemsPerPage,
) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, games.length);
  const gamesToShow = games.slice(startIndex, endIndex);

  const embeds = [];

  // Header embed
  const headerEmbed = new EmbedBuilder()
    .setTitle("🎮 DAFTAR JOKI GAME TERSEDIA")
    .setDescription(
      "═══════════════════════════════\n\n💡 Ketik `/joki nomor:<angka>` untuk melihat detail game",
    )
    .setColor("#00ff00");

  embeds.push(headerEmbed);

  // Embed per game dengan gambar
  gamesToShow.forEach((game, index) => {
    const actualIndex = startIndex + index + 1;
    const itemCount = game.item ? game.item.length : 0;

    const gameEmbed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setAuthor({
        name: `${actualIndex}. ${game.gameName}`,
        iconURL: game.imgUrl || undefined,
      })
      .setDescription(
        `👤 **Developer:** ${
          game.developer || "Unknown"
        }\n📦 **Paket tersedia:** ${itemCount} paket`,
      );

    if (game.imgUrl) {
      gameEmbed.setThumbnail(game.imgUrl);
    }

    embeds.push(gameEmbed);
  });

  // Footer embed dengan info halaman
  const footerEmbed = new EmbedBuilder()
    .setColor("#00ff00")
    .setFooter({
      text: `Halaman ${currentPage}/${totalPages} • Total ${games.length} game`,
    })
    .setTimestamp();

  embeds.push(footerEmbed);

  return embeds;
}

// Helper function untuk membuat embed detail game dengan list item
export function createGameDetailEmbed(
  game,
  gameNumber,
  currentPage,
  totalPages,
  itemsPerPage,
) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, game.item.length);
  const itemsToShow = game.item.slice(startIndex, endIndex);

  const embed = new EmbedBuilder()
    .setTitle(`🎮 ${game.gameName}`)
    .setColor("#0099ff")
    .setTimestamp();

  if (game.imgUrl) {
    embed.setThumbnail(game.imgUrl);
  }

  let description = "";
  if (game.developer) {
    description += `👤 **Developer:** ${game.developer}\n`;
  }
  description += `📦 **Total Paket:** ${game.item.length} paket\n`;
  description += `═══════════════════════════════\n\n`;
  description += `💡 Ketik \`/joki nomor:${gameNumber} item:<angka>\` untuk detail item`;

  embed.setDescription(description);

  // Daftar item
  let itemList = "";
  itemsToShow.forEach((item, index) => {
    const actualIndex = startIndex + index + 1;
    const priceFormatted = item.price.toLocaleString("id-ID");
    itemList += `**${actualIndex}.** ${item.itemName}\n`;
    itemList += `     💰 Rp ${priceFormatted}\n`;

    itemList += "\n";
  });

  embed.addFields({
    name: `📦 Daftar Item`,
    value: itemList || "Tidak ada item tersedia",
  });

  embed.setFooter({
    text: `Halaman ${currentPage}/${totalPages} • Total ${game.item.length} item`,
  });

  return embed;
}

// Helper function untuk membuat tombol pagination
export function createPaginationButtons(
  currentPage,
  totalPages,
  type,
  extraData = "",
) {
  const row = new ActionRowBuilder();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`joki_${type}_prev_${currentPage}_${extraData}`)
      .setLabel("◀️ prev")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 1),
    new ButtonBuilder()
      .setCustomId(`joki_${type}_page`)
      .setLabel(`${currentPage}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`joki_${type}_next_${currentPage}_${extraData}`)
      .setLabel("next ▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages),
  );

  return row;
}

export default {
  data: new SlashCommandBuilder()
    .setName("joki")
    .setDescription("Lihat daftar game joki dan detailnya")
    .addIntegerOption((option) =>
      option
        .setName("nomor")
        .setDescription(
          "Nomor urutan game (kosongkan untuk melihat daftar game)",
        )
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("item")
        .setDescription(
          "Nomor urutan item (kosongkan untuk melihat daftar item)",
        )
        .setRequired(false),
    ),

  async execute(interaction) {
    const gameNumber = interaction.options.getInteger("nomor");
    const itemNumber = interaction.options.getInteger("item");

    try {
      const games = await Joki.find().sort({ gameName: 1 });

      // Jika tidak ada parameter, tampilkan daftar game
      if (!gameNumber) {
        if (games.length === 0) {
          return interaction.reply({
            content: "❌ Tidak ada game joki yang tersedia saat ini.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const itemsPerPage = 10;
        const totalPages = Math.ceil(games.length / itemsPerPage);
        const currentPage = 1;

        const embeds = createGameListEmbeds(
          games,
          currentPage,
          totalPages,
          itemsPerPage,
        );
        const components =
          totalPages > 1
            ? [createPaginationButtons(currentPage, totalPages, "games")]
            : [];

        return interaction.reply({
          embeds: embeds,
          components,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Validasi nomor game
      if (gameNumber < 1 || gameNumber > games.length) {
        return interaction.reply({
          content: `❌ Nomor game tidak valid! Pilih antara 1 - ${games.length}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const game = games[gameNumber - 1];

      // Jika ada nomor game tapi tidak ada nomor item, tampilkan detail game
      if (!itemNumber) {
        if (!game.item || game.item.length === 0) {
          const embed = new EmbedBuilder()
            .setTitle(`🎮 ${game.gameName}`)
            .setDescription(
              `👤 **Developer:** ${
                game.developer || "Unknown"
              }\n\n❌ Tidak ada item tersedia untuk game ini.`,
            )
            .setColor("#0099ff")
            .setTimestamp();

          if (game.imgUrl) {
            embed.setImage(game.imgUrl);
          }

          return interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
          });
        }

        const itemsPerPage = 10;
        const totalPages = Math.ceil(game.item.length / itemsPerPage);
        const currentPage = 1;

        const embed = createGameDetailEmbed(
          game,
          gameNumber,
          currentPage,
          totalPages,
          itemsPerPage,
        );
        const components =
          totalPages > 1
            ? [
                createPaginationButtons(
                  currentPage,
                  totalPages,
                  "items",
                  gameNumber.toString(),
                ),
              ]
            : [];

        return interaction.reply({
          embeds: [embed],
          components,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Jika ada nomor game dan nomor item, tampilkan detail item
      if (!game.item || game.item.length === 0) {
        return interaction.reply({
          content: "❌ Game ini tidak memiliki item!",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (itemNumber < 1 || itemNumber > game.item.length) {
        return interaction.reply({
          content: `❌ Nomor item tidak valid! Pilih antara 1 - ${game.item.length}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const item = game.item[itemNumber - 1];
      const priceFormatted = item.price.toLocaleString("id-ID");

      const embed = new EmbedBuilder()
        .setTitle(`�� ${item.itemName}`)
        .setDescription(`Item dari game **${game.gameName}**`)
        .setColor("#ff9900")
        .addFields(
          { name: "💰 Harga", value: `Rp ${priceFormatted}`, inline: true },
          { name: "🎮 Game", value: game.gameName, inline: true },
        )
        .setTimestamp();

      if (item.description) {
        embed.addFields({ name: "📝 Deskripsi", value: item.description });
      }

      // Syarat Joki
      if (item.syaratJoki && item.syaratJoki.length > 0) {
        const syaratList = item.syaratJoki
          .map((s, i) => `${i + 1}. ${s}`)
          .join("\n");
        embed.addFields({ name: "📋 Syarat Joki", value: syaratList });
      }

      // Proses Joki
      if (item.prosesJoki && item.prosesJoki.length > 0) {
        const prosesList = item.prosesJoki
          .map((p, i) => `${i + 1}. ${p}`)
          .join("\n");
        embed.addFields({ name: "⚙️ Proses Joki", value: prosesList });
      }

      if (item.imgUrl) {
        embed.setImage(item.imgUrl);
      } else if (game.imgUrl) {
        embed.setThumbnail(game.imgUrl);
      }

      // Tombol kembali
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`joki_back_to_game_${gameNumber}`)
          .setLabel("⬅️ Kembali ke Daftar Item")
          .setStyle(ButtonStyle.Secondary),
      );

      return interaction.reply({
        embeds: [embed],
        components: [row],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Error in joki command:", error);
      return interaction.reply({
        content: "❌ Terjadi kesalahan saat mengambil data joki.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

import { MessageFlags, PermissionFlagsBits } from "discord.js";
import Joki from "../../models/Joki.js";
import Transaksi from "../../models/Transaksi.js";
import {
  createGameListEmbeds,
  createGameDetailEmbed,
  createPaginationButtons,
} from "../slashCommands/joki.js";
import {
  createTransaksiListEmbeds,
  createTransaksiPaginationButtons,
} from "../slashCommands/transaksi.js";

export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(
          `Error executing slash command ${interaction.commandName}:`,
          error,
        );

        const errorMessage = {
          content: "❌ Terjadi error saat menjalankan command!",
          flags: MessageFlags.Ephemeral,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Handle button interactions untuk pagination joki
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // Handle joki pagination buttons
      if (customId.startsWith("joki_")) {
        try {
          const parts = customId.split("_");
          const type = parts[1]; // "games" atau "items"
          const action = parts[2]; // "first", "prev", "next", "last", "back"

          const games = await Joki.find().sort({ createdAt: 1 });
          // 8 game per halaman (8 embeds + header + footer = 10, limit Discord)
          // 10 item per halaman (ditampilkan dalam 1 embed field)
          const gamesPerPage = 8;
          const itemsPerPage = 10;

          // Handle kembali ke daftar item dari detail item
          if (type === "back" && action === "to") {
            const gameNumber = parseInt(parts[4]);
            const game = games[gameNumber - 1];
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

            return interaction.update({
              embeds: [embed],
              components,
            });
          }

          // Handle pagination untuk daftar game
          if (type === "games") {
            const totalPages = Math.ceil(games.length / gamesPerPage);
            let currentPage = 1;

            if (action === "first") {
              currentPage = 1;
            } else if (action === "prev") {
              currentPage = parseInt(parts[3]) - 1;
            } else if (action === "next") {
              currentPage = parseInt(parts[3]) + 1;
            } else if (action === "last") {
              currentPage = parseInt(parts[3]);
            }

            currentPage = Math.max(1, Math.min(currentPage, totalPages));

            const embeds = createGameListEmbeds(
              games,
              currentPage,
              totalPages,
              gamesPerPage,
            );
            const components =
              totalPages > 1
                ? [createPaginationButtons(currentPage, totalPages, "games")]
                : [];

            return interaction.update({
              embeds: embeds,
              components,
            });
          }

          // Handle pagination untuk daftar item
          if (type === "items") {
            let gameNumber;
            let currentPage = 1;

            if (action === "first") {
              gameNumber = parseInt(parts[3]);
            } else if (action === "prev") {
              currentPage = parseInt(parts[3]) - 1;
              gameNumber = parseInt(parts[4]);
            } else if (action === "next") {
              currentPage = parseInt(parts[3]) + 1;
              gameNumber = parseInt(parts[4]);
            } else if (action === "last") {
              currentPage = parseInt(parts[3]);
              gameNumber = parseInt(parts[4]);
            }

            const game = games[gameNumber - 1];
            const totalPages = Math.ceil(game.item.length / itemsPerPage);
            currentPage = Math.max(1, Math.min(currentPage, totalPages));

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

            return interaction.update({
              embeds: [embed],
              components,
            });
          }
        } catch (error) {
          console.error("Error handling joki button:", error);
          return interaction.reply({
            content: "❌ Terjadi kesalahan saat memproses tombol.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      // Handle transaksi pagination buttons
      if (customId.startsWith("trx_list_")) {
        try {
          const parts = customId.split("_");
          const action = parts[2]; // "prev" atau "next"
          const currentPageFromId = parseInt(parts[3]);
          const targetUserId = parts[4]; // user id atau "all"

          const ITEMS_PER_PAGE = 10;
          const isUserAdmin = interaction.member.permissions.has(
            PermissionFlagsBits.Administrator,
          );

          let query = {};
          let displayUser = null;

          if (targetUserId && targetUserId !== "all") {
            query.discordId = targetUserId;
            try {
              displayUser = await interaction.client.users.fetch(targetUserId);
            } catch (e) {
              displayUser = null;
            }
          } else if (!isUserAdmin) {
            query.discordId = interaction.user.id;
            displayUser = interaction.user;
          }

          const totalItems = await Transaksi.countDocuments(query);
          const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

          // Hitung total harga dari semua transaksi
          const allTransaksi = await Transaksi.find(query);
          const totalHarga = allTransaksi.reduce(
            (sum, trx) => sum + trx.price,
            0,
          );

          let currentPage = currentPageFromId;
          if (action === "prev") {
            currentPage = Math.max(1, currentPageFromId - 1);
          } else if (action === "next") {
            currentPage = Math.min(totalPages, currentPageFromId + 1);
          }

          const skip = (currentPage - 1) * ITEMS_PER_PAGE;
          const transaksiList = await Transaksi.find(query)
            .sort({ transactionDate: -1 })
            .skip(skip)
            .limit(ITEMS_PER_PAGE);

          const embeds = createTransaksiListEmbeds(
            transaksiList,
            currentPage,
            totalPages,
            totalItems,
            totalHarga,
            displayUser,
          );

          const components =
            totalPages > 1
              ? [
                  createTransaksiPaginationButtons(
                    currentPage,
                    totalPages,
                    targetUserId,
                  ),
                ]
              : [];

          return interaction.update({
            embeds: embeds,
            components,
          });
        } catch (error) {
          console.error("Error handling transaksi pagination:", error);
          return interaction.reply({
            content: "❌ Terjadi kesalahan saat memproses tombol.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      // Handle transaksi delete button
      if (customId.startsWith("trx_delete_")) {
        try {
          const isUserAdmin = interaction.member.permissions.has(
            PermissionFlagsBits.Administrator,
          );
          if (!isUserAdmin) {
            return interaction.reply({
              content: "❌ Hanya admin yang bisa menghapus transaksi!",
              flags: MessageFlags.Ephemeral,
            });
          }

          const orderId = customId.replace("trx_delete_", "");
          const trx = await Transaksi.findOneAndDelete({ oderId: orderId });

          if (!trx) {
            return interaction.reply({
              content: `❌ Transaksi dengan Order ID \`${orderId}\` tidak ditemukan!`,
              flags: MessageFlags.Ephemeral,
            });
          }

          return interaction.update({
            content: `✅ Transaksi \`${orderId}\` berhasil dihapus!`,
            embeds: [],
            components: [],
          });
        } catch (error) {
          console.error("Error handling transaksi delete:", error);
          return interaction.reply({
            content: "❌ Terjadi kesalahan saat menghapus transaksi.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    }
  },
};

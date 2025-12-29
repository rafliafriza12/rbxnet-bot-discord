import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import Transaksi from "../../models/Transaksi.js";

const ITEMS_PER_PAGE = 10;

// Status emoji mapping
const statusEmoji = {
  pending: "🟡",
  process: "🔵",
  completed: "🟢",
  cancelled: "🔴",
};

const statusText = {
  pending: "Pending",
  process: "Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

// Helper: Check if user is admin
function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

// Helper: Create transaksi list embeds (multiple embeds, 1 per transaksi)
export function createTransaksiListEmbeds(
  transaksiList,
  currentPage,
  totalPages,
  totalItems,
  totalHarga,
  targetUser = null
) {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const embeds = [];

  // Header embed
  const headerEmbed = new EmbedBuilder().setColor("#0099ff");

  if (targetUser) {
    headerEmbed.setTitle(`📋 Transaksi ${targetUser.username}`);
    headerEmbed.setThumbnail(targetUser.displayAvatarURL());
    headerEmbed.setDescription(`Daftar transaksi milik <@${targetUser.id}>`);
  } else {
    headerEmbed.setTitle("📋 Daftar Transaksi");
  }

  embeds.push(headerEmbed);

  if (transaksiList.length === 0) {
    const emptyEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setDescription("❌ Tidak ada transaksi ditemukan.");
    embeds.push(emptyEmbed);
    return embeds;
  }

  // Embed per transaksi
  transaksiList.forEach((trx, index) => {
    const actualIndex = startIndex + index + 1;
    const priceFormatted = trx.price.toLocaleString("id-ID");
    const dateFormatted = new Date(trx.transactionDate).toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    const statusColor =
      trx.status === "completed"
        ? "#00ff00"
        : trx.status === "cancelled"
        ? "#ff0000"
        : trx.status === "process"
        ? "#0099ff"
        : "#ffff00";

    const trxEmbed = new EmbedBuilder()
      .setColor(statusColor)
      .setAuthor({
        name: `${actualIndex}. ${trx.oderId}`,
      })
      .setDescription(
        `${statusEmoji[trx.status]} **Status:** ${statusText[trx.status]}\n` +
          `🎮 **Game:** ${trx.gameName}\n` +
          `📦 **Item:** ${trx.itemName}\n` +
          `💰 **Harga:** Rp ${priceFormatted}\n` +
          `📅 **Tanggal:** ${dateFormatted}\n` +
          `👤 **User:** ${trx.discordUsername}`
      );

    embeds.push(trxEmbed);
  });

  // Footer embed dengan total keseluruhan
  const totalHargaFormatted = totalHarga.toLocaleString("id-ID");
  const footerEmbed = new EmbedBuilder()
    .setColor("#00ff00")
    .setDescription(
      `💰 **Total Semua Transaksi:** Rp ${totalHargaFormatted}\n` +
        `📊 **Jumlah Transaksi:** ${totalItems} transaksi`
    )
    .setFooter({
      text: `Halaman ${currentPage}/${totalPages}`,
    })
    .setTimestamp();

  embeds.push(footerEmbed);

  return embeds;
}

// Helper: Create pagination buttons for transaksi
export function createTransaksiPaginationButtons(
  currentPage,
  totalPages,
  targetUserId = ""
) {
  const row = new ActionRowBuilder();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`trx_list_prev_${currentPage}_${targetUserId}`)
      .setLabel("◀️ Prev")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 1),
    new ButtonBuilder()
      .setCustomId(`trx_list_page`)
      .setLabel(`${currentPage}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`trx_list_next_${currentPage}_${targetUserId}`)
      .setLabel("Next ▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages)
  );

  return row;
}

// Helper: Create detail embed for single transaksi
function createTransaksiDetailEmbed(trx) {
  const priceFormatted = trx.price.toLocaleString("id-ID");
  const dateFormatted = new Date(trx.transactionDate).toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const embed = new EmbedBuilder()
    .setTitle(`📄 Detail Transaksi`)
    .setColor(
      trx.status === "completed"
        ? "#00ff00"
        : trx.status === "cancelled"
        ? "#ff0000"
        : trx.status === "process"
        ? "#0099ff"
        : "#ffff00"
    )
    .addFields(
      { name: "🆔 Order ID", value: trx.oderId, inline: true },
      {
        name: `${statusEmoji[trx.status]} Status`,
        value: statusText[trx.status],
        inline: true,
      },
      {
        name: "👤 User",
        value: `<@${trx.discordId}> (${trx.discordUsername})`,
        inline: false,
      },
      { name: "🎮 Game", value: trx.gameName, inline: true },
      { name: "📦 Item", value: trx.itemName, inline: true },
      { name: "💰 Harga", value: `Rp ${priceFormatted}`, inline: true },
      { name: "📅 Tanggal", value: dateFormatted, inline: false }
    )
    .setTimestamp();

  if (trx.notes) {
    embed.addFields({ name: "📝 Catatan", value: trx.notes });
  }

  return embed;
}

export default {
  data: new SlashCommandBuilder()
    .setName("transaksi")
    .setDescription("Kelola transaksi joki")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Lihat daftar transaksi")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User yang ingin dilihat transaksinya (admin only)")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("detail")
        .setDescription("Lihat detail transaksi")
        .addStringOption((option) =>
          option
            .setName("order_id")
            .setDescription("Order ID transaksi")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Buat transaksi baru (admin only)")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User pemilik transaksi")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("game").setDescription("Nama game").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("item").setDescription("Nama item").setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("harga")
            .setDescription("Harga dalam Rupiah")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("tanggal")
            .setDescription("Tanggal transaksi (format: DD/MM/YYYY HH:mm)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Status transaksi")
            .setRequired(false)
            .addChoices(
              { name: "🟡 Pending", value: "pending" },
              { name: "🔵 Diproses", value: "process" },
              { name: "🟢 Selesai", value: "completed" },
              { name: "🔴 Dibatalkan", value: "cancelled" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("catatan")
            .setDescription("Catatan tambahan")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update transaksi (admin only)")
        .addStringOption((option) =>
          option
            .setName("order_id")
            .setDescription("Order ID transaksi")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("game")
            .setDescription("Nama game baru")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("item")
            .setDescription("Nama item baru")
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName("harga")
            .setDescription("Harga baru dalam Rupiah")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("tanggal")
            .setDescription("Tanggal transaksi baru (format: DD/MM/YYYY HH:mm)")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Status transaksi baru")
            .setRequired(false)
            .addChoices(
              { name: "🟡 Pending", value: "pending" },
              { name: "🔵 Diproses", value: "process" },
              { name: "🟢 Selesai", value: "completed" },
              { name: "🔴 Dibatalkan", value: "cancelled" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("catatan")
            .setDescription("Catatan tambahan baru")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Hapus transaksi (admin only)")
        .addStringOption((option) =>
          option
            .setName("order_id")
            .setDescription("Order ID transaksi yang akan dihapus")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case "list":
          return await handleList(interaction);
        case "detail":
          return await handleDetail(interaction);
        case "create":
          return await handleCreate(interaction);
        case "update":
          return await handleUpdate(interaction);
        case "delete":
          return await handleDelete(interaction);
      }
    } catch (error) {
      console.error("Error in transaksi command:", error);
      return interaction.reply({
        content: "❌ Terjadi kesalahan saat memproses transaksi.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

// Handle list subcommand
async function handleList(interaction) {
  const targetUser = interaction.options.getUser("user");
  const isUserAdmin = isAdmin(interaction.member);

  let query = {};
  let displayUser = null;

  // Jika admin melihat transaksi user lain
  if (targetUser) {
    if (!isUserAdmin) {
      return interaction.reply({
        content: "❌ Hanya admin yang bisa melihat transaksi user lain!",
        flags: MessageFlags.Ephemeral,
      });
    }
    query.discordId = targetUser.id;
    displayUser = targetUser;
  } else if (!isUserAdmin) {
    // User biasa hanya bisa lihat transaksi sendiri
    query.discordId = interaction.user.id;
    displayUser = interaction.user;
  }
  // Admin tanpa target user = lihat semua transaksi

  const totalItems = await Transaksi.countDocuments(query);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const currentPage = 1;

  // Hitung total harga dari semua transaksi (bukan hanya halaman ini)
  const allTransaksi = await Transaksi.find(query);
  const totalHarga = allTransaksi.reduce((sum, trx) => sum + trx.price, 0);

  const transaksiList = await Transaksi.find(query)
    .sort({ transactionDate: -1 })
    .skip(0)
    .limit(ITEMS_PER_PAGE);

  const embeds = createTransaksiListEmbeds(
    transaksiList,
    currentPage,
    totalPages,
    totalItems,
    totalHarga,
    displayUser
  );

  const components =
    totalPages > 1
      ? [
          createTransaksiPaginationButtons(
            currentPage,
            totalPages,
            displayUser?.id || "all"
          ),
        ]
      : [];

  return interaction.reply({
    embeds: embeds,
    components,
    flags: MessageFlags.Ephemeral,
  });
}

// Handle detail subcommand
async function handleDetail(interaction) {
  const orderId = interaction.options.getString("order_id");
  const isUserAdmin = isAdmin(interaction.member);

  const trx = await Transaksi.findOne({ oderId: orderId });

  if (!trx) {
    return interaction.reply({
      content: `❌ Transaksi dengan Order ID \`${orderId}\` tidak ditemukan!`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // User biasa hanya bisa lihat transaksi sendiri
  if (!isUserAdmin && trx.discordId !== interaction.user.id) {
    return interaction.reply({
      content: "❌ Anda tidak memiliki akses ke transaksi ini!",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = createTransaksiDetailEmbed(trx);

  return interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

// Handle create subcommand
async function handleCreate(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Hanya admin yang bisa membuat transaksi!",
      flags: MessageFlags.Ephemeral,
    });
  }

  const targetUser = interaction.options.getUser("user");
  const gameName = interaction.options.getString("game");
  const itemName = interaction.options.getString("item");
  const price = interaction.options.getInteger("harga");
  const dateStr = interaction.options.getString("tanggal");
  const status = interaction.options.getString("status") || "pending";
  const notes = interaction.options.getString("catatan") || "";

  // Parse tanggal (format: DD/MM/YYYY HH:mm)
  const dateMatch = dateStr.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
  );
  if (!dateMatch) {
    return interaction.reply({
      content:
        "❌ Format tanggal salah! Gunakan format: `DD/MM/YYYY HH:mm` (contoh: 25/12/2025 14:30)",
      flags: MessageFlags.Ephemeral,
    });
  }

  const [, day, month, year, hour, minute] = dateMatch;
  const transactionDate = new Date(year, month - 1, day, hour, minute);

  if (isNaN(transactionDate.getTime())) {
    return interaction.reply({
      content: "❌ Tanggal tidak valid!",
      flags: MessageFlags.Ephemeral,
    });
  }

  // Generate order ID
  const orderId = await Transaksi.generateOrderId();

  const newTransaksi = new Transaksi({
    oderId: orderId,
    discordId: targetUser.id,
    discordUsername: targetUser.username,
    gameName,
    itemName,
    price,
    status,
    transactionDate,
    notes,
    createdBy: interaction.user.id,
  });

  await newTransaksi.save();

  const embed = createTransaksiDetailEmbed(newTransaksi);
  embed.setTitle("✅ Transaksi Berhasil Dibuat!");

  return interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

// Handle update subcommand
async function handleUpdate(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Hanya admin yang bisa mengupdate transaksi!",
      flags: MessageFlags.Ephemeral,
    });
  }

  const orderId = interaction.options.getString("order_id");
  const trx = await Transaksi.findOne({ oderId: orderId });

  if (!trx) {
    return interaction.reply({
      content: `❌ Transaksi dengan Order ID \`${orderId}\` tidak ditemukan!`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // Get update fields
  const gameName = interaction.options.getString("game");
  const itemName = interaction.options.getString("item");
  const price = interaction.options.getInteger("harga");
  const dateStr = interaction.options.getString("tanggal");
  const status = interaction.options.getString("status");
  const notes = interaction.options.getString("catatan");

  // Update fields if provided
  if (gameName) trx.gameName = gameName;
  if (itemName) trx.itemName = itemName;
  if (price) trx.price = price;
  if (status) trx.status = status;
  if (notes !== null && notes !== undefined) trx.notes = notes;

  if (dateStr) {
    const dateMatch = dateStr.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
    );
    if (!dateMatch) {
      return interaction.reply({
        content: "❌ Format tanggal salah! Gunakan format: `DD/MM/YYYY HH:mm`",
        flags: MessageFlags.Ephemeral,
      });
    }
    const [, day, month, year, hour, minute] = dateMatch;
    trx.transactionDate = new Date(year, month - 1, day, hour, minute);
  }

  await trx.save();

  const embed = createTransaksiDetailEmbed(trx);
  embed.setTitle("✅ Transaksi Berhasil Diupdate!");

  return interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

// Handle delete subcommand
async function handleDelete(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Hanya admin yang bisa menghapus transaksi!",
      flags: MessageFlags.Ephemeral,
    });
  }

  const orderId = interaction.options.getString("order_id");
  const trx = await Transaksi.findOneAndDelete({ oderId: orderId });

  if (!trx) {
    return interaction.reply({
      content: `❌ Transaksi dengan Order ID \`${orderId}\` tidak ditemukan!`,
      flags: MessageFlags.Ephemeral,
    });
  }

  return interaction.reply({
    content: `✅ Transaksi \`${orderId}\` berhasil dihapus!`,
    flags: MessageFlags.Ephemeral,
  });
}

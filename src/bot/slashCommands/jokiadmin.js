import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import Joki from "../../models/Joki.js";
import { uploadFromUrl, deleteFromUrl } from "../../config/cloudinary.js";

// Helper: cek apakah user adalah admin
function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

// Helper: ambil semua game sorted (konsisten dengan /joki)
async function getAllGames() {
  return Joki.find().sort({ createdAt: 1 });
}

// Helper: ambil game berdasarkan nomor urutan
async function getGameByNomor(nomor) {
  const games = await getAllGames();
  if (nomor < 1 || nomor > games.length) return null;
  return games[nomor - 1];
}

// Helper: buat embed detail game (admin)
function createGameEmbed(game, gameNomor, title = null) {
  const embed = new EmbedBuilder()
    .setTitle(title || `🎮 ${game.gameName}`)
    .setColor("#0099ff")
    .setTimestamp();

  if (game.imgUrl) embed.setImage(game.imgUrl);

  embed.addFields(
    { name: "🔢 Nomor", value: `${gameNomor}`, inline: true },
    { name: "👤 Developer", value: game.developer || "-", inline: true },
    {
      name: "📦 Total Item",
      value: `${game.item?.length || 0} item`,
      inline: true,
    },
  );

  if (game.caraPesan?.length > 0) {
    embed.addFields({
      name: "📋 Cara Pesan",
      value: game.caraPesan.map((c, i) => `${i + 1}. ${c}`).join("\n"),
    });
  }

  return embed;
}

// Helper: buat embed detail item (admin)
function createItemEmbed(game, item, itemNomor, title = null) {
  const priceFormatted = item.price.toLocaleString("id-ID");
  const embed = new EmbedBuilder()
    .setTitle(title || `📦 ${item.itemName}`)
    .setColor("#ff9900")
    .setDescription(`Game: **${game.gameName}**`)
    .setTimestamp();

  if (item.imgUrl) embed.setImage(item.imgUrl);

  embed.addFields(
    { name: "🔢 Nomor Item", value: `${itemNomor}`, inline: true },
    { name: "💰 Harga", value: `Rp ${priceFormatted}`, inline: true },
  );

  if (item.description) {
    embed.addFields({ name: "📝 Deskripsi", value: item.description });
  }
  if (item.syaratJoki?.length > 0) {
    embed.addFields({
      name: "📋 Syarat Joki",
      value: item.syaratJoki.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    });
  }
  if (item.prosesJoki?.length > 0) {
    embed.addFields({
      name: "⚙️ Proses Joki",
      value: item.prosesJoki.map((p, i) => `${i + 1}. ${p}`).join("\n"),
    });
  }

  return embed;
}

// ─────────────────────────────────────────────────────
//  SLASH COMMAND DEFINITION
// ─────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
    .setName("jokiadmin")
    .setDescription("🔒 Admin: Kelola game & item joki")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    // ── GAME ───────────────────────────
    .addSubcommandGroup((group) =>
      group
        .setName("game")
        .setDescription("🔒 Kelola game joki")
        .addSubcommand((sub) =>
          sub
            .setName("list")
            .setDescription("🔒 Lihat semua game beserta nomor urutannya"),
        )
        .addSubcommand((sub) =>
          sub
            .setName("tambah")
            .setDescription("🔒 Tambah game baru")
            .addStringOption((o) =>
              o.setName("nama").setDescription("Nama game").setRequired(true),
            )
            .addStringOption((o) =>
              o
                .setName("developer")
                .setDescription("Nama developer")
                .setRequired(true),
            )
            .addAttachmentOption((o) =>
              o
                .setName("gambar")
                .setDescription("Gambar game")
                .setRequired(false),
            )
            .addStringOption((o) =>
              o
                .setName("cara_pesan")
                .setDescription("Cara pesan (pisahkan dengan |)")
                .setRequired(false),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("edit")
            .setDescription("🔒 Edit game berdasarkan nomor")
            .addIntegerOption((o) =>
              o
                .setName("nomor")
                .setDescription(
                  "Nomor urutan game (lihat di /jokiadmin game list)",
                )
                .setRequired(true),
            )
            .addStringOption((o) =>
              o.setName("nama").setDescription("Nama baru").setRequired(false),
            )
            .addStringOption((o) =>
              o
                .setName("developer")
                .setDescription("Developer baru")
                .setRequired(false),
            )
            .addAttachmentOption((o) =>
              o
                .setName("gambar")
                .setDescription("Gambar baru")
                .setRequired(false),
            )
            .addStringOption((o) =>
              o
                .setName("cara_pesan")
                .setDescription("Cara pesan baru (pisahkan dengan |)")
                .setRequired(false),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("hapus")
            .setDescription("🔒 Hapus game beserta semua item")
            .addIntegerOption((o) =>
              o
                .setName("nomor")
                .setDescription("Nomor urutan game")
                .setRequired(true),
            ),
        ),
    )

    // ── ITEM ───────────────────────────
    .addSubcommandGroup((group) =>
      group
        .setName("item")
        .setDescription("🔒 Kelola item dalam game")
        .addSubcommand((sub) =>
          sub
            .setName("list")
            .setDescription("🔒 Lihat semua item game beserta nomor urutannya")
            .addIntegerOption((o) =>
              o
                .setName("nomor_game")
                .setDescription("Nomor urutan game")
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("tambah")
            .setDescription("🔒 Tambah item ke game")
            .addIntegerOption((o) =>
              o
                .setName("nomor_game")
                .setDescription("Nomor urutan game")
                .setRequired(true),
            )
            .addStringOption((o) =>
              o.setName("nama").setDescription("Nama item").setRequired(true),
            )
            .addIntegerOption((o) =>
              o
                .setName("harga")
                .setDescription("Harga (Rupiah)")
                .setRequired(true),
            )
            .addStringOption((o) =>
              o
                .setName("deskripsi")
                .setDescription("Deskripsi item")
                .setRequired(false),
            )
            .addAttachmentOption((o) =>
              o
                .setName("gambar")
                .setDescription("Gambar item")
                .setRequired(false),
            )
            .addStringOption((o) =>
              o
                .setName("syarat")
                .setDescription("Syarat joki (pisahkan dengan |)")
                .setRequired(false),
            )
            .addStringOption((o) =>
              o
                .setName("proses")
                .setDescription("Proses joki (pisahkan dengan |)")
                .setRequired(false),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("edit")
            .setDescription("🔒 Edit item berdasarkan nomor")
            .addIntegerOption((o) =>
              o
                .setName("nomor_game")
                .setDescription("Nomor urutan game")
                .setRequired(true),
            )
            .addIntegerOption((o) =>
              o
                .setName("nomor_item")
                .setDescription("Nomor urutan item")
                .setRequired(true),
            )
            .addStringOption((o) =>
              o.setName("nama").setDescription("Nama baru").setRequired(false),
            )
            .addIntegerOption((o) =>
              o
                .setName("harga")
                .setDescription("Harga baru")
                .setRequired(false),
            )
            .addStringOption((o) =>
              o
                .setName("deskripsi")
                .setDescription("Deskripsi baru")
                .setRequired(false),
            )
            .addAttachmentOption((o) =>
              o
                .setName("gambar")
                .setDescription("Gambar baru")
                .setRequired(false),
            )
            .addStringOption((o) =>
              o
                .setName("syarat")
                .setDescription("Syarat joki baru (pisahkan dengan |)")
                .setRequired(false),
            )
            .addStringOption((o) =>
              o
                .setName("proses")
                .setDescription("Proses joki baru (pisahkan dengan |)")
                .setRequired(false),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("hapus")
            .setDescription("🔒 Hapus item dari game")
            .addIntegerOption((o) =>
              o
                .setName("nomor_game")
                .setDescription("Nomor urutan game")
                .setRequired(true),
            )
            .addIntegerOption((o) =>
              o
                .setName("nomor_item")
                .setDescription("Nomor urutan item")
                .setRequired(true),
            ),
        ),
    ),

  // ─────────────────────────────────────────────────────
  //  EXECUTE
  // ─────────────────────────────────────────────────────

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        content: "❌ Hanya admin yang bisa menggunakan command ini!",
        flags: MessageFlags.Ephemeral,
      });
    }

    const group = interaction.options.getSubcommandGroup();
    const sub = interaction.options.getSubcommand();

    try {
      if (group === "game") {
        if (sub === "list") return await handleGameList(interaction);
        if (sub === "tambah") return await handleGameTambah(interaction);
        if (sub === "edit") return await handleGameEdit(interaction);
        if (sub === "hapus") return await handleGameHapus(interaction);
      }

      if (group === "item") {
        if (sub === "list") return await handleItemList(interaction);
        if (sub === "tambah") return await handleItemTambah(interaction);
        if (sub === "edit") return await handleItemEdit(interaction);
        if (sub === "hapus") return await handleItemHapus(interaction);
      }
    } catch (error) {
      console.error(`Error in jokiadmin [${group}/${sub}]:`, error);
      const msg = {
        content: `❌ Terjadi kesalahan: ${error.message}`,
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply(msg);
      }
      return interaction.reply(msg);
    }
  },
};

// ─────────────────────────────────────────────────────
//  GAME HANDLERS
// ─────────────────────────────────────────────────────

async function handleGameList(interaction) {
  const games = await getAllGames();
  if (games.length === 0) {
    return interaction.reply({
      content: "❌ Belum ada game joki.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("🔒 Daftar Game Joki (Admin)")
    .setDescription(
      "Gunakan **nomor** untuk edit/hapus game\n═══════════════════════════════",
    )
    .setColor("#0099ff")
    .setTimestamp();

  let list = "";
  games.forEach((g, i) => {
    list += `**${i + 1}.** ${g.gameName}\n`;
    list += `   👤 ${g.developer || "-"} • 📦 ${g.item?.length || 0} item\n\n`;
  });

  embed.addFields({ name: "📋 Game", value: list });
  embed.setFooter({
    text: `Total ${games.length} game • /jokiadmin game edit nomor:<angka>`,
  });

  return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function handleGameTambah(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const nama = interaction.options.getString("nama");
  const developer = interaction.options.getString("developer");
  const gambar = interaction.options.getAttachment("gambar");
  const caraPesanRaw = interaction.options.getString("cara_pesan");

  let imgUrl = "";
  if (gambar) {
    if (!gambar.contentType?.startsWith("image/")) {
      return interaction.editReply({ content: "❌ File harus berupa gambar!" });
    }
    imgUrl = await uploadFromUrl(
      gambar.url,
      "joki/games",
      `game_${nama.toLowerCase().replace(/\s+/g, "_")}`,
    );
  }

  const caraPesan = caraPesanRaw
    ? caraPesanRaw
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  const game = new Joki({
    gameName: nama,
    developer,
    imgUrl,
    caraPesan,
    item: [],
  });
  await game.save();

  // Cari nomor urutan baru
  const games = await getAllGames();
  const nomor =
    games.findIndex((g) => g._id.toString() === game._id.toString()) + 1;

  const embed = createGameEmbed(game, nomor, "✅ Game Berhasil Ditambahkan!");
  return interaction.editReply({ embeds: [embed] });
}

async function handleGameEdit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const nomor = interaction.options.getInteger("nomor");
  const games = await getAllGames();

  if (nomor < 1 || nomor > games.length) {
    return interaction.editReply({
      content: `❌ Nomor game tidak valid! Pilih antara 1 - ${games.length}`,
    });
  }

  const game = games[nomor - 1];

  const nama = interaction.options.getString("nama");
  const developer = interaction.options.getString("developer");
  const gambar = interaction.options.getAttachment("gambar");
  const caraPesanRaw = interaction.options.getString("cara_pesan");

  if (nama) game.gameName = nama;
  if (developer) game.developer = developer;
  if (caraPesanRaw) {
    game.caraPesan = caraPesanRaw
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  if (gambar) {
    if (!gambar.contentType?.startsWith("image/")) {
      return interaction.editReply({ content: "❌ File harus berupa gambar!" });
    }
    if (game.imgUrl) await deleteFromUrl(game.imgUrl);
    game.imgUrl = await uploadFromUrl(
      gambar.url,
      "joki/games",
      `game_${game.gameName.toLowerCase().replace(/\s+/g, "_")}`,
    );
  }

  await game.save();

  // Nomor bisa berubah kalau nama diganti (karena sort abjad), cari ulang
  const updatedGames = await getAllGames();
  const newNomor =
    updatedGames.findIndex((g) => g._id.toString() === game._id.toString()) + 1;

  const embed = createGameEmbed(game, newNomor, "✅ Game Berhasil Diupdate!");
  return interaction.editReply({ embeds: [embed] });
}

async function handleGameHapus(interaction) {
  const nomor = interaction.options.getInteger("nomor");
  const games = await getAllGames();

  if (nomor < 1 || nomor > games.length) {
    return interaction.reply({
      content: `❌ Nomor game tidak valid! Pilih antara 1 - ${games.length}`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const game = games[nomor - 1];

  // Hapus gambar dari cloudinary
  if (game.imgUrl) await deleteFromUrl(game.imgUrl);
  for (const itm of game.item) {
    if (itm.imgUrl) await deleteFromUrl(itm.imgUrl);
  }

  await Joki.findByIdAndDelete(game._id);

  return interaction.reply({
    content: `✅ Game **${game.gameName}** (nomor ${nomor}) beserta **${game.item.length} item** berhasil dihapus!`,
    flags: MessageFlags.Ephemeral,
  });
}

// ─────────────────────────────────────────────────────
//  ITEM HANDLERS
// ─────────────────────────────────────────────────────

async function handleItemList(interaction) {
  const nomorGame = interaction.options.getInteger("nomor_game");
  const game = await getGameByNomor(nomorGame);

  if (!game) {
    const games = await getAllGames();
    return interaction.reply({
      content: `❌ Nomor game tidak valid! Pilih antara 1 - ${games.length}`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!game.item || game.item.length === 0) {
    return interaction.reply({
      content: `❌ Game **${game.gameName}** belum punya item.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`🔒 Item: ${game.gameName} (Admin)`)
    .setDescription(
      "Gunakan **nomor** untuk edit/hapus item\n═══════════════════════════════",
    )
    .setColor("#0099ff")
    .setTimestamp();

  let desc = "";
  game.item.forEach((item, i) => {
    const price = item.price.toLocaleString("id-ID");
    desc += `**${i + 1}.** ${item.itemName}\n`;
    desc += `   💰 Rp ${price}\n\n`;
  });

  embed.addFields({ name: "📦 Item", value: desc });
  embed.setFooter({
    text: `Total ${game.item.length} item • /jokiadmin item edit nomor_game:${nomorGame} nomor_item:<angka>`,
  });

  return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function handleItemTambah(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const nomorGame = interaction.options.getInteger("nomor_game");
  const game = await getGameByNomor(nomorGame);

  if (!game) {
    const games = await getAllGames();
    return interaction.editReply({
      content: `❌ Nomor game tidak valid! Pilih antara 1 - ${games.length}`,
    });
  }

  const nama = interaction.options.getString("nama");
  const harga = interaction.options.getInteger("harga");
  const deskripsi = interaction.options.getString("deskripsi") || "";
  const gambar = interaction.options.getAttachment("gambar");
  const syaratRaw = interaction.options.getString("syarat");
  const prosesRaw = interaction.options.getString("proses");

  let imgUrl = "";
  if (gambar) {
    if (!gambar.contentType?.startsWith("image/")) {
      return interaction.editReply({ content: "❌ File harus berupa gambar!" });
    }
    imgUrl = await uploadFromUrl(
      gambar.url,
      "joki/items",
      `item_${nama.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
    );
  }

  const syaratJoki = syaratRaw
    ? syaratRaw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const prosesJoki = prosesRaw
    ? prosesRaw
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  game.item.push({
    itemName: nama,
    price: harga,
    description: deskripsi,
    imgUrl,
    syaratJoki,
    prosesJoki,
  });
  await game.save();

  const newItem = game.item[game.item.length - 1];
  const itemNomor = game.item.length;
  const embed = createItemEmbed(
    game,
    newItem,
    itemNomor,
    "✅ Item Berhasil Ditambahkan!",
  );
  return interaction.editReply({ embeds: [embed] });
}

async function handleItemEdit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const nomorGame = interaction.options.getInteger("nomor_game");
  const nomorItem = interaction.options.getInteger("nomor_item");
  const game = await getGameByNomor(nomorGame);

  if (!game) {
    const games = await getAllGames();
    return interaction.editReply({
      content: `❌ Nomor game tidak valid! Pilih antara 1 - ${games.length}`,
    });
  }

  if (!game.item || nomorItem < 1 || nomorItem > game.item.length) {
    return interaction.editReply({
      content: `❌ Nomor item tidak valid! Pilih antara 1 - ${game.item?.length || 0}`,
    });
  }

  const item = game.item[nomorItem - 1];

  const nama = interaction.options.getString("nama");
  const harga = interaction.options.getInteger("harga");
  const deskripsi = interaction.options.getString("deskripsi");
  const gambar = interaction.options.getAttachment("gambar");
  const syaratRaw = interaction.options.getString("syarat");
  const prosesRaw = interaction.options.getString("proses");

  if (nama) item.itemName = nama;
  if (harga) item.price = harga;
  if (deskripsi !== null && deskripsi !== undefined)
    item.description = deskripsi;
  if (syaratRaw) {
    item.syaratJoki = syaratRaw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (prosesRaw) {
    item.prosesJoki = prosesRaw
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);
  }

  if (gambar) {
    if (!gambar.contentType?.startsWith("image/")) {
      return interaction.editReply({ content: "❌ File harus berupa gambar!" });
    }
    if (item.imgUrl) await deleteFromUrl(item.imgUrl);
    item.imgUrl = await uploadFromUrl(
      gambar.url,
      "joki/items",
      `item_${item.itemName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
    );
  }

  await game.save();
  const embed = createItemEmbed(
    game,
    item,
    nomorItem,
    "✅ Item Berhasil Diupdate!",
  );
  return interaction.editReply({ embeds: [embed] });
}

async function handleItemHapus(interaction) {
  const nomorGame = interaction.options.getInteger("nomor_game");
  const nomorItem = interaction.options.getInteger("nomor_item");
  const game = await getGameByNomor(nomorGame);

  if (!game) {
    const games = await getAllGames();
    return interaction.reply({
      content: `❌ Nomor game tidak valid! Pilih antara 1 - ${games.length}`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!game.item || nomorItem < 1 || nomorItem > game.item.length) {
    return interaction.reply({
      content: `❌ Nomor item tidak valid! Pilih antara 1 - ${game.item?.length || 0}`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const item = game.item[nomorItem - 1];
  const itemName = item.itemName;
  if (item.imgUrl) await deleteFromUrl(item.imgUrl);
  game.item.splice(nomorItem - 1, 1);
  await game.save();

  return interaction.reply({
    content: `✅ Item **${itemName}** (nomor ${nomorItem}) berhasil dihapus dari game **${game.gameName}**!`,
    flags: MessageFlags.Ephemeral,
  });
}

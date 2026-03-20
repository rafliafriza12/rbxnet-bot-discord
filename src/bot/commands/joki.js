import Joki from "../../models/Joki.js";

export default {
  name: "joki",
  aliases: ["jokigame", "listjoki"],
  description: "Lihat daftar joki game yang tersedia",
  async execute(message, args, client) {
    // Jika tidak ada argumen, tampilkan daftar game dengan gambar masing-masing
    if (!args[0]) {
      const jokiList = await Joki.find().select(
        "gameName developer imgUrl item"
      );

      if (jokiList.length === 0) {
        return message.reply("❌ Belum ada data joki tersedia.");
      }

      // Buat embed untuk setiap game (max 10 embeds per message)
      const embeds = jokiList.slice(0, 10).map((joki, index) => ({
        color: 0x5865f2,
        title: `${index + 1}. ${joki.gameName}`,
        description: `🏢 **Developer:** ${
          joki.developer
        }\n📦 **Paket tersedia:** ${joki.item?.length || 0} paket`,
        thumbnail: {
          url: joki.imgUrl,
        },
        footer: {
          text: `Ketik !joki ${joki.gameName.toLowerCase()} untuk detail`,
        },
      }));

      // Kirim header dulu
      await message.reply({
        content:
          "🎮 **DAFTAR JOKI GAME TERSEDIA**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        embeds: embeds,
      });

      return;
    }

    // Cari game berdasarkan nama
    const searchQuery = args.join(" ").toLowerCase();
    const joki = await Joki.findOne({
      gameName: { $regex: searchQuery, $options: "i" },
    });

    if (!joki) {
      return message.reply(
        `❌ Game "${searchQuery}" tidak ditemukan. Gunakan \`!joki\` untuk melihat daftar game.`
      );
    }

    // Format harga
    const formatPrice = (price) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(price);
    };

    // Cara pesan
    const caraPesanList =
      joki.caraPesan && joki.caraPesan.length > 0
        ? joki.caraPesan
            .map((step, index) => `${index + 1}. ${step}`)
            .join("\n")
        : "Tidak ada info";

    // Embed utama untuk info game
    const mainEmbed = {
      color: 0xffd700,
      title: `🎮 ${joki.gameName}`,
      thumbnail: {
        url: joki.imgUrl || undefined,
      },
      fields: [
        {
          name: "🏢 Developer",
          value: joki.developer || "Unknown",
          inline: true,
        },
        {
          name: "📦 Jumlah Paket",
          value: `${joki.item?.length || 0} paket`,
          inline: true,
        },
        {
          name: "📋 Cara Pesan",
          value: caraPesanList,
          inline: false,
        },
      ],
      timestamp: new Date(),
    };

    // Buat embed untuk setiap item (max 9 karena 1 untuk main embed, total max 10)
    const itemEmbeds =
      joki.item && joki.item.length > 0
        ? joki.item.slice(0, 9).map((item, index) => ({
            color: 0x00ff00,
            title: `📦 ${index + 1}. ${item.itemName}`,
            thumbnail: {
              url: item.imgUrl || joki.imgUrl || undefined,
            },
            fields: [
              {
                name: "💰 Harga",
                value: formatPrice(item.price),
                inline: true,
              },
              {
                name: "📝 Deskripsi",
                value: item.description || "Tidak ada deskripsi",
                inline: false,
              },
            ],
            footer: {
              text: `Ketik !jokidetail ${joki.gameName.toLowerCase()} ${
                index + 1
              } untuk detail lengkap`,
            },
          }))
        : [];

    // Gabungkan semua embeds
    const allEmbeds = [mainEmbed, ...itemEmbeds];

    await message.reply({ embeds: allEmbeds });
  },
};

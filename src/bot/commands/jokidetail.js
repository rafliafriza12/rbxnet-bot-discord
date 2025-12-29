import Joki from "../../models/Joki.js";

export default {
  name: "jokidetail",
  aliases: ["jd", "detailjoki"],
  description: "Lihat detail paket joki",
  async execute(message, args, client) {
    if (args.length < 2) {
      return message.reply(
        "❌ Format: `!jokidetail <nama game> <nomor paket>`\nContoh: `!jokidetail mobile legends 1`"
      );
    }

    // Ambil nomor paket (argumen terakhir)
    const paketNumber = parseInt(args[args.length - 1]);

    if (isNaN(paketNumber) || paketNumber < 1) {
      return message.reply("❌ Nomor paket harus berupa angka yang valid!");
    }

    // Nama game (semua argumen kecuali yang terakhir)
    const gameName = args.slice(0, -1).join(" ");

    const joki = await Joki.findOne({
      gameName: { $regex: gameName, $options: "i" },
    });

    if (!joki) {
      return message.reply(`❌ Game "${gameName}" tidak ditemukan.`);
    }

    if (paketNumber > joki.item.length) {
      return message.reply(
        `❌ Paket #${paketNumber} tidak ditemukan. Game ini hanya memiliki ${joki.item.length} paket.`
      );
    }

    const item = joki.item[paketNumber - 1];

    // Format harga
    const formatPrice = (price) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(price);
    };

    const syaratList =
      item.syaratJoki.map((s, i) => `${i + 1}. ${s}`).join("\n") || "Tidak ada";
    const prosesList =
      item.prosesJoki.map((p, i) => `${i + 1}. ${p}`).join("\n") || "Tidak ada";

    const embed = {
      color: 0x00ff00,
      title: `📦 ${item.itemName}`,
      thumbnail: {
        url: joki.imgUrl,
      },
      image: {
        url: item.imgUrl || joki.imgUrl,
      },
      fields: [
        {
          name: "🎮 Game",
          value: joki.gameName,
          inline: true,
        },
        {
          name: "💰 Harga",
          value: formatPrice(item.price),
          inline: true,
        },
        {
          name: "📝 Deskripsi",
          value: item.description,
          inline: false,
        },
        {
          name: "📋 Syarat Joki",
          value: syaratList,
          inline: false,
        },
        {
          name: "⚙️ Proses Joki",
          value: prosesList,
          inline: false,
        },
      ],
      footer: {
        text: `Paket #${paketNumber} dari ${joki.item.length} paket`,
      },
      timestamp: new Date(),
    };

    await message.reply({ embeds: [embed] });
  },
};

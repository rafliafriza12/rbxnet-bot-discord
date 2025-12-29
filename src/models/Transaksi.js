import mongoose from "mongoose";

const transaksiSchema = new mongoose.Schema({
  oderId: {
    type: String,
    unique: true,
    required: true,
  },
  discordId: {
    type: String,
    required: true,
    index: true,
  },
  discordUsername: {
    type: String,
    required: true,
  },
  gameName: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "process", "completed", "cancelled"],
    default: "pending",
  },
  transactionDate: {
    type: Date,
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
  createdBy: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate order ID yang unik
transaksiSchema.statics.generateOrderId = async function () {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  // Cari order ID terakhir hari ini
  const lastOrder = await this.findOne({
    oderId: { $regex: `^TRX${dateStr}` },
  }).sort({ oderId: -1 });

  let nextNumber = 1;
  if (lastOrder) {
    // Extract nomor dari order ID terakhir
    const lastNumber = parseInt(lastOrder.oderId.slice(-4));
    nextNumber = lastNumber + 1;
  }

  // Generate order ID dengan nomor berikutnya
  let orderId = `TRX${dateStr}${String(nextNumber).padStart(4, "0")}`;

  // Double check untuk memastikan tidak duplikat
  const exists = await this.findOne({ oderId: orderId });
  if (exists) {
    // Jika masih duplikat, tambah random suffix
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase();
    orderId = `TRX${dateStr}${String(nextNumber).padStart(
      4,
      "0"
    )}${randomSuffix}`;
  }

  return orderId;
};

// Update timestamp on save
transaksiSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Transaksi", transaksiSchema);

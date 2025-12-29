import mongoose from "mongoose";

const guildSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    prefix: {
      type: String,
      default: "!",
    },
    welcomeChannel: {
      type: String,
      default: null,
    },
    welcomeMessage: {
      type: String,
      default: "Selamat datang {user} di {server}!",
    },
    logChannel: {
      type: String,
      default: null,
    },
    autoRole: {
      type: String,
      default: null,
    },
    settings: {
      levelSystem: {
        type: Boolean,
        default: true,
      },
      welcomeSystem: {
        type: Boolean,
        default: true,
      },
      antiSpam: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Guild", guildSchema);

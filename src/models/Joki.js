import mongoose from "mongoose";

const JokiItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  imgUrl: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  syaratJoki: [
    {
      type: String,
      trim: true,
    },
  ],
  prosesJoki: [
    {
      type: String,
      trim: true,
    },
  ],
});

const JokiSchema = new mongoose.Schema(
  {
    gameName: {
      type: String,
      required: true,
      trim: true,
    },
    imgUrl: {
      type: String,
      default: "",
    },
    developer: {
      type: String,
      required: true,
      trim: true,
    },
    caraPesan: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    item: [JokiItemSchema],
  },
  {
    timestamps: true,
  },
);

// Add indexes
JokiSchema.index({ gameName: 1 });
JokiSchema.index({ createdAt: -1 });

export default mongoose.models.Joki || mongoose.model("Joki", JokiSchema);

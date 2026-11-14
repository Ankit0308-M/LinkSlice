
const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },

    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ""
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    links: [
      {
        label: {
          type: String,
          required: true,
          trim: true,
          maxlength: 60
        },
        url: {
          type: String,
          required: true,
          trim: true
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);

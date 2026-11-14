
const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    // Unique shortened URL identifier
    shortId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // Original destination URL
    redirectUrl: {
      type: String,
      required: true,
      trim: true
    },

    // User who created this URL
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Click history
    visitHistory: [
      {
        visitedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Efficient user-specific history queries
urlSchema.index({
  createdBy: 1,
  createdAt: -1
});

const URL = mongoose.model("URL", urlSchema);

module.exports = URL;

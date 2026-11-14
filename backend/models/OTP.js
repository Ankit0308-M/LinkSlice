const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    // User's email
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    // Why OTP was generated
    purpose: {
      type: String,
      enum: ["register", "login"],
      required: true
    },

    // Hashed OTP, never store the original OTP
    otpHash: {
      type: String,
      required: true
    },

    // OTP expiry time
    expiresAt: {
      type: Date,
      required: true
    },

    // Maximum verification attempts
    attempts: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Automatically delete expired OTP documents
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// One active OTP per email and purpose
otpSchema.index(
  { email: 1, purpose: 1 },
  { unique: true }
);

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
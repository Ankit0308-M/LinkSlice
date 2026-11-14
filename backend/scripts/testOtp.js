require("dotenv").config();

const connectDB = require("../config/db");
const mongoose = require("mongoose");

const OTP = require("../models/OTP");

const createAndSendOTP = require("../utils/otpService");

const testOTP = async () => {
  try {
    // Check configuration
    if (!process.env.TEST_EMAIL) {
      throw new Error("TEST_EMAIL is missing in .env");
    }

    if (!process.env.OTP_SECRET) {
      throw new Error("OTP_SECRET is missing in .env");
    }

    // Connect MongoDB
    await connectDB();

    // Ensure indexes are created
    await OTP.init();

    // Send registration OTP
    const result = await createAndSendOTP(
      process.env.TEST_EMAIL,
      "register"
    );

    console.log("--------------------------------");
    console.log("OTP TEST SUCCESSFUL");
    console.log(result.message);
    console.log("Message ID:", result.messageId);
    console.log("--------------------------------");

    // Verify OTP record exists without exposing its hash
    const record = await OTP.findOne({
      email: process.env.TEST_EMAIL.toLowerCase(),
      purpose: "register"
    }).select("email purpose expiresAt attempts");

    console.log("MongoDB OTP record:", record);

  } catch (error) {
    console.error("OTP TEST FAILED:", error.message);

  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testOTP();
const OTP = require("../models/OTP");

const {
  generateOTP,
  hashOTP
} = require("./otp");

const sendOTPEmail = require("./sendOTP");

const createAndSendOTP = async (email, purpose) => {
  try {
    // Normalize email
    email = email.trim().toLowerCase();

    // Validate purpose
    if (!["register", "login"].includes(purpose)) {
      throw new Error("Invalid OTP purpose");
    }

    // Generate secure OTP
    const otp = generateOTP();

    // Hash OTP
    const otpHash = hashOTP(otp);

    // Set expiry to 5 minutes
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Store hashed OTP in MongoDB
    const savedOTP = await OTP.findOneAndUpdate(
      {
        email,
        purpose
      },
      {
        $set: {
          otpHash,
          expiresAt,
          attempts: 0
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    try {
      // Send original OTP through Brevo
      const emailResponse = await sendOTPEmail(
        email,
        otp
      );

      return {
        success: true,
        message: "OTP sent successfully",
        messageId: emailResponse.messageId
      };

    } catch (emailError) {
      // Remove this OTP if email delivery request fails.
      await OTP.deleteOne({
        _id: savedOTP._id,
        otpHash
      });

      throw emailError;
    }

  } catch (error) {
    console.error("OTP service error:", error.message);
    throw error;
  }
};

module.exports = createAndSendOTP;
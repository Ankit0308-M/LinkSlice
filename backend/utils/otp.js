const crypto = require("crypto");

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Use HMAC-SHA256 with a private server secret
const hashOTP = (otp) => {
  if (!process.env.OTP_SECRET) {
    throw new Error("OTP_SECRET is missing");
  }

  return crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(otp)
    .digest("hex");
};

const verifyOTP = (otp, storedHash) => {
  const calculatedHash = Buffer.from(hashOTP(otp), "hex");
  const savedHash = Buffer.from(storedHash, "hex");

  if (calculatedHash.length !== savedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(calculatedHash, savedHash);
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP
};
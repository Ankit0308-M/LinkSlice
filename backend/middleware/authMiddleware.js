
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    // Read JWT from HTTP-only cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login."
      });
    }

    // Verify JWT signature and expiry
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find user using JWT payload
    const user = await User.findById(decoded.id);

    if (!user || !user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "User not found or not verified"
      });
    }

    // Attach user to request
    req.user = user;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token"
    });
  }
};

module.exports = protect;

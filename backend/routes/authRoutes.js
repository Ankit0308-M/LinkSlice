
const express = require("express");

const router = express.Router();



const {
  register,
  verifyRegister,
  login,
  verifyLogin,
  getMe,
  updateProfile,
  logout
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const { rateLimit } = require("express-rate-limit");

// Registration limiter
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

// OTP verification limiter
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

// Login limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

// Register
router.post(
  "/register",
  registerLimiter,
  register
);

// Verify registration OTP
router.post(
  "/verify-register",
  verifyLimiter,
  verifyRegister
);

// Login using password and send OTP
router.post(
  "/login",
  loginLimiter,
  login
);

// Verify login OTP and issue JWT
router.post(
  "/verify-login",
  verifyLimiter,
  verifyLogin
);


// Get current logged-in user
router.get(
  "/me",
  protect,
  getMe
);


// Update current user's profile
router.patch(
  "/profile",
  protect,
  updateProfile
);



// Logout
router.post(
  "/logout",
  logout
);

module.exports = router;

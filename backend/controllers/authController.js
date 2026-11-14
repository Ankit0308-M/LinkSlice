
const User = require("../models/User");
const OTP = require("../models/OTP");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createAndSendOTP = require("../utils/otpService");

const { verifyOTP } = require("../utils/otp");


// COOKIE CONFIGURATION\


const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000
});

// GENERATE JWT

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }

  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// 1. REGISTER USER


exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2 || normalizedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name must contain 2 to 50 characters"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address"
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must contain 8 to 72 characters"
      });
    }

    let user = await User.findOne({
      email: normalizedEmail
    });

    if (user && user.isVerified) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (user) {
      user.name = normalizedName;
      user.password = hashedPassword;
      await user.save();
    } else {
      user = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        isVerified: false
      });
    }

    try {
      await createAndSendOTP(
        normalizedEmail,
        "register"
      );
    } catch (error) {
      console.error("Registration OTP error:", error.message);

      return res.status(502).json({
        success: false,
        message: "Could not send registration OTP"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Registration OTP sent successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
};

// 2. VERIFY REGISTRATION OTP


exports.verifyRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (
      typeof email !== "string" ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid email and six-digit OTP are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      purpose: "register"
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired"
      });
    }

    if (otpRecord.expiresAt <= new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(429).json({
        success: false,
        message: "Maximum attempts reached"
      });
    }

    const isValid = verifyOTP(otp, otpRecord.otpHash);

    if (!isValid) {
      await OTP.updateOne(
        {
          _id: otpRecord._id,
          attempts: { $lt: 5 }
        },
        {
          $inc: { attempts: 1 }
        }
      );

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP"
      });
    }

    const consumedOTP = await OTP.findOneAndDelete({
      _id: otpRecord._id,
      otpHash: otpRecord.otpHash,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: 5 }
    });

    if (!consumedOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or already used"
      });
    }

    const user = await User.findOneAndUpdate(
      {
        email: normalizedEmail,
        isVerified: false
      },
      {
        $set: { isVerified: true }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Registration not found or already verified"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("Registration verification error:", error);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed"
    });
  }
};

// 3. LOGIN WITH EMAIL AND PASSWORD


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();


    const user = await User.findOne({
      email: normalizedEmail
    }).select("+password");


    if (!user || !user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or unverified account"
      });
    }


    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    await createAndSendOTP(
      normalizedEmail,
      "login"
    );

    return res.status(200).json({
      success: true,
      message: "Login OTP sent successfully",
      email: normalizedEmail
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
};

// 4. VERIFY LOGIN OTP AND ISSUE JWT

exports.verifyLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (
      typeof email !== "string" ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid email and six-digit OTP are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      purpose: "login"
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Login OTP not found or expired"
      });
    }

    if (otpRecord.expiresAt <= new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(400).json({
        success: false,
        message: "Login OTP expired"
      });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(429).json({
        success: false,
        message: "Maximum OTP attempts reached"
      });
    }

    const isValid = verifyOTP(otp, otpRecord.otpHash);

    if (!isValid) {
      await OTP.updateOne(
        {
          _id: otpRecord._id,
          attempts: { $lt: 5 }
        },
        {
          $inc: { attempts: 1 }
        }
      );

      return res.status(400).json({
        success: false,
        message: "Incorrect login OTP"
      });
    }


    const user = await User.findOne({
      email: normalizedEmail,
      isVerified: true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or not verified"
      });
    }


    const consumedOTP = await OTP.findOneAndDelete({
      _id: otpRecord._id,
      otpHash: otpRecord.otpHash,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: 5 }
    });

    if (!consumedOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or already used"
      });
    }


    const token = generateToken(user._id);

    res.cookie("token", token, cookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("Login OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Login OTP verification failed"
    });
  }
};


// 5. GET CURRENT LOGGED-IN USER


exports.getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isVerified: req.user.isVerified
    }
  });
};

 // 6. UPDATE USER PROFILE


exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    const normalizedName = name.trim();

    if (normalizedName.length < 2 || normalizedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name must contain 2 to 50 characters"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name: normalizedName } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile"
    });
  }
};

// 6. LOGOUT


exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};

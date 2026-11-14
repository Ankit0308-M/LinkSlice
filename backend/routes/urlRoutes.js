
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createShortUrl,
  redirectUrl,
  getUserUrls,
  deleteUrl,
  getDashboardStats,getAnalytics
} = require("../controllers/urlControllers");
// All URL management routes require authentication

// Create short URL
router.post("/", protect, createShortUrl);

// Get logged-in user's URL history
router.get("/", protect, getUserUrls);

// Delete a URL by MongoDB document ID
router.delete("/:id", protect, deleteUrl);

router.get(
  "/dashboard/stats",
  protect,
  getDashboardStats
);


// Advanced analytics
router.get("/analytics", protect, getAnalytics);

module.exports = router;


const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createPage,
  getMyPages,
  getMyPage,
  updatePage,
  deletePage,
  getPublicPage
} = require("../controllers/pageController");

// Public route - no authentication required
router.get("/public/:slug", getPublicPage);

// Protected routes
router.post("/", protect, createPage);
router.get("/", protect, getMyPages);
router.get("/:id", protect, getMyPage);
router.put("/:id", protect, updatePage);
router.delete("/:id", protect, deletePage);

module.exports = router;

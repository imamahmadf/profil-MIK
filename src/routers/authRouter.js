const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

// Login route
router.post("/login", authController.login);

// Get current user (protected route)
router.get("/me", authenticate, authController.getCurrentUser);

module.exports = router;

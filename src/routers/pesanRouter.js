const express = require("express");
const router = express.Router();
const pesanController = require("../controllers/pesanController");
const { authenticate } = require("../middleware/authMiddleware");

// Public route - untuk contact form
router.post("/", pesanController.createPesan);

// Protected routes (require authentication) - untuk admin
router.get("/", authenticate, pesanController.getAllPesan);
// Route yang lebih spesifik harus diletakkan sebelum route :id
router.patch("/:id/read", authenticate, pesanController.markAsRead);
router.patch("/:id/replied", authenticate, pesanController.markAsReplied);
router.get("/:id", authenticate, pesanController.getPesanById);
router.put("/:id", authenticate, pesanController.updatePesan);
router.delete("/:id", authenticate, pesanController.deletePesan);

module.exports = router;

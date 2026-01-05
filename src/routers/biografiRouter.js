const express = require("express");
const router = express.Router();
const biografiController = require("../controllers/biografiController");
const { authenticate } = require("../middleware/authMiddleware");

// Public routes
router.get("/", biografiController.getBiografi); // Get biografi untuk public
router.get("/all", biografiController.getAllBiografi); // Get all biografi (untuk admin)
router.get("/:id", biografiController.getBiografiById);

// Protected routes (require authentication)
router.post("/", authenticate, biografiController.createBiografi);
router.put("/:id", authenticate, biografiController.updateBiografi);
router.delete("/:id", authenticate, biografiController.deleteBiografi);

module.exports = router;

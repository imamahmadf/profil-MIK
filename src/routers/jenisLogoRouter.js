const express = require("express");
const router = express.Router();
const jenisLogoController = require("../controllers/jenisLogoController");
const { authenticate } = require("../middleware/authMiddleware");

// Public routes
router.get("/", jenisLogoController.getAllJenisLogo);
router.get("/:id", jenisLogoController.getJenisLogoById);

// Protected routes (require authentication)
router.post("/", authenticate, jenisLogoController.createJenisLogo);
router.put("/:id", authenticate, jenisLogoController.updateJenisLogo);
router.delete("/:id", authenticate, jenisLogoController.deleteJenisLogo);

module.exports = router;


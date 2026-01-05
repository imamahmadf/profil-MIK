const express = require("express");
const router = express.Router();
const heroController = require("../controllers/heroController");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadFotoHero } = require("../middleware/uploadHeroMiddleware");

// Public routes
router.get("/", heroController.getHero); // Get hero aktif untuk beranda
router.get("/all", heroController.getAllHero); // Get all hero (untuk admin)
router.get("/:id", heroController.getHeroById);

// Protected routes (require authentication)
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    uploadFotoHero(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  heroController.createHero
);
router.put(
  "/:id",
  authenticate,
  (req, res, next) => {
    uploadFotoHero(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  heroController.updateHero
);
router.delete("/:id", authenticate, heroController.deleteHero);

module.exports = router;

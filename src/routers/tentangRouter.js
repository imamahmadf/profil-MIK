const express = require("express");
const router = express.Router();
const tentangController = require("../controllers/tentangController");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadFotoTentang } = require("../middleware/uploadTentangMiddleware");

// Public routes
router.get("/", tentangController.getTentang); // Get tentang untuk beranda
router.get("/all", tentangController.getAllTentang); // Get all tentang (untuk admin)
router.get("/:id", tentangController.getTentangById);

// Protected routes (require authentication)
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    uploadFotoTentang(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  tentangController.createTentang
);
router.put(
  "/:id",
  authenticate,
  (req, res, next) => {
    uploadFotoTentang(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  tentangController.updateTentang
);
router.delete("/:id", authenticate, tentangController.deleteTentang);

module.exports = router;

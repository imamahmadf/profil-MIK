const express = require("express");
const router = express.Router();
const rekamJejakController = require("../controllers/rekamJejakController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  uploadFotoRekamJejak,
} = require("../middleware/uploadRekamJejakMiddleware");

// Public routes
router.get("/", rekamJejakController.getAllRekamJejak);
router.get("/:id", rekamJejakController.getRekamJejakById);
router.get("/slug/:slug", rekamJejakController.getRekamJejakBySlug);

// Protected routes (require authentication)
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    uploadFotoRekamJejak(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  rekamJejakController.createRekamJejak
);
router.put(
  "/:id",
  authenticate,
  (req, res, next) => {
    uploadFotoRekamJejak(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  rekamJejakController.updateRekamJejak
);
router.delete("/:id", authenticate, rekamJejakController.deleteRekamJejak);

module.exports = router;
